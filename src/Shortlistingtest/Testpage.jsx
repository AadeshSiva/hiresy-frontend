import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./TestPage.css";
import VibeCoding from "./VibeCoding";

const API = "https://hiresy-test.onrender.com";

export default function TestPage() {
    const { token } = useParams();
    const [phase, setPhase] = useState("loading");
    const [test, setTest] = useState(null);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [result, setResult] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [showDone, setShowDone] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        fetch(`${API}/test/${token}`)
            .then(r => r.json())
            .then(data => {
                if (data.status === "submitted" || data.status === "pending_review" || data.status === "evaluating") {
                    setResult(data);
                    setPhase("result");
                } else {
                    setTest(data);
                    setPhase("intro");
                }
            })
            .catch(() => setPhase("error"));
    }, [token]);

    const startTest = async () => {
        await fetch(`${API}/test/${token}/start`, { method: "POST" });
        if (test?.test_type !== "vibe_coding") {
            setTimeLeft(test.duration_mins * 60);
            setAnswers(new Array(test.questions?.length || 0).fill(null));
        }
        setPhase("test");
    };

    useEffect(() => {
        if (phase !== "test" || test?.test_type === "vibe_coding") return;
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase, test]);

    const formatTime = s =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    const nextQuestion = () => {
        const updated = [...answers];
        updated[current] = selected;
        setAnswers(updated);
        setSelected(null);
        if (current < (test.questions?.length || 0) - 1) setCurrent(c => c + 1);
        else handleSubmit(updated);
    };

    const handleSubmit = async (finalAnswers) => {
        clearInterval(timerRef.current);
        setSubmitting(true);
        let payload;
        if (test?.test_type === "vibe_coding") {
            return; // submission handled by VibeCoding component
        } else {
            const ans = (finalAnswers || answers).map(a => a ?? 0);
            payload = { answers: ans };
        }
        try {
            const res = await fetch(`${API}/test/${token}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setResult(data);
            setPhase("result");
            setShowDone(true);
        } catch {
            setPhase("error");
        }
    };

    const currentQuestion = test?.questions?.[current];
    const totalQuestions = test?.questions?.length ?? 0;
    const progress = totalQuestions ? (current / totalQuestions) * 100 : 0;
    const isLast = totalQuestions > 0 && current === totalQuestions - 1;
    const answeredCount = answers.filter(a => a !== null).length;

    if (phase === "loading") return (
        <div className="tp-split">
            <div className="tp-left" />
            <div className="tp-right">
                <div className="tp-right-centered">
                    <div className="tp-spinner" />
                    <p className="tp-caption">Loading your test…</p>
                </div>
            </div>
        </div>
    );

    if (phase === "error") return (
        <div className="tp-split">
            <div className="tp-left" />
            <div className="tp-right">
                <div className="tp-right-centered">
                    <p className="tp-display">Link not found</p>
                    <p className="tp-caption">This test link may be invalid or has already been used.</p>
                </div>
            </div>
        </div>
    );

    if (phase === "result") return (
        <>
            <div className="tp-split">
                <div className="tp-left" />
                <div className="tp-right">
                    <div className="tp-right-centered">
                        <p className="tp-eyebrow">
                            Hiresy · {result?.test_type === "vibe_coding" ? "Vibe Coding" : "Shortlisting"}
                        </p>
                        <p className="tp-display">
                            {result?.status === "pending_review" ? "Code Submitted" : "Test Submitted"}
                        </p>
                        <p className="tp-body" style={{ maxWidth: 320, fontSize: 'medium' }}>
                            {result?.status === "pending_review"
                                ? "Your code has been recorded. AI will evaluate it shortly, and you'll be notified by email."
                                : "Your responses have been recorded. Our team will review your performance and reach out by email if you are selected for the next round."}
                        </p>
                        <p className="tp-caption" style={{ marginTop: 8, color: 'orangered' }}>
                            <i>You may close this tab.</i>
                        </p>
                    </div>
                </div>
            </div>
            {showDone && (
                <div className="tp-overlay" onClick={() => setShowDone(false)}>
                    <div className="tp-modal" onClick={e => e.stopPropagation()}>
                        <img className="tp-modal-icon" src="/testdone.svg" alt="" />
                        <p className="tp-modal-title">Test Completed</p>
                        <p className="tp-modal-body">
                            Thank you for completing the test. We will notify you by email about the results.
                        </p>
                        <button className="tp-modal-btn" onClick={() => setShowDone(false)}>Got it</button>
                    </div>
                </div>
            )}
        </>
    );

    if (phase === "intro" && test) return (
        <div className="tp-split">
            <div className="tp-left" />
            <div className="tp-right">
                <div className="tp-intro-inner">
                    <div className="tp-flex-col tp-gap-1">
                        <p className="tp-eyebrow">
                            Hiresy · {test.test_type === "vibe_coding" ? "Vibe Coding" : "Shortlisting Test"}
                        </p>
                        <p className="tp-display">{test.job_title}</p>
                        <p className="tp-body">Hi <span style={{ fontWeight: 600 }}>{test.candidate_name}</span>, you're one step away.</p>
                    </div>

                    <div className="tp-stats">
                        <div className="tp-stat">
                            <p className="tp-stat-num">{test.test_type === "vibe_coding" ? "1" : (test.total_questions ?? 0)}</p>
                            <p className="tp-stat-label">{test.test_type === "vibe_coding" ? "Task" : "Questions"}</p>
                        </div>
                        <div className="tp-stat-sep" />
                        <div className="tp-stat">
                            <p className="tp-stat-num">{test.duration_mins}</p>
                            <p className="tp-stat-label">Minutes</p>
                        </div>
                        <div className="tp-stat-sep" />
                        <div className="tp-stat">
                            <p className="tp-stat-num" style={{ color: "#ff4400" }}>{test.pass_score}%</p>
                            <p className="tp-stat-label">To Pass</p>
                        </div>
                    </div>

                    <div className="tp-rules">
                        <p className="tp-rules-title">Before you begin</p>
                        {[
                            "Timer starts immediately when you click Start — be ready",
                            test.test_type !== "vibe_coding" ? "Each question has exactly one correct answer" : "You will be given a coding problem to solve",
                            "You cannot return to a previous question" + (test.test_type !== "vibe_coding" ? "" : " (only one task)"),
                            "Test auto-submits when the timer reaches zero",
                            "Do not refresh or close the tab during the test",
                            "Ensure a stable internet connection throughout",
                            test.test_type !== "vibe_coding" ? "All questions are required — unanswered ones default to option A" : "Write your solution in the code editor",
                            "This test can only be attempted once",
                        ].map((r, i) => (
                            <div key={i} className="tp-rule">
                                <span className="tp-rule-num">{String(i + 1).padStart(2, "0")}</span>
                                <span className="tp-rule-text">{r}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="tp-intro-footer">
                    <button className="tp-btn" onClick={startTest}>Start Test</button>
                </div>
            </div>
        </div>
    );

    if (phase === "test" && test?.test_type === "vibe_coding") {
        return <VibeCoding token={token} test={test} onComplete={(resultData) => {
            setResult(resultData);
            setPhase("result");
            setShowDone(true);
        }} />;
    }

    if (phase === "test" && currentQuestion) return (
        <div className="tp-split">
            <div className="tp-left">
                <div className="tp-timer-card">
                    <p className={`tp-timer-num ${timeLeft < 60 ? "red" : timeLeft < 180 ? "amber" : ""}`}>
                        {formatTime(timeLeft)}
                    </p>
                    <p className="tp-timer-label">remaining</p>
                </div>
            </div>

            <div className="tp-right tp-question-right">
                <div className="tp-q-header">
                    <p className="tp-eyebrow">{test.job_title}</p>
                    <div className="tp-q-tags">
                        <span className="tp-tag-skill">{currentQuestion.skill}</span>
                        <span className={`tp-tag-diff ${currentQuestion.difficulty}`}>{currentQuestion.difficulty}</span>
                    </div>
                </div>

                <div className="tp-q-progress">
                    <div className="tp-q-bar"><div className="tp-q-bar-fill" style={{ width: `${progress}%` }} /></div>
                    <p className="tp-caption">{current + 1} / {totalQuestions}</p>
                </div>

                <p className="tp-question">{currentQuestion.question}</p>

                <div className="tp-options">
                    {currentQuestion.options.map((opt, i) => (
                        <button key={i}
                            className={`tp-option ${selected === i ? "active" : ""}`}
                            onClick={() => setSelected(i)}>
                            <span className="tp-opt-letter">{["A", "B", "C", "D"][i]}</span>
                            <span className="tp-opt-text">{opt}</span>
                        </button>
                    ))}
                </div>

                <div className="tp-q-footer">
                    <p className="tp-caption">{answeredCount} of {totalQuestions} answered</p>
                    <button className="tp-btn tp-btn-sm"
                        disabled={selected === null || submitting}
                        onClick={nextQuestion}>
                        {submitting ? "Submitting…" : isLast ? "Submit" : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );

    return null;
}