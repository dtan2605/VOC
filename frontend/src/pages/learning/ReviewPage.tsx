import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Flame,
  RotateCcw,
  Volume2,
  XCircle,
} from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import { learningApi } from '../../api/learningApi'
import type { LearningSessionDetail, SubmitReviewResponse } from '../../types/learning'

function pronounceWord(word: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !word.trim()) {
    return
  }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.92
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}

export default function ReviewPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams()
  const { isAuthenticated } = useAuth()
  const [sessionDetail, setSessionDetail] = useState<LearningSessionDetail | null>(null)
  const [currentWordId, setCurrentWordId] = useState<number | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<SubmitReviewResponse | null>(null)
  const [pendingNextWordId, setPendingNextWordId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cardStartedAtRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const loadSession = async (nextWordId?: number | null) => {
    if (!sessionId) {
      navigate('/learning', { replace: true })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await learningApi.getSession(Number(sessionId))
      const fallbackNextId =
        response.nextItem?.vocabularyId ??
        response.items.find((item) => !item.reviewedInSession)?.vocabularyId ??
        null

      setSessionDetail(response)
      setCurrentWordId(nextWordId ?? fallbackNextId)
      setAnswer('')
      setFeedback(null)
      setPendingNextWordId(null)
      cardStartedAtRef.current = Date.now()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load review session.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSession()
  }, [sessionId])

  const currentCard = useMemo(
    () =>
      sessionDetail?.items.find((item) => item.vocabularyId === currentWordId && !item.reviewedInSession) ??
      sessionDetail?.nextItem ??
      null,
    [currentWordId, sessionDetail]
  )

  const submitAnswer = async () => {
    if (!sessionDetail || !currentCard || !answer.trim()) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const secondsSpent = Math.max(1, Math.round((Date.now() - cardStartedAtRef.current) / 1000))
      const response = await learningApi.submitReview(sessionDetail.session.id, {
        vocabularyId: currentCard.vocabularyId,
        userAnswer: answer.trim(),
        secondsSpent,
      })

      const refreshed = await learningApi.getSession(sessionDetail.session.id)
      setSessionDetail(refreshed)
      setFeedback(response)
      setPendingNextWordId(response.nextItem?.vocabularyId ?? null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit answer.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const moveNext = async () => {
    if (!sessionDetail) {
      return
    }

    if (feedback?.sessionCompleted) {
      setCurrentWordId(null)
      setAnswer('')
      setFeedback(null)
      setPendingNextWordId(null)
      return
    }

    await loadSession(pendingNextWordId)
  }

  const hero = (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[30px] bg-[linear-gradient(135deg,var(--voc-accent-strong)_0%,var(--voc-accent)_45%,var(--voc-accent-bright)_100%)] p-6 text-white shadow-[0_28px_54px_rgba(134,16,39,0.24)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 backdrop-blur-md">
          <Flame size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
            Review Session
          </span>
        </div>
        <h2
          className="mt-6 text-[34px] font-black leading-tight tracking-[-0.05em]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Session #{sessionDetail?.session.id ?? '--'}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">
          TType your asnwer in the box below and submit to see if you got it right.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 xl:grid-cols-1">
        {[
          ['Direction', sessionDetail?.session.direction ?? '--'],
          ['Progress', `${sessionDetail?.session.completedItems ?? 0}/${sessionDetail?.session.totalItems ?? 0}`],
          ['Streak', String(sessionDetail?.session.currentStreak ?? 0)],
          ['Best', String(sessionDetail?.session.bestStreak ?? 0)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[28px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-5 shadow-[0_14px_40px_var(--voc-shadow-soft)]"
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--voc-text-soft)]">{label}</p>
            <p
              className="mt-3 text-2xl font-black text-[var(--voc-text)]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <MainLayout
      eyebrow="Review"
      title="Answer Review Cards"
      description="Support English to Vietnamese or Vietnamese to English."
      hero={hero}
      actionSlot={
        <button
          type="button"
          onClick={() => navigate('/learning')}
          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
        >
          <ArrowLeft size={16} />
          Back to learning
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-3xl border border-[var(--voc-border)] bg-[var(--voc-accent-soft)] px-5 py-4 text-sm text-[var(--voc-accent)]">
          {error}
        </div>
      )}

      {isLoading || !sessionDetail ? (
        <section className="rounded-[32px] border border-dashed border-[var(--voc-border)] bg-[var(--voc-panel)] px-5 py-20 text-center text-sm text-[var(--voc-text-soft)]">
          Loading review session...
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            {currentCard ? (
              <div className="rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] sm:p-7">
                <div className="relative overflow-hidden rounded-[34px] border border-[var(--voc-border)] bg-[linear-gradient(160deg,#ffffff_0%,#fff6f7_55%,#ffe9ee_100%)] p-6 shadow-[0_24px_60px_var(--voc-shadow-soft)]">
                  <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[var(--voc-accent)]/10 blur-2xl" />
                  <div className="absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-[var(--voc-accent-bright)]/12 blur-2xl" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[var(--voc-accent-soft)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--voc-accent)]">
                        mastery {currentCard.masteryScore}%
                      </span>
                      <button
                        type="button"
                        onClick={() => pronounceWord(currentCard.word)}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--voc-border)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--voc-text)]"
                      >
                        <Volume2 size={15} />
                        Hear it
                      </button>
                    </div>

                    <div className="mt-8 rounded-[28px] bg-white/76 p-6 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-text-soft)]">
                        {currentCard.promptLabel}
                      </p>
                      <h3
                        className="mt-4 text-[42px] font-black tracking-[-0.06em] text-[var(--voc-text)]"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {currentCard.promptText}
                      </h3>
                      <p className="mt-3 text-sm uppercase tracking-[0.14em] text-[var(--voc-accent)]/70">
                        {currentCard.partOfSpeech || 'Vocabulary'} · {currentCard.bandName} · {currentCard.topicName}
                      </p>
                      {currentCard.examplePreview && (
                        <p className="mt-6 text-sm italic leading-7 text-[var(--voc-text-soft)]">
                          "{currentCard.examplePreview}"
                        </p>
                      )}

                      <div className="mt-8 space-y-3">
                        <textarea
                          value={answer}
                          onChange={(event) => setAnswer(event.target.value)}
                          rows={3}
                          disabled={Boolean(feedback)}
                          placeholder={currentCard.answerPlaceholder}
                          className="w-full rounded-[24px] border border-[var(--voc-border)] bg-white px-4 py-4 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10 disabled:opacity-70"
                        />

                        {!feedback ? (
                          <button
                            type="button"
                            disabled={isSubmitting || !answer.trim()}
                            onClick={() => {
                              void submitAnswer()
                            }}
                            className="rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)] disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            {isSubmitting ? 'Checking answer...' : 'Submit answer'}
                          </button>
                        ) : (
                          <div
                            className="rounded-[24px] border px-5 py-5"
                            style={{
                              borderColor: feedback.isCorrect ? 'rgba(31,122,77,0.24)' : 'rgba(197,30,58,0.24)',
                              background: feedback.isCorrect ? 'rgba(31,122,77,0.08)' : 'rgba(197,30,58,0.08)',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {feedback.isCorrect ? (
                                <CheckCircle2 size={20} className="text-[#1F7A4D]" />
                              ) : (
                                <XCircle size={20} className="text-[var(--voc-accent)]" />
                              )}
                              <p className="text-sm font-bold text-[var(--voc-text)]">
                                {feedback.isCorrect ? 'Correct answer' : 'Not quite right'}
                              </p>
                            </div>
                            <p className="mt-3 text-sm text-[var(--voc-text-soft)]">
                              Your answer:{' '}
                              <span className="font-semibold text-[var(--voc-text)]">
                                {feedback.userAnswer || '(empty)'}
                              </span>
                            </p>
                            <p className="mt-2 text-sm text-[var(--voc-text-soft)]">
                              Expected:{' '}
                              <span className="font-semibold text-[var(--voc-text)]">
                                {feedback.expectedAnswer}
                              </span>
                            </p>
                            <p className="mt-2 text-sm text-[var(--voc-text-soft)]">
                              Updated mastery:{' '}
                              <span className="font-semibold text-[var(--voc-text)]">
                                {feedback.updatedMasteryScore}%
                              </span>
                            </p>
                            <p className="mt-2 text-sm text-[var(--voc-text-soft)]">
                              Streak:{' '}
                              <span className="font-semibold text-[var(--voc-text)]">
                                {feedback.currentStreak}
                              </span>{' '}
                              · Best:{' '}
                              <span className="font-semibold text-[var(--voc-text)]">
                                {feedback.bestStreak}
                              </span>
                            </p>
                            <div className="mt-5">
                              <button
                                type="button"
                                onClick={() => {
                                  void moveNext()
                                }}
                                className="rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
                              >
                                {feedback.sessionCompleted ? 'Finish session' : 'Next card'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] sm:p-7">
                <div className="flex flex-col items-center justify-center rounded-[28px] bg-[var(--voc-panel-muted)] px-5 py-16 text-center">
                  <CheckCircle2 size={34} className="text-[var(--voc-accent)]" />
                  <h2
                    className="mt-4 text-3xl font-black text-[var(--voc-text)]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Session complete
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-7 text-[var(--voc-text-soft)]">
                    You have answered every card in this session. Start another one to keep the
                    streak alive.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/learning')}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
                  >
                    <RotateCcw size={15} />
                    Start another session
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
                    Session queue
                  </p>
                  <h2
                    className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Progress inside this review
                  </h2>
                </div>
                <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
                  <ChevronRight size={18} />
                </div>
              </div>

              <div className="space-y-3">
                {sessionDetail.items.map((item, index) => (
                  <button
                    key={item.vocabularyId}
                    type="button"
                    disabled={item.reviewedInSession || Boolean(feedback)}
                    onClick={() => {
                      setCurrentWordId(item.vocabularyId)
                      setAnswer('')
                      cardStartedAtRef.current = Date.now()
                    }}
                    className="flex w-full items-center justify-between rounded-[24px] border px-4 py-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-80"
                    style={{
                      borderColor:
                        item.vocabularyId === currentCard?.vocabularyId
                          ? 'rgba(197,30,58,0.28)'
                          : 'var(--voc-border)',
                      background:
                        item.vocabularyId === currentCard?.vocabularyId
                          ? 'var(--voc-accent-soft)'
                          : 'var(--voc-panel-muted)',
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--voc-text)]">
                        {index + 1}. {item.word}
                      </p>
                      <p className="mt-1 text-sm text-[var(--voc-text-soft)]">{item.promptLabel}</p>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={
                        item.reviewedInSession
                          ? item.sessionResult === 'correct'
                            ? { background: 'rgba(31,122,77,0.12)', color: '#1F7A4D' }
                            : { background: 'rgba(197,30,58,0.12)', color: 'var(--voc-accent)' }
                          : { background: 'var(--voc-surface-strong)', color: 'var(--voc-text-soft)' }
                      }
                    >
                      {item.reviewedInSession ? item.sessionResult : 'Pending'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  )
}
