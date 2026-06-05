import { useEffect, useMemo, useRef, useState } from 'react'
import { Mic, MicOff, RefreshCcw, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../hooks/useAuth'

type Role = 'idle' | 'listening' | 'thinking' | 'speaking'

function buildWebSocketUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim()

  if (!configuredBase) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}${normalizedPath}`
  }

  const baseUrl = new URL(configuredBase, window.location.origin)
  const protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  const basePath = baseUrl.pathname.replace(/\/$/, '').replace(/\/api$/, '')

  return `${protocol}//${baseUrl.host}${basePath}${normalizedPath}`
}

const DEFAULT_AUDIO_MIME_TYPE = 'audio/webm;codecs=opus'

function RoleBadge({ role }: { role: Role }) {
  const label = {
    idle: 'Ready',
    listening: 'Listening',
    thinking: 'Thinking',
    speaking: 'Speaking',
  }[role]

  const dotColor = {
    idle: 'bg-[var(--voc-text-soft)]',
    listening: 'bg-[#16a34a]',
    thinking: 'bg-[#eab308]',
    speaking: 'bg-[var(--voc-accent)]',
  }[role]

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--voc-panel-muted)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--voc-text-soft)]">
      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  )
}

function ensureAudioConstraints(): MediaStreamConstraints {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1,
    },
    video: false,
  }
}

async function getSupportedMimeType(): Promise<string> {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return DEFAULT_AUDIO_MIME_TYPE
}

export default function AISpeakingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [role, setRole] = useState<Role>('idle')
  const [transcript, setTranscript] = useState('')
  const [assistant, setAssistant] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [micReady, setMicReady] = useState(false)
  const [receivingAudio, setReceivingAudio] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const assistantAudioRef = useRef<HTMLAudioElement | null>(null)
  const recordingRef = useRef(false)
  const assistantFinalRef = useRef(false)
  const retryCountRef = useRef(0)
  const reconnectTimerRef = useRef<number | null>(null)
  const recvTimerRef = useRef<number | null>(null)

  const clearReconnectTimer = () => {
    if (typeof window !== 'undefined' && reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }

  const markReceiving = () => {
    if (typeof window !== 'undefined' && recvTimerRef.current != null) {
      window.clearTimeout(recvTimerRef.current)
    }
    setReceivingAudio(true)
    recvTimerRef.current = window.setTimeout(() => {
      setReceivingAudio(false)
      recvTimerRef.current = null
    }, 300)
  }

  const resetState = () => {
    setTranscript('')
    setAssistant('')
    assistantFinalRef.current = false
  }

  const playAssistantAudio = (audioBase64?: string | null, mimeType?: string | null) => {
    if (!audioBase64) return
    try {
      assistantAudioRef.current?.pause()
      const audio = new Audio(`data:${mimeType || 'audio/wav'};base64,${audioBase64}`)
      assistantAudioRef.current = audio
      void audio.play().catch(() => {
        setError('AI audio is ready, but the browser blocked autoplay. Tap the page and try again.')
      })
    } catch {
      setError('Could not play AI audio response.')
    }
  }

  const sendRecordedAudio = async (recorder: MediaRecorder) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return
    const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || DEFAULT_AUDIO_MIME_TYPE })
    audioChunksRef.current = []
    if (audioBlob.size === 0) {
      setRole('idle')
      return
    }

    try {
      wsRef.current.send(JSON.stringify({ type: 'audio_start', mimeType: audioBlob.type }))
      wsRef.current.send(await audioBlob.arrayBuffer())
      wsRef.current.send(JSON.stringify({ type: 'audio_end' }))
      markReceiving()
      setRole('thinking')
    } catch (e) {
      console.warn('[MediaRecorder] final audio send failed', e)
      setError('Could not send recorded audio to speech service.')
      setRole('idle')
    }
  }

  const startRecording = async () => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return
    if (recordingRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia(ensureAudioConstraints())
      mediaStreamRef.current = stream

      const mimeType = await getSupportedMimeType()
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []
      recordingRef.current = true
      setMicReady(true)

      recorder.addEventListener('dataavailable', (event: BlobEvent) => {
        if (!event.data || event.data.size === 0) return
        audioChunksRef.current.push(event.data)
      })

      recorder.addEventListener('stop', () => {
        void sendRecordedAudio(recorder)
      })

      recorder.addEventListener('start', () => {
        console.log('[MediaRecorder] started')
      })

      recorder.addEventListener('error', (e: any) => {
        console.error('[MediaRecorder] error', e)
        setError('Recording error: ' + (e.error?.message || 'unknown'))
        recordingRef.current = false
        setRole('idle')
        setMicReady(false)
      })

      recorder.start()
      console.log('[MediaRecorder] requested start, mimeType:', mimeType)
      setRole('listening')
    } catch (err) {
      recordingRef.current = false
      setError(err instanceof Error ? err.message : 'Microphone access failed.')
      setRole('idle')
    }
  }

  const stopRecording = () => {
    if (!recordingRef.current) return
    recordingRef.current = false

    try {
      mediaRecorderRef.current?.stop()
    } catch {
      // ignore
    }
    mediaRecorderRef.current = null
  }

  const releaseMedia = () => {
    stopRecording()
    mediaStreamRef.current?.getAudioTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    audioChunksRef.current = []
    assistantAudioRef.current?.pause()
    assistantAudioRef.current = null
    recordingRef.current = false
    setMicReady(false)
    setReceivingAudio(false)
    if (typeof window !== 'undefined' && recvTimerRef.current != null) {
      window.clearTimeout(recvTimerRef.current)
    }
    recvTimerRef.current = null
  }

  const connect = () => {
    clearReconnectTimer()
    const socket = new WebSocket(buildWebSocketUrl('/api/speaking/ws'))
    if (typeof (socket as any).binaryType !== 'undefined') {
      ;(socket as any).binaryType = 'arraybuffer'
    }
    wsRef.current = socket
    assistantFinalRef.current = false

    socket.onopen = () => {
      try {
        socket.send(
          JSON.stringify({
            type: 'start',
            part: 'part_1',
            topic: '',
            autoSpeak: true,
          })
        )
      } catch {
        // ignore
      }
      setRole('idle')
      setError(null)
    }

    socket.onmessage = (event: MessageEvent<string>) => {
      let payload: any
      try {
        payload = JSON.parse(event.data)
      } catch {
        return
      }

      if (payload.type === 'assistant_sentence') {
        setAssistant(payload.text || '')
        playAssistantAudio(payload.audioBase64, payload.mimeType)
        assistantFinalRef.current = Boolean(payload.final)
        setRole('speaking')
        return
      }

      if (payload.type === 'segment_started') {
        setRole('thinking')
        return
      }

      if (payload.type === 'segment_empty') {
        setRole('listening')
        return
      }

      if (payload.type === 'transcript' && payload.text) {
        setTranscript((prev) => (prev ? `${prev} ${payload.text}` : payload.text))
        setRole('thinking')
        return
      }

      if (payload.type === 'turn_complete') {
        const session = payload.session
        if (session?.sessionId) setSessionId(session.sessionId)
        const assistantText = [payload.turn?.assistantReply, payload.turn?.followUpQuestion]
          .filter((text) => typeof text === 'string' && text.trim())
          .join('\n\n')
        if (assistantText) {
          setAssistant(assistantText)
        }
        if (payload.turn?.userTranscript) setTranscript(payload.turn.userTranscript)
        assistantFinalRef.current = true
        setRole('idle')
        return
      }

      if (payload.type === 'analysis') {
        setRole('thinking')
        return
      }

      if (payload.type === 'session_started') {
        const session = payload.session
        if (session?.sessionId) setSessionId(session.sessionId)
        if (session?.currentQuestion) setAssistant(session.currentQuestion)
        assistantFinalRef.current = true
        setRole('idle')
        return
      }

      if (payload.type === 'reset_ack') {
        resetState()
        setRole('idle')
        return
      }

      if (payload.type === 'turn_skipped') {
        setRole('idle')
        return
      }

      if (payload.type === 'error') {
        setError(payload.message || 'Speech service error.')
        assistantFinalRef.current = true
        setRole('idle')
      }
    }

    socket.onerror = () => {
      setError('Speech service connection failed.')
      setRole('idle')
    }
    socket.onclose = (event) => {
      wsRef.current = null
      if (assistantFinalRef.current && !event.wasClean) {
        retryCountRef.current = Math.min(retryCountRef.current + 1, 4)
        const timeout = 1200 * retryCountRef.current
        reconnectTimerRef.current = window.setTimeout(() => {
          connect()
        }, timeout)
        return
      }
      retryCountRef.current = 0
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true })
      return
    }
    resetState()
    retryCountRef.current = 0
    connect()
    return () => {
      clearReconnectTimer()
      releaseMedia()
      try { wsRef.current?.close() } catch { /* ignore */ }
      wsRef.current = null
    }
  }, [isAuthenticated])

  const reset = async () => {
    retryCountRef.current = 0
    clearReconnectTimer()
    releaseMedia()
    try {
      wsRef.current?.send(JSON.stringify({ type: 'reset' }))
    } catch {
      // ignore
    }
    try { wsRef.current?.close() } catch { /* okay */ }
    wsRef.current = null
    resetState()
    setSessionId(null)
    setRole('idle')
    connect()
  }

  const close = () => {
    clearReconnectTimer()
    releaseMedia()
    try { wsRef.current?.close() } catch { /* okay */ }
    wsRef.current = null
    setRole('idle')
  }

  const toggleMic = async () => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return
    if (recordingRef.current || role === 'listening') {
      stopRecording()
      return
    }
    await startRecording()
  }

  const hero = useMemo(
    () => (
      <div className="flex flex-col items-center justify-center gap-10 py-8">
        <div className="flex flex-col items-center gap-3">
          <RoleBadge role={role} />
          <p className="mt-2 text-sm font-semibold text-[var(--voc-text-soft)]">
            Tap the orb to speak freely.
          </p>
        </div>

        <div className="relative inline-flex h-56 w-56 items-center justify-center">
          <button
            type="button"
            onClick={toggleMic}
            disabled={!sessionId}
            className={`inline-flex h-56 w-56 items-center justify-center rounded-full border-4 bg-white shadow-[0_22px_60px_rgba(145,34,54,0.12)] transition-transform duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-55 ${receivingAudio ? 'animate-[scale-breath_1.4s_ease-in-out_infinite]' : ''}`}
            style={{ borderColor: 'var(--voc-border)' }}
          >
            <span
              className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
                ['listening', 'thinking', 'speaking'].includes(role) || recordingRef.current === true ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background:
                  role === 'thinking'
                    ? 'radial-gradient(circle at center, rgba(234,179,8,0.22) 0%, transparent 70%)'
                    : role === 'speaking'
                      ? 'radial-gradient(circle at center, rgba(197,30,58,0.22) 0%, transparent 70%)'
                      : 'radial-gradient(circle at center, rgba(22,163,74,0.22) 0%, transparent 70%)',
              }}
            />
            <span
              className={`relative inline-flex h-24 w-24 items-center justify-center rounded-full transition-colors duration-300 ${
                role === 'listening' || recordingRef.current === true ? 'bg-[var(--voc-accent)] text-white' : 'bg-[var(--voc-panel-muted)] text-[var(--voc-accent)]'
              }`}
            >
              {role === 'listening' || recordingRef.current === true ? <Mic size={32} /> : <MicOff size={32} />}
            </span>
            {(role === 'listening' || recordingRef.current === true) && (
              <span className="absolute -inset-3 rounded-full border-2 border-[var(--voc-accent)]/35 animate-ping" />
            )}
            {['thinking', 'speaking'].includes(role) && !recordingRef.current && (
              <span className="absolute inset-0 voc-spin-pulse rounded-full border-4 border-dashed border-[var(--voc-accent)]/40" />
            )}
          </button>
        </div>

        {!micReady && !error && (
          <p className="text-xs text-[var(--voc-text-soft)]">
            Initializing microphone access...
          </p>
        )}
        {error && (
          <p className="text-xs text-[var(--voc-accent)]">
            {error}
          </p>
        )}
      </div>
    ),
    [role, sessionId, micReady, error, receivingAudio]
  )

  return (
    <MainLayout
      eyebrow="Speaking"
      title="AI Speaking Partner"
      description="Talk naturally: tap the orb to speak and have a continuous conversation."
      hero={hero}
      actionSlot={
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--voc-border)] px-4 py-2.5 text-sm font-semibold text-[var(--voc-text)] hover:-translate-y-0.5"
          >
            <RefreshCcw size={15} />
            Reset
          </button>
          <button
            type="button"
            onClick={close}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--voc-border)] px-4 py-2.5 text-sm font-semibold text-[var(--voc-text)] hover:-translate-y-0.5"
          >
            <RotateCcw size={15} />
            Close
          </button>
        </div>
      }
    >
      {error && (
        <div className="mb-6 rounded-3xl border border-[var(--voc-border)] bg-[var(--voc-accent-soft)] px-5 py-4 text-sm text-[var(--voc-accent)]">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">Coach</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--voc-text)]">{assistant || 'Starting...'}</p>
        </section>
        <section className="rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">You</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--voc-text)]">{transcript || 'Speak to see your words here.'}</p>
        </section>
      </div>
    </MainLayout>
  )
}
