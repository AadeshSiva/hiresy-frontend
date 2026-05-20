// Live.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import "./Live.css";
import { PiStarFourFill } from "react-icons/pi";

const API = import.meta.env.VITE_LIVEHR_URL || "http://localhost:8005";

export default function Live() {
    const { token } = useParams();

    // ── Session / candidate data ──────────────────────────────────────────────
    const [sessionData, setSessionData] = useState(null);
    const [sessionLoading, setSessionLoading] = useState(true);

    // ── Meeting ───────────────────────────────────────────────────────────────
    const [meetUrl, setMeetUrl] = useState(null);
    const [meetLoading, setMeetLoading] = useState(true);
    const [meetError, setMeetError] = useState(null);

    // ── Questions ─────────────────────────────────────────────────────────────
    const [questions, setQuestions] = useState([]);
    const [questionsLoading, setQuestionsLoading] = useState(true);
    const [questionsSource, setQuestionsSource] = useState(null);

    // ── Transcript ────────────────────────────────────────────────────────────
    const [transcript, setTranscript] = useState("");
    const [displayText, setDisplayText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [audioMode, setAudioMode] = useState(null);

    // ── Live AI Eval ──────────────────────────────────────────────────────────
    const [overallScore, setOverallScore] = useState(null);
    const [confidence, setConfidence] = useState(null);
    const [evaluating, setEvaluating] = useState(false);

    // ── AI Feedback Feed ──────────────────────────────────────────────────────
    const [feedbackFeed, setFeedbackFeed] = useState([]);

    // ── Follow-up Questions ───────────────────────────────────────────────────
    const [followUps, setFollowUps] = useState([]);
    const [loadingSuggest, setLoadingSuggest] = useState(false);

    // ── Summary ───────────────────────────────────────────────────────────────
    const [summary, setSummary] = useState(null);

    // ── Refs ──────────────────────────────────────────────────────────────────
    const recognitionRef = useRef(null);
    const transcriptRef = useRef("");
    const interimRef = useRef("");
    const lastEvalWordCount = useRef(0);
    const evalIntervalRef = useRef(null);
    const isListeningRef = useRef(false);
    const evaluatingRef = useRef(false);
    const suggestingRef = useRef(false);
    const audioContextRef = useRef(null);
    const micStreamRef = useRef(null);
    const tabStreamRef = useRef(null);
    const hasStartedRef = useRef(false);

    // ── 1. Fetch session by token ─────────────────────────────────────────────
    useEffect(() => {
        if (!token) {
            // Demo mode — no token in URL (/live route)
            setSessionData({
                name: "Demo Candidate",
                role: "Software Engineer",
                experience: "",
                github_url: "",
                leetcode_url: "",
                meet_url: null,
            });
            setSessionLoading(false);
            return;
        }

        fetch(`${API}/livehr/session/${token}`)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                setSessionData({
                    name: data.candidate_name,
                    role: data.job_title,
                    experience: "",
                    github_url: data.github_url || "",
                    leetcode_url: "",
                    meet_url: data.meet_url || null,
                });
                setSessionLoading(false);
            })
            .catch((e) => {
                console.error("Session fetch failed:", e);
                // Fallback to demo so the page doesn't break
                setSessionData({
                    name: "Unknown Candidate",
                    role: "Candidate",
                    experience: "",
                    github_url: "",
                    leetcode_url: "",
                    meet_url: null,
                });
                setSessionLoading(false);
            });
    }, [token]);

    // Shorthand — only used after sessionLoading = false
    const c = sessionData;
    const interviewId = token || "demo";

    // ── 2. Resolve meet URL (use session's meet_url if available) ─────────────
    useEffect(() => {
        if (sessionLoading) return; // wait for session first

        if (c?.meet_url) {
            setMeetUrl(c.meet_url);
            setMeetLoading(false);
            return;
        }

        // Fallback: generate from backend using interview_id
        (async () => {
            setMeetLoading(true);
            try {
                const res = await fetch(`${API}/meet/room-url?interview_id=${interviewId}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setMeetUrl(data.meet_url);
            } catch {
                setMeetError("Could not load meeting room.");
            } finally {
                setMeetLoading(false);
            }
        })();
    }, [sessionLoading, c, interviewId]);

    // ── 3. Fetch questions (after session loaded) ─────────────────────────────
    useEffect(() => {
        if (sessionLoading || !c) return;

        (async () => {
            setQuestionsLoading(true);
            try {
                const res = await fetch(`${API}/copilot/fetch-questions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        github_url: c.github_url || null,
                        leetcode_url: c.leetcode_url || null,
                        job_role: c.role,
                        candidate_name: c.name,
                    }),
                });
                const data = await res.json();
                if (data.questions?.length) {
                    setQuestions(data.questions);
                    setQuestionsSource(data.source);
                }
            } catch (e) {
                console.error("Question fetch error:", e);
            } finally {
                setQuestionsLoading(false);
            }
        })();
    }, [sessionLoading, c]);

    // ── Core eval function ────────────────────────────────────────────────────
    const runLiveEval = useCallback(async () => {
        if (!c) return;
        const current = transcriptRef.current.trim();
        if (!current || evaluatingRef.current) return;

        evaluatingRef.current = true;
        setEvaluating(true);

        try {
            const res = await fetch(`${API}/copilot/live-eval`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transcript: current,
                    job_role: c.role,
                    candidate_name: c.name,
                }),
            });
            const data = await res.json();

            setOverallScore(data.overall_score ?? 0);
            setConfidence(data.confidence ?? 0);

            if (data.ai_feedback) {
                const wordCount = current.split(/\s+/).filter(Boolean).length;
                setFeedbackFeed((prev) => [
                    {
                        id: Date.now(),
                        feedback: data.ai_feedback,
                        score: data.overall_score ?? 0,
                        confidence: data.confidence ?? 0,
                        wordCount,
                        timestamp: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        }),
                    },
                    ...prev.slice(0, 9),
                ]);
            }
        } catch (e) {
            console.error("Live eval error:", e);
        } finally {
            evaluatingRef.current = false;
            setEvaluating(false);
        }
    }, [c]);

    // ── Trigger eval on transcript change ─────────────────────────────────────
    useEffect(() => {
        const wordCount = transcriptRef.current.split(/\s+/).filter(Boolean).length;

        if (wordCount > 0 && !hasStartedRef.current) {
            hasStartedRef.current = true;
            setOverallScore(0);
            setConfidence(0);
            evalIntervalRef.current = setInterval(() => {
                runLiveEval();
            }, 10000);
            runLiveEval();
        }

        const newWords = wordCount - lastEvalWordCount.current;
        if (wordCount > 0 && newWords >= 30) {
            lastEvalWordCount.current = wordCount;
            runLiveEval();
            fetchFollowUps();
        }
    }, [transcript]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Follow-ups ────────────────────────────────────────────────────────────
    const fetchFollowUps = useCallback(async () => {
        if (!c) return;
        const current = transcriptRef.current.trim();
        if (!current || suggestingRef.current) return;
        suggestingRef.current = true;
        setLoadingSuggest(true);
        try {
            const res = await fetch(`${API}/copilot/suggest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transcript: current,
                    job_role: c.role,
                    candidate_name: c.name,
                    conversation_history: [],
                }),
            });
            const data = await res.json();
            if (data.questions?.length) setFollowUps(data.questions);
        } catch (e) {
            console.error("Suggest error:", e);
        } finally {
            suggestingRef.current = false;
            setLoadingSuggest(false);
        }
    }, [c]);

    // ── Summary ───────────────────────────────────────────────────────────────
    const fetchSummary = useCallback(async () => {
        if (!c) return;
        const current = transcriptRef.current.trim();
        if (!current) return;
        try {
            const res = await fetch(`${API}/copilot/summary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transcript: current,
                    job_role: c.role,
                    candidate_name: c.name,
                }),
            });
            setSummary(await res.json());
        } catch (e) {
            console.error(e);
        }
    }, [c]);

    // ── Attach SpeechRecognition ──────────────────────────────────────────────
    const attachRecognition = useCallback((mixedStream) => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;

        if (mixedStream) {
            const ghost = new Audio();
            ghost.srcObject = mixedStream;
            ghost.volume = 0;
            ghost.play().catch(() => { });
        }

        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (e) => {
            let interim = "";
            let finalChunk = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const text = e.results[i][0].transcript;
                if (e.results[i].isFinal) {
                    finalChunk += text;
                } else {
                    interim += text;
                }
            }
            if (finalChunk.trim()) {
                transcriptRef.current = (transcriptRef.current + " " + finalChunk).trim();
                interimRef.current = "";
                setTranscript(transcriptRef.current);
            } else {
                interimRef.current = interim;
            }
            setDisplayText((transcriptRef.current + " " + interimRef.current).trim());
        };

        rec.onerror = (e) => {
            if (e.error !== "no-speech") console.error("SR error:", e.error);
        };

        rec.onend = () => {
            if (isListeningRef.current) {
                try { rec.start(); } catch (_) { }
            }
        };

        rec.start();
        recognitionRef.current = rec;
    }, []);

    // ── Start listening ───────────────────────────────────────────────────────
    const startListening = useCallback(async () => {
        if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
            alert("Speech recognition requires Chrome or a Chromium-based browser.");
            return;
        }
        isListeningRef.current = true;
        setIsListening(true);

        let micStream = null;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            micStreamRef.current = micStream;
        } catch {
            alert("Microphone access is required.");
            isListeningRef.current = false;
            setIsListening(false);
            return;
        }

        let tabStream = null;
        let mode = "mic-only";
        try {
            tabStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: { echoCancellation: false, noiseSuppression: false, sampleRate: 44100 },
            });
            tabStreamRef.current = tabStream;
            tabStream.getVideoTracks().forEach((t) => t.stop());
            if (tabStream.getAudioTracks().length > 0) mode = "both";
        } catch (e) {
            console.warn("Tab audio not captured, mic-only mode:", e.message);
        }

        setAudioMode(mode);

        if (mode === "both") {
            const ctx = new AudioContext();
            audioContextRef.current = ctx;
            const dest = ctx.createMediaStreamDestination();
            ctx.createMediaStreamSource(micStream).connect(dest);
            ctx.createMediaStreamSource(tabStream).connect(dest);
            attachRecognition(dest.stream);
        } else {
            attachRecognition(null);
        }
    }, [attachRecognition]);

    // ── Stop listening ────────────────────────────────────────────────────────
    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        setIsListening(false);
        setAudioMode(null);
        clearInterval(evalIntervalRef.current);
        evalIntervalRef.current = null;
        try { recognitionRef.current?.stop(); } catch (_) { }
        recognitionRef.current = null;
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
        tabStreamRef.current?.getTracks().forEach((t) => t.stop());
        tabStreamRef.current = null;
        audioContextRef.current?.close();
        audioContextRef.current = null;
    }, []);

    // ── Clear ─────────────────────────────────────────────────────────────────
    const clearTranscript = useCallback(() => {
        transcriptRef.current = "";
        interimRef.current = "";
        hasStartedRef.current = false;
        lastEvalWordCount.current = 0;
        clearInterval(evalIntervalRef.current);
        evalIntervalRef.current = null;
        setTranscript("");
        setDisplayText("");
        setFeedbackFeed([]);
        setFollowUps([]);
        setOverallScore(null);
        setConfidence(null);
        setSummary(null);
    }, []);

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            isListeningRef.current = false;
            clearInterval(evalIntervalRef.current);
            try { recognitionRef.current?.stop(); } catch (_) { }
            micStreamRef.current?.getTracks().forEach((t) => t.stop());
            tabStreamRef.current?.getTracks().forEach((t) => t.stop());
            audioContextRef.current?.close();
        };
    }, []);

    // ── Colour helpers ────────────────────────────────────────────────────────
    const confidenceColor = (v) => {
        if (v === null) return "var(--li-border)";
        if (v === 0) return "#555";
        if (v >= 70) return "#4fffb0";
        if (v >= 40) return "#f5a623";
        return "#ff6b6b";
    };

    const scoreColor = (v) => {
        if (v === null) return "var(--li-border)";
        if (v === 0) return "#555";
        if (v >= 7) return "#4fffb0";
        if (v >= 5) return "#f5a623";
        return "#ff6b6b";
    };

    const feedbackTag = (score) => {
        if (score >= 8) return { label: "Strong", cls: "li-tag-strong" };
        if (score >= 6) return { label: "Partial", cls: "li-tag-partial" };
        if (score >= 4) return { label: "Weak", cls: "li-tag-weak" };
        return { label: "Off-track", cls: "li-tag-off" };
    };

    // ── Loading state ─────────────────────────────────────────────────────────
    if (sessionLoading || !c) {
        return (
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "100vh", background: "#0a0a0a", color: "#fff",
                fontFamily: "sans-serif", flexDirection: "column", gap: 12,
            }}>
                <div style={{
                    width: 32, height: 32, border: "3px solid #333",
                    borderTop: "3px solid #FF4400", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }} />
                <p style={{ color: "#666", fontSize: 14 }}>Loading session...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const profileBadge =
        questionsSource === "profile_based"
            ? c.github_url && c.leetcode_url
                ? "GitHub + LeetCode"
                : c.github_url
                    ? "GitHub"
                    : "LeetCode"
            : "Role-Based";

    const wordCount = transcriptRef.current.split(/\s+/).filter(Boolean).length;
    const wordsUntilNext = Math.max(0, 30 - (wordCount - lastEvalWordCount.current));

    return (
        <div className="li-live-root">
            {/* ── Left: Video + Transcript ──────────────────────────────── */}
            <div className="li-video-pane">
                <div className="li-video-header">
                    <div className="li-live-badge"><span className="li-live-dot" />LIVE</div>
                    <span className="li-candidate-chip">Powered by Hyra Ai</span>
                    {audioMode && (
                        <span style={{
                            fontFamily: "'DM Mono', monospace", fontSize: "11px", marginLeft: "auto",
                            color: audioMode === "both" ? "#4fffb0" : "#f5a623",
                        }}>
                            {audioMode === "both" ? "🎙 Mic + Tab" : "🎙 Mic Only"}
                        </span>
                    )}
                </div>

                <div className="li-meet-wrap">
                    {meetLoading && (
                        <div className="li-meet-state">
                            <div className="li-meet-spinner" />
                            <p>Setting up meeting room...</p>
                        </div>
                    )}
                    {meetError && <div className="li-meet-state li-meet-error"><p>{meetError}</p></div>}
                    {meetUrl && (
                        <iframe
                            title="Interview Meet"
                            src={meetUrl}
                            allow="camera; microphone; fullscreen; display-capture; autoplay"
                            className="li-meet-frame"
                        />
                    )}
                </div>

                {/* Transcript / Captions */}
                <div className="li-transcript-box">
                    <div className="li-transcript-header">
                        <span>
                            <span style={{ color: "red" }}>⏺</span> Live Transcript
                            {wordCount > 0 && (
                                <span style={{
                                    fontFamily: "'DM Mono', monospace", fontSize: "10px",
                                    color: "#555", marginLeft: "10px",
                                }}>
                                    {wordCount} words
                                    {wordsUntilNext > 0
                                        ? ` · next eval in ${wordsUntilNext}w`
                                        : " · evaluating..."}
                                </span>
                            )}
                        </span>
                        <div className="li-mic-controls">
                            <button
                                className={`li-mic-btn ${isListening ? "li-active" : ""}`}
                                onClick={isListening ? stopListening : startListening}
                            >
                                {isListening ? "⏹ Stop" : "▶ Start"}
                            </button>
                            <button className="li-mic-btn" onClick={clearTranscript}>✕ Clear</button>
                            <button className="li-summary-btn" onClick={fetchSummary}>📋 Summary</button>
                        </div>
                    </div>

                    <p className="li-transcript-text">
                        {displayText ? (
                            <>
                                <span>{transcriptRef.current} </span>
                                <span style={{ opacity: 0.45 }}>{interimRef.current}</span>
                            </>
                        ) : (
                            <span style={{ opacity: 0.35 }}>
                                {isListening
                                    ? "Listening — speak now..."
                                    : "Click Start to begin capturing the conversation."}
                            </span>
                        )}
                    </p>
                </div>

                {/* Summary */}
                {summary && (
                    <div className="li-summary-panel">
                        <div className="li-summary-row">
                            <span className="li-summary-icon">✅</span>
                            <div><strong>Strengths</strong><p>{summary.strengths}</p></div>
                        </div>
                        <div className="li-summary-row">
                            <span className="li-summary-icon">⚠️</span>
                            <div><strong>Gaps</strong><p>{summary.gaps}</p></div>
                        </div>
                        <div className="li-summary-row">
                            <span className="li-summary-icon">🔲</span>
                            <div><strong>Pending</strong><p>{summary.pending}</p></div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Right: Copilot Panel ─────────────────────────────────── */}
            <div className="li-copilot-pane">

                {/* Candidate Card */}
                <div className="li-candidate-card">
                    <div className="li-candidate-info">
                        <h3>{c.name}</h3>
                        <p>{c.role}</p>
                        <div className="li-candidate-badges">
                            {c.experience && (
                                <span className="li-exp-badge">{c.experience}</span>
                            )}
                            {c.github_url && (
                                <a href={c.github_url} target="_blank" rel="noreferrer"
                                    className="li-profile-badge li-gh-badge">
                                    GitHub
                                </a>
                            )}
                            {c.leetcode_url && (
                                <a href={c.leetcode_url} target="_blank" rel="noreferrer"
                                    className="li-profile-badge li-lc-badge">
                                    LeetCode
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Live AI Metrics */}
                <div className="li-live-metrics">
                    <div className="li-metric-card">
                        <span className="li-metric-label">Confidence</span>
                        <div className="li-metric-ring" style={{ "--color": confidenceColor(confidence) }}>
                            <svg viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.9" fill="none"
                                    stroke="var(--li-border)" strokeWidth="2.5" />
                                <circle cx="18" cy="18" r="15.9" fill="none"
                                    stroke={confidenceColor(confidence)}
                                    strokeWidth="2.5"
                                    strokeDasharray={`${confidence ?? 0} 100`}
                                    strokeDashoffset="25"
                                    strokeLinecap="round"
                                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                                />
                            </svg>
                            <span className="li-metric-val" style={{ color: confidenceColor(confidence) }}>
                                {confidence !== null ? `${confidence}%` : "—"}
                            </span>
                        </div>
                        {evaluating && <span className="li-metric-updating">updating...</span>}
                    </div>

                    <div className="li-metric-card">
                        <span className="li-metric-label">Overall Score</span>
                        <div className="li-metric-ring" style={{ "--color": scoreColor(overallScore) }}>
                            <svg viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.9" fill="none"
                                    stroke="var(--li-border)" strokeWidth="2.5" />
                                <circle cx="18" cy="18" r="15.9" fill="none"
                                    stroke={scoreColor(overallScore)}
                                    strokeWidth="2.5"
                                    strokeDasharray={`${overallScore !== null ? overallScore * 10 : 0} 100`}
                                    strokeDashoffset="25"
                                    strokeLinecap="round"
                                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                                />
                            </svg>
                            <span className="li-metric-val" style={{ color: scoreColor(overallScore) }}>
                                {overallScore !== null ? `${overallScore}/10` : "—"}
                            </span>
                        </div>
                        {evaluating && <span className="li-metric-updating">updating...</span>}
                    </div>
                </div>

                {/* AI Feedback Feed */}
                <div className="li-section">
                    <div className="li-section-header">
                        <span className="li-head">
                            <PiStarFourFill className="li-head-star" color="red" size={12} />
                            Hyra Feedback
                        </span>
                        {evaluating && <span className="li-eval-pulse">● evaluating</span>}
                    </div>

                    {feedbackFeed.length === 0 ? (
                        <p className="li-empty-state">
                            {overallScore !== null
                                ? "First evaluation in progress — feedback will appear shortly."
                                : "Feedback appears automatically once speech is detected."}
                        </p>
                    ) : (
                        <div className="li-feedback-feed">
                            {feedbackFeed.map((entry) => {
                                const tag = feedbackTag(entry.score);
                                return (
                                    <div key={entry.id} className="li-feedback-entry">
                                        <div className="li-feedback-meta">
                                            <span className={`li-feedback-tag ${tag.cls}`}>{tag.label}</span>
                                            <span className="li-feedback-score">{entry.score}/10</span>
                                            <span className="li-feedback-time">{entry.timestamp}</span>
                                        </div>
                                        <p className="li-feedback-body">"{entry.feedback}"</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Profile-Based Questions */}
                <div className="li-section">
                    <div className="li-section-header">
                        <span className="li-head">
                            <PiStarFourFill className="li-head-star" color="red" size={12} />
                            {questionsSource === "profile_based"
                                ? `Questions from ${profileBadge}`
                                : "Interview Questions"}
                        </span>
                        {questionsLoading && <span className="li-eval-pulse">● loading</span>}
                    </div>
                    {questionsLoading ? (
                        <div className="li-questions-loading">
                            <div className="li-q-skeleton" />
                            <div className="li-q-skeleton li-q-skeleton--short" />
                            <div className="li-q-skeleton" />
                        </div>
                    ) : questions.length === 0 ? (
                        <p className="li-empty-state">No questions loaded.</p>
                    ) : (
                        <div className="li-questions-list">
                            {questions.map((q, i) => (
                                <div key={i} className="li-question-item">
                                    <span className="li-q-num">Q{i + 1}</span>
                                    <span className="li-q-text">{q}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Live Follow-ups */}
                {followUps.length > 0 && (
                    <div className="li-section">
                        <div className="li-section-header">
                            <span>💡 Live Follow-ups</span>
                            <button
                                className="li-refresh-btn"
                                onClick={fetchFollowUps}
                                disabled={loadingSuggest}
                            >
                                {loadingSuggest ? "..." : "↻"}
                            </button>
                        </div>
                        <div className="li-questions-list">
                            {followUps.map((q, i) => (
                                <div key={i} className="li-question-item li-followup-item">
                                    <span className="li-q-num li-fup-num">↳</span>
                                    <span className="li-q-text">{q}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}