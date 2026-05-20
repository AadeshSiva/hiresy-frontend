import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./SpokenTest.css";

const API = "https://hiresy-comm.onrender.com";

// ── Utility: speak via Browser SpeechSynthesis ────────────────────────────
function speakSentence(text, onEnd) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US";
    utt.rate = 0.95;
    if (onEnd) utt.onend = onEnd;
    window.speechSynthesis.speak(utt);
}

// ── Part 1: Listen & Select ───────────────────────────────────────────────
function ListenSelectSection({ questions, answers, onChange }) {
    const [speaking, setSpeaking] = useState(null);

    const handlePlay = (idx, sentence) => {
        setSpeaking(idx);
        speakSentence(sentence, () => setSpeaking(null));
    };

    return (
        <div className="st-section">
            <div className="st-section-header">
                <span className="st-section-badge">Part 1 of 3</span>
                <h2 className="st-section-title">Listen &amp; Select</h2>
                <p className="st-section-desc">
                    Play each sentence and choose the option that best matches what you heard.
                </p>
            </div>
            {questions.map((q, idx) => (
                <div key={idx} className="st-card">
                    <div className="st-card-top">
                        <span className="st-q-num">Q{idx + 1}</span>
                        <button
                            className={`st-play-btn ${speaking === idx ? "playing" : ""}`}
                            onClick={() => handlePlay(idx, q.sentence)}
                            title="Play sentence"
                        >
                            {speaking === idx ? (
                                <span className="st-wave">
                                    <span /><span /><span /><span />
                                </span>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                            {speaking === idx ? "Playing…" : "Play Sentence"}
                        </button>
                    </div>
                    <div className="st-options-grid">
                        {q.options.map((opt, oi) => (
                            <label
                                key={oi}
                                className={`st-radio-option ${answers[idx] === oi ? "selected" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name={`ls_${idx}`}
                                    value={oi}
                                    checked={answers[idx] === oi}
                                    onChange={() => onChange(idx, oi)}
                                />
                                <span className="st-radio-letter">{String.fromCharCode(65 + oi)}</span>
                                <span className="st-radio-text">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Part 2: Repeat Sentence ───────────────────────────────────────────────
function RepeatSentenceSection({ sentences, recordings, onRecorded }) {
    const [speaking, setSpeaking] = useState(null);
    const [recording, setRecording] = useState(null);
    const mediaRecorder = useRef(null);
    const chunks = useRef([]);

    const handleListen = (idx, sentence) => {
        setSpeaking(idx);
        speakSentence(sentence, () => setSpeaking(null));
    };

    const startRec = async (idx) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            chunks.current = [];
            mediaRecorder.current = new MediaRecorder(stream);
            mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks.current, { type: "audio/webm" });
                onRecorded(idx, blob);
                stream.getTracks().forEach(t => t.stop());
                setRecording(null);
            };
            mediaRecorder.current.start();
            setRecording(idx);
        } catch {
            alert("Microphone access denied.");
        }
    };

    const stopRec = () => {
        if (mediaRecorder.current && recording !== null) {
            mediaRecorder.current.stop();
        }
    };

    return (
        <div className="st-section">
            <div className="st-section-header">
                <span className="st-section-badge">Part 2 of 3</span>
                <h2 className="st-section-title">Repeat Sentence</h2>
                <p className="st-section-desc">
                    Listen to the sentence, then record yourself repeating it exactly.
                    One chance only — no re-recording.
                </p>
            </div>
            {sentences.map((sentence, idx) => {
                const isDone = !!recordings[idx];
                const isRecording = recording === idx;
                return (
                    <div key={idx} className={`st-card ${isDone ? "st-card-done" : ""}`}>
                        <div className="st-card-top">
                            <span className="st-q-num">Q{idx + 1}</span>
                            {isDone && <span className="st-done-badge">✓ Recorded</span>}
                        </div>
                        <div className="st-repeat-actions">
                            <button
                                className={`st-play-btn ${speaking === idx ? "playing" : ""}`}
                                onClick={() => handleListen(idx, sentence)}
                                disabled={isDone}
                                title="Listen to sentence"
                            >
                                {speaking === idx ? (
                                    <span className="st-wave"><span /><span /><span /><span /></span>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                                    </svg>
                                )}
                                Listen
                            </button>

                            {!isDone && !isRecording && (
                                <button className="st-rec-btn" onClick={() => startRec(idx)}>
                                    <span className="st-rec-dot" />
                                    Record
                                </button>
                            )}
                            {isRecording && (
                                <button className="st-stop-btn" onClick={stopRec}>
                                    <span className="st-stop-sq" />
                                    Stop
                                </button>
                            )}
                            {isDone && !isRecording && (
                                <span className="st-recorded-label">Recorded</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Part 3: Read Aloud ────────────────────────────────────────────────────
function ReadAloudSection({ paragraph, recording: recBlob, onRecorded }) {
    const [recording, setRecording] = useState(false);
    const mediaRecorder = useRef(null);
    const chunks = useRef([]);

    const startRec = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            chunks.current = [];
            mediaRecorder.current = new MediaRecorder(stream);
            mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks.current, { type: "audio/webm" });
                onRecorded(blob);
                stream.getTracks().forEach(t => t.stop());
                setRecording(false);
            };
            mediaRecorder.current.start();
            setRecording(true);
        } catch {
            alert("Microphone access denied.");
        }
    };

    const stopRec = () => {
        if (mediaRecorder.current && recording) {
            mediaRecorder.current.stop();
        }
    };

    const isDone = !!recBlob;

    return (
        <div className="st-section">
            <div className="st-section-header">
                <span className="st-section-badge">Part 3 of 3</span>
                <h2 className="st-section-title">Read Aloud</h2>
                <p className="st-section-desc">
                    Read the paragraph below aloud clearly. Record once — no re-recording allowed.
                </p>
            </div>
            <div className={`st-card ${isDone ? "st-card-done" : ""}`}>
                <p className="st-paragraph">{paragraph}</p>
                <div className="st-repeat-actions" style={{ marginTop: 20 }}>
                    {!isDone && !recording && (
                        <button className="st-rec-btn" onClick={startRec}>
                            <span className="st-rec-dot" />
                            Record Reading
                        </button>
                    )}
                    {recording && (
                        <button className="st-stop-btn" onClick={stopRec}>
                            <span className="st-stop-sq" />
                            Stop Recording
                        </button>
                    )}
                    {isDone && <span className="st-done-badge large">✓ Recorded</span>}
                </div>
            </div>
        </div>
    );
}

// ── Step indicator (left panel) ───────────────────────────────────────────
function StepPanel({ currentPart }) {
    const steps = [
        { num: 1, label: "Listen & Select" },
        { num: 2, label: "Repeat Sentence" },
        { num: 3, label: "Read Aloud" },
    ];
    return (
        <div className="st-step-panel">
            <p className="st-step-panel-title">Spoken English</p>
            <div className="st-steps">
                {steps.map((s, i) => {
                    const state =
                        s.num < currentPart ? "done" :
                            s.num === currentPart ? "active" : "pending";
                    return (
                        <div key={s.num} className={`st-step ${state}`}>
                            <div className="st-step-circle">
                                {state === "done" ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                ) : (
                                    <span>{s.num}</span>
                                )}
                            </div>
                            {i < steps.length - 1 && <div className="st-step-line" />}
                            <span className="st-step-label">{s.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function SpokenTest() {
    const { token } = useParams();
    const [test, setTest] = useState(null);
    const [phase, setPhase] = useState("loading"); // loading | intro | test | submitting | done | error
    const [currentPart, setCurrentPart] = useState(1); // 1 | 2 | 3

    // Section state
    const [lsAnswers, setLsAnswers] = useState({});
    const [repeatRecs, setRepeatRecs] = useState({});
    const [readAloudRec, setReadAloudRec] = useState(null);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        fetch(`${API}/spoken/${token}`)
            .then(r => r.json())
            .then(data => {
                if (data.status === "submitted") {
                    setPhase("done");
                } else {
                    setTest(data);
                    setPhase("intro");
                }
            })
            .catch(() => setPhase("error"));
    }, [token]);

    const handleLsChange = (qIdx, optIdx) => {
        setLsAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
    };

    const handleRepeatRecorded = (idx, blob) => {
        setRepeatRecs(prev => ({ ...prev, [idx]: blob }));
    };

    // ── Per-part completion checks ────────────────────────────────────────
    const isPart1Done = () => {
        const lsCount = test?.listen_select_questions?.length || 0;
        return Object.keys(lsAnswers).length >= lsCount && lsCount > 0;
    };

    const isPart2Done = () => {
        const repCount = test?.repeat_sentences?.length || 0;
        return Object.keys(repeatRecs).length >= repCount && repCount > 0;
    };

    const isPart3Done = () => !!readAloudRec;

    const canAdvance = () => {
        if (currentPart === 1) return isPart1Done();
        if (currentPart === 2) return isPart2Done();
        return false;
    };

    const handleSubmit = async () => {
        setPhase("submitting");
        setSubmitError("");
        try {
            const formData = new FormData();
            const lsCount = test.listen_select_questions?.length || 0;
            const answersArr = Array.from({ length: lsCount }, (_, i) =>
                lsAnswers[i] !== undefined ? lsAnswers[i] : -1
            );
            formData.append("listen_select_answers", JSON.stringify(answersArr));

            const repCount = test.repeat_sentences?.length || 0;
            for (let i = 0; i < repCount; i++) {
                if (repeatRecs[i]) {
                    formData.append(`repeat_audio_${i}`, repeatRecs[i], `repeat_${i}.webm`);
                }
            }
            if (readAloudRec) {
                formData.append("read_aloud_audio", readAloudRec, "read_aloud.webm");
            }

            const res = await fetch(`${API}/spoken/${token}/submit`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Submission failed");
            setPhase("done");
        } catch {
            setSubmitError("Submission failed. Please try again.");
            setPhase("test");
        }
    };

    // ── Shell layouts ──────────────────────────────────────────────────────

    if (phase === "loading") return (
        <div className="tp-split st-split">
            <div className="tp-left st-left" />
            <div className="tp-right tp-right-centered">
                <div className="tp-spinner" />
                <p className="tp-body" style={{ marginTop: 16 }}>Loading your test…</p>
            </div>
        </div>
    );

    if (phase === "error") return (
        <div className="tp-split st-split">
            <div className="tp-left st-left" />
            <div className="tp-right tp-right-centered">
                <p className="tp-display">Test not found</p>
                <p className="tp-body">This test link may be expired or invalid.</p>
            </div>
        </div>
    );

    if (phase === "done") return (
        <div className="tp-split st-split">
            <div className="tp-left st-left" />
            <div className="tp-right tp-right-centered">
                <p className="tp-eyebrow">Spoken English Test</p>
                <p className="tp-display">Submitted Successfully</p>
                <p className="tp-body tp-body-ls">
                    Thank you for completing the test. Your responses are being evaluated
                    and you will be notified by email with the outcome.
                </p>
            </div>
        </div>
    );

    if (phase === "intro" && test) return (
        <div className="tp-split st-split">
            <div className="tp-left st-left" />
            <div className="tp-right">
                <div className="tp-intro-inner">
                    <p className="tp-eyebrow">Spoken English Test</p>
                    <p className="tp-display">{test.job_title}</p>
                    <p className="tp-body">
                        Hi {test.candidate_name}, this test evaluates your spoken English
                        through three sections.
                    </p>
                    <div className="tp-stats">
                        <div className="tp-stat">
                            <p className="tp-stat-num">3</p>
                            <p className="tp-stat-label">Sections</p>
                        </div>
                        <div className="tp-stat-sep" />
                        <div className="tp-stat">
                            <p className="tp-stat-num">5</p>
                            <p className="tp-stat-label">Questions</p>
                        </div>
                        <div className="tp-stat-sep" />
                        <div className="tp-stat">
                            <p className="tp-stat-num">70</p>
                            <p className="tp-stat-label">Max Score</p>
                        </div>
                    </div>
                    <div className="tp-rules">
                        <p className="tp-rules-title">Instructions</p>
                        {[
                            "Part 1 – Listen & Select: Play each sentence and pick the correct answer from 4 options.",
                            "Part 2 – Repeat Sentence: Listen, then record yourself repeating it exactly. One attempt only.",
                            "Part 3 – Read Aloud: Read the displayed paragraph aloud. Record once — no re-recording.",
                            "No playback of your own recordings is allowed.",
                            "Ensure your microphone is connected and permitted before starting.",
                        ].map((r, i) => (
                            <div key={i} className="tp-rule">
                                <span className="tp-rule-num">{i + 1}</span>
                                <span className="tp-rule-text">{r}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="tp-intro-footer">
                    <button className="tp-btn" onClick={() => setPhase("test")}>
                        Start Test
                    </button>
                </div>
            </div>
        </div>
    );

    // ── Test phase: one part at a time ─────────────────────────────────────
    if ((phase === "test" || phase === "submitting") && test) return (
        <div className="tp-split st-split">
            {/* Left: step indicator */}
            <div className="tp-left st-left">
                <StepPanel currentPart={currentPart} />
            </div>

            {/* Right: current part */}
            <div className="tp-right st-test-right">

                {currentPart === 1 && (
                    <>
                        <ListenSelectSection
                            questions={test.listen_select_questions || []}
                            answers={lsAnswers}
                            onChange={handleLsChange}
                        />
                        <div className="st-part-footer">
                            <span />
                            <button
                                className="tp-btn st-next-btn"
                                onClick={() => setCurrentPart(2)}
                                disabled={!canAdvance()}
                            >
                                Next
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                                </svg>
                            </button>
                        </div>
                    </>
                )}

                {currentPart === 2 && (
                    <>
                        <RepeatSentenceSection
                            sentences={test.repeat_sentences || []}
                            recordings={repeatRecs}
                            onRecorded={handleRepeatRecorded}
                        />
                        <div className="st-part-footer">
                            <button
                                className="st-back-btn"
                                onClick={() => setCurrentPart(1)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
                                </svg>
                                Back
                            </button>
                            <button
                                className="tp-btn st-next-btn"
                                onClick={() => setCurrentPart(3)}
                                disabled={!canAdvance()}
                            >
                                Next
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                                </svg>
                            </button>
                        </div>
                    </>
                )}

                {currentPart === 3 && (
                    <>
                        <ReadAloudSection
                            paragraph={test.read_aloud_paragraph || ""}
                            recording={readAloudRec}
                            onRecorded={setReadAloudRec}
                        />
                        {submitError && <p className="st-error">{submitError}</p>}
                        <div className="st-part-footer">
                            <button
                                className="st-back-btn"
                                onClick={() => setCurrentPart(2)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
                                </svg>
                                Back
                            </button>
                            <button
                                className="tp-btn st-next-btn"
                                onClick={handleSubmit}
                                disabled={!isPart3Done() || phase === "submitting"}
                            >
                                {phase === "submitting" ? "Submitting…" : "Submit Test"}
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );

    return null;
}