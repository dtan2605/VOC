from __future__ import annotations

import logging
import re
import uuid
from typing import Any, Awaitable, Callable, Literal

from app.models.state import SessionState, TurnState
from app.services.llm_service import llm_service
from app.services.memory_service import memory_service
from app.services.scoring_service import scoring_service
from app.services.tts_service import tts_service
from app.utils.helpers import build_history_text, clean, topic_text, truncate_words, utc_now

logger = logging.getLogger("voc.speech-service.conversation")


def build_history_text(turns: list[TurnState]) -> str:
    if not turns:
        return "(no prior turns)"
    return "\n".join(
        f"Q: {turn.question}\nA: {turn.user_transcript}\nCoach: {turn.assistant_reply}"
        for turn in turns[-4:]
    )


def build_recent_assistant_replies(turns: list[TurnState], limit: int = 3) -> str:
    replies = [clean(turn.assistant_reply) for turn in turns[-limit:] if clean(turn.assistant_reply)]
    if not replies:
        return "(none yet)"
    return "\n".join(f"- {reply}" for reply in replies)


class ConversationService:
    async def generate_opening_question(self, session: SessionState) -> str:
        system_prompt = (
            "You are a warm, natural conversation partner and IELTS speaking coach. "
            "Ask exactly one short opening question to start the conversation. "
            "Avoid generic openers like 'What's on your mind today?'. "
            "Make it specific to the topic if provided, or general if not. "
            "Return JSON with a single key named 'question'."
        )

        user_prompt = (
            f"Conversation style: {session.part.replace('_', ' ').title()}\n"
            f"Topic: {topic_text(session.topic) or 'free conversation'}\n"
            f"User goal: {session.user_goal or 'none'}\n\n"
            "Ask a warm, concise opening question that starts a natural conversation."
        )

        result = await llm_service.call_with_timeout(
            system_prompt,
            user_prompt,
            timeout_seconds=50.0,
            temperature=0.55,
            context="Opening question",
        )

        if not result:
            logger.warning("LLM call failed for opening question, using fallback")
            return self._fallback_opening_question(session)

        question = clean(result.get("question", ""))
        if not question:
            logger.warning("LLM returned empty question, using fallback")
            return self._fallback_opening_question(session)

        return question

    def _fallback_opening_question(self, session: SessionState) -> str:
        topic = topic_text(session.topic)
        if topic:
            return f"Let's talk about {topic}. What's your experience with it?"
        return "Hi! How's your day going so far?"

    async def evaluate_turn(self, session: SessionState, transcript: str) -> dict[str, Any]:
        history_text = build_history_text(session.turns)
        recent_replies = build_recent_assistant_replies(session.turns)
        memory_prompt = memory_service.build_memory_prompt(session)

        system_prompt = (
            "You are a warm, natural conversation partner and IELTS speaking coach. "
            "Keep the reply human, casual, and supportive. Never sound like a grading report. "
            "Use the memory summary only for stable facts, and return valid JSON only. "
            "Do not mention the memory summary directly. "
            "Avoid repetitive openers like 'I remember you mentioning', 'That connects nicely', "
            "'I can follow your point', or 'That makes sense'. "
            "Vary your sentence openings and sound like a real person talking."
        )

        user_prompt = (
            f"Conversation style: {session.part.replace('_', ' ').title()}\n"
            f"Conversation topic: {topic_text(session.topic) or 'free conversation'}\n"
            f"User goal: {session.user_goal or 'none'}\n"
            f"Current memory summary: {memory_prompt}\n"
            f"Recent assistant replies:\n{recent_replies}\n\n"
            f"Conversation history:\n{history_text}\n\n"
            f"Latest user answer:\n{transcript}\n\n"
            "Return JSON with exactly these keys:\n"
            "{\n"
            '  "assistantReply": "2-3 short conversational sentences",\n'
            '  "followUpQuestion": "one natural follow-up question that continues the conversation",\n'
            '  "speakingSummary": "1-2 short sentences about fluency, coherence, and content quality",\n'
            '  "pronunciationSummary": "1 short sentence about pronunciation and pacing",\n'
            '  "memorySummary": "a concise memory note that keeps stable facts or preferences for future turns",\n'
            '  "scores": {\n'
            '    "fluencyAndCoherence": 1-9,\n'
            '    "lexicalResource": 1-9,\n'
            '    "grammaticalRangeAccuracy": 1-9,\n'
            '    "pronunciation": 1-9,\n'
            '    "overall": 1-9\n'
            "  },\n"
            '  "errors": [\n'
            '    {"issue": "short label", "correction": "helpful advice", "example": "one short example"}\n'
            "  ],\n"
            '  "rephrasing": "an improved version of the user\'s answer"\n'
            "}\n\n"
            "Rules: avoid generic openers, keep the reply warm and natural, update the memory using only stable details, "
            "do not repeat the user's sentence verbatim, avoid echoing the user's exact words, "
            "and make the follow-up question feel like real conversation."
        )

        result = await llm_service.call_with_timeout(
            system_prompt,
            user_prompt,
            timeout_seconds=45.0,
            temperature=0.6,
            context="Turn evaluation",
        )

        if not result:
            return self._fallback_evaluation(transcript, session)

        assistant_reply = clean(result.get("assistantReply", ""))
        if not assistant_reply:
            assistant_reply = self._generate_fallback_reply(transcript, session)

        if self._reply_needs_rewrite(assistant_reply, recent_replies):
            rewritten = await self._rewrite_reply(session, transcript, assistant_reply, recent_replies)
            if rewritten:
                assistant_reply = rewritten

        scores = scoring_service.normalize_scores(result.get("scores"), transcript)
        errors = scoring_service.normalize_errors(result.get("errors"))

        return {
            "assistantReply": assistant_reply,
            "followUpQuestion": clean(result.get("followUpQuestion")) or "What else can you tell me about that?",
            "speakingSummary": clean(result.get("speakingSummary")) or "Your answer was clear and easy to understand.",
            "pronunciationSummary": clean(result.get("pronunciationSummary")) or "Your pronunciation was generally good.",
            "memorySummary": truncate_words(clean(result.get("memorySummary")) or "", 80),
            "scores": scores,
            "errors": errors,
            "rephrasing": clean(result.get("rephrasing")) or clean(transcript),
        }

    def _fallback_evaluation(self, transcript: str, session: SessionState) -> dict[str, Any]:
        logger.warning("LLM call failed, using fallback response")
        reply = self._generate_fallback_reply(transcript, session)
        follow_up = self._generate_fallback_follow_up(transcript, session)

        return {
            "assistantReply": reply,
            "followUpQuestion": follow_up,
            "speakingSummary": "Your answer was clear and easy to understand, with good flow and relevant content.",
            "pronunciationSummary": "Your pronunciation was generally good, with some minor issues.",
            "memorySummary": "",
            "scores": scoring_service.DEFAULT_SCORES.copy(),
            "errors": [],
            "rephrasing": clean(transcript),
            "_llmFallback": True,
        }

    def _generate_fallback_reply(self, transcript: str, session: SessionState) -> str:
        topic = topic_text(session.topic)
        if topic:
            return f"That's interesting about {topic}. Tell me more about your experience."
        return "That's interesting. Can you tell me more about that?"

    def _generate_fallback_follow_up(self, transcript: str, session: SessionState) -> str:
        return "What else can you tell me about that?"

    def _reply_needs_rewrite(self, reply: str, recent_replies: str) -> bool:
        normalized_reply = clean(reply).lower()
        if not normalized_reply:
            return True

        stock_phrases = [
            "i remember you mentioning",
            "that connects nicely",
            "i can follow your point",
            "i'm glad you brought that up",
            "that fits with what you shared",
        ]
        if any(phrase in normalized_reply for phrase in stock_phrases):
            return True

        reply_tokens = set(re.findall(r"[A-Za-z']+", normalized_reply))
        if len(reply_tokens) < 6:
            return False

        for line in recent_replies.splitlines():
            recent_reply = clean(line.lstrip("- ").strip()).lower()
            if not recent_reply:
                continue
            recent_tokens = set(re.findall(r"[A-Za-z']+", recent_reply))
            if not recent_tokens:
                continue
            overlap = len(reply_tokens & recent_tokens) / max(len(reply_tokens | recent_tokens), 1)
            if overlap >= 0.55:
                return True

        return False

    async def _rewrite_reply(
        self,
        session: SessionState,
        transcript: str,
        current_reply: str,
        recent_replies: str,
    ) -> str | None:
        system_prompt = (
            "You rewrite assistant replies so they sound natural, varied, and human. "
            "Return valid JSON only."
        )
        user_prompt = (
            f"Conversation style: {session.part.replace('_', ' ').title()}\n"
            f"Conversation topic: {topic_text(session.topic) or 'free conversation'}\n"
            f"User goal: {session.user_goal or 'none'}\n"
            f"Current memory summary: {memory_service.build_memory_prompt(session)}\n"
            f"Recent assistant replies:\n{recent_replies}\n\n"
            f"Latest user answer:\n{transcript}\n\n"
            f"Current reply:\n{current_reply}\n\n"
            "Rewrite the current reply into 2-3 short conversational sentences. "
            "Avoid stock coaching phrases, avoid repeating the user's wording, "
            "and make it feel like a real person responding in a chat."
        )

        result = await llm_service.call_with_timeout(
            system_prompt,
            user_prompt,
            timeout_seconds=30.0,
            temperature=0.75,
            context="Reply rewrite",
        )

        if not result:
            return None

        return clean(result.get("assistantReply")) or None

    def build_turn(
        self,
        session: SessionState,
        transcript: str,
        source: Literal["audio", "text"],
        analysis: dict[str, Any],
    ) -> TurnState:
        turn_index = len(session.turns) + 1
        return TurnState(
            turn_id=str(uuid.uuid4()),
            turn_index=turn_index,
            question=session.current_question,
            user_transcript=transcript,
            assistant_reply=analysis["assistantReply"],
            follow_up_question=analysis["followUpQuestion"],
            speaking_summary=analysis["speakingSummary"],
            pronunciation_summary=analysis["pronunciationSummary"],
            memory_summary=analysis["memorySummary"],
            source=source,
            scores=analysis["scores"],
            errors=analysis["errors"],
            rephrasing=analysis["rephrasing"],
            word_count=len(re.findall(r"[A-Za-z']+", transcript)),
            tts_audio_base64=None,
            tts_mime_type=None,
            created_at_utc=utc_now(),
        )


conversation_service = ConversationService()
