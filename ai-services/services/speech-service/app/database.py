from __future__ import annotations

import logging
import queue
import threading
from typing import Any

import pymysql
from pymysql.cursors import DictCursor

from app.config import settings

logger = logging.getLogger("voc.speech-service.database")


class ConnectionPool:
    def __init__(self, pool_size: int = 10, recycle: int = 3600) -> None:
        self._pool: queue.Queue = queue.Queue(maxsize=pool_size)
        self._pool_size = pool_size
        self._recycle = recycle
        self._lock = threading.Lock()
        self._created = 0
        self._initialized = False

    def _create_connection(self) -> pymysql.connections.Connection:
        return pymysql.connect(
            host=settings.db_host,
            port=settings.db_port,
            user=settings.db_user,
            password=settings.db_password,
            database=settings.db_name,
            charset="utf8mb4",
            cursorclass=DictCursor,
            autocommit=False,
            connect_timeout=5,
            read_timeout=10,
            write_timeout=10,
        )

    def get_connection(self) -> pymysql.connections.Connection:
        with self._lock:
            if not self._initialized:
                self._initialized = True

        try:
            conn = self._pool.get_nowait()
            try:
                conn.ping(reconnect=True)
                return conn
            except Exception:
                with self._lock:
                    self._created -= 1
                return self._create_new_connection()
        except queue.Empty:
            with self._lock:
                if self._created < self._pool_size:
                    self._created += 1
                    try:
                        return self._create_connection()
                    except Exception:
                        self._created -= 1
                        raise

            return self._create_new_connection()

    def _create_new_connection(self) -> pymysql.connections.Connection:
        with self._lock:
            self._created += 1
        return self._create_connection()

    def return_connection(self, conn: pymysql.connections.Connection) -> None:
        try:
            self._pool.put_nowait(conn)
        except queue.Full:
            try:
                conn.close()
            except Exception:
                pass
            with self._lock:
                self._created -= 1

    def close_all(self) -> None:
        while True:
            try:
                conn = self._pool.get_nowait()
                conn.close()
                with self._lock:
                    self._created -= 1
            except queue.Empty:
                break


pool = ConnectionPool(pool_size=settings.db_pool_size, recycle=settings.db_pool_recycle)


class PooledConnection:
    def __init__(self) -> None:
        self._conn: pymysql.connections.Connection | None = None

    def __enter__(self) -> pymysql.connections.Connection:
        self._conn = pool.get_connection()
        return self._conn

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if self._conn:
            if exc_type is not None:
                try:
                    self._conn.rollback()
                except Exception:
                    pass
            pool.return_connection(self._conn)
            self._conn = None


def get_connection() -> PooledConnection:
    return PooledConnection()


SCHEMA_SQL = [
    """
    CREATE TABLE IF NOT EXISTS speaking_sessions (
        session_id VARCHAR(36) NOT NULL,
        part VARCHAR(20) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        user_goal LONGTEXT NULL,
        auto_speak TINYINT(1) NOT NULL,
        status VARCHAR(20) NOT NULL,
        current_question LONGTEXT NOT NULL,
        memory_summary LONGTEXT NOT NULL,
        created_at_utc DATETIME(6) NOT NULL,
        updated_at_utc DATETIME(6) NOT NULL,
        PRIMARY KEY (session_id),
        INDEX ix_speaking_sessions_status_updated (status, updated_at_utc)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """,
    """
    CREATE TABLE IF NOT EXISTS speaking_turns (
        turn_id VARCHAR(36) NOT NULL,
        session_id VARCHAR(36) NOT NULL,
        turn_index INT NOT NULL,
        question LONGTEXT NOT NULL,
        user_transcript LONGTEXT NOT NULL,
        assistant_reply LONGTEXT NOT NULL,
        follow_up_question LONGTEXT NOT NULL,
        speaking_summary LONGTEXT NOT NULL,
        pronunciation_summary LONGTEXT NOT NULL,
        memory_summary LONGTEXT NOT NULL,
        source VARCHAR(10) NOT NULL,
        scores_json LONGTEXT NOT NULL,
        errors_json LONGTEXT NOT NULL,
        rephrasing LONGTEXT NOT NULL,
        word_count INT NOT NULL,
        tts_audio_base64 LONGTEXT NULL,
        tts_mime_type VARCHAR(100) NULL,
        created_at_utc DATETIME(6) NOT NULL,
        PRIMARY KEY (turn_id),
        UNIQUE KEY ux_speaking_turns_session_index (session_id, turn_index),
        INDEX ix_speaking_turns_session_created (session_id, created_at_utc),
        CONSTRAINT fk_speaking_turns_session
            FOREIGN KEY (session_id) REFERENCES speaking_sessions(session_id)
            ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """,
]


def ensure_schema() -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                for sql in SCHEMA_SQL:
                    cursor.execute(sql)
            conn.commit()
        return True
    except Exception as exc:
        logger.warning("Failed to ensure schema: %s", exc)
        return False
