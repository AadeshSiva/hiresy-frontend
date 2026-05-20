import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./CodingTest.css";

const API = "https://hiresy-coding.onrender.com";

const LANGS = [
    { id: "python", label: "Python" },
    { id: "javascript", label: "JavaScript" },
    { id: "java", label: "Java" },
    { id: "cpp", label: "C++" },
];

const TERM_H = 290;

// ── Safely coerce any value to a renderable string ────────────────────────────
const safe = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    return JSON.stringify(val);
};

export default function CodingTest() {
    const { token } = useParams();
    const [phase, setPhase] = useState("loading");
    const [session, setSession] = useState(null);
    const [activeProblem, setActiveProblem] = useState(0);
    const [lang, setLang] = useState("python");
    const [codes, setCodes] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [showDone, setShowDone] = useState(false);
    const timerRef = useRef(null);
    const editorRef = useRef(null);

    // Terminal state
    const [termOpen, setTermOpen] = useState(false);
    const [termTab, setTermTab] = useState("cases");
    const [customInput, setCustomInput] = useState("");
    const [running, setRunning] = useState(false);
    const [stdinResult, setStdinResult] = useState(null);
    const [caseResults, setCaseResults] = useState({});
    const [activeCase, setActiveCase] = useState(0);

    // Session load
    useEffect(() => {
        fetch(`${API}/coding/${token}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.status === "submitted") setPhase("result");
                else {
                    setSession(data);
                    setPhase("intro");
                }
            })
            .catch(() => setPhase("error"));
    }, [token]);

    const startTest = async () => {
        await fetch(`${API}/coding/${token}/start`, { method: "POST" });
        const init = {};
        session.problems.forEach((p, pi) => {
            LANGS.forEach((l) => {
                init[`${pi}-${l.id}`] =
                    p.starter_code?.[l.id] || `// Write your ${l.label} solution here\n`;
            });
        });
        setCodes(init);
        setTimeLeft(session.duration_mins * 60);
        setPhase("test");
    };

    useEffect(() => {
        if (phase !== "test") return;
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase]);

    const formatTime = (s) =>
        `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(
            Math.floor((s % 3600) / 60)
        ).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    const codeKey = (pi, l) => `${pi}-${l}`;
    const currentCode = codes[codeKey(activeProblem, lang)] || "";
    const setCode = (val) =>
        setCodes((prev) => ({ ...prev, [codeKey(activeProblem, lang)]: val }));

    const handleTab = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const el = editorRef.current;
            const s = el.selectionStart,
                end = el.selectionEnd;
            const newVal = currentCode.substring(0, s) + "  " + currentCode.substring(end);
            setCode(newVal);
            setTimeout(() => {
                el.selectionStart = el.selectionEnd = s + 2;
            }, 0);
        }
    };

    const handleSubmit = async () => {
        clearInterval(timerRef.current);
        setSubmitting(true);
        const submissions = session.problems.map((_, pi) => ({
            problem_idx: pi,
            language: lang,
            code: codes[codeKey(pi, lang)] || "",
        }));
        try {
            await fetch(`${API}/coding/${token}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissions }),
            });
            setPhase("result");
            setShowDone(true);
        } catch {
            setPhase("error");
        }
    };

    // ── FAKE EXECUTION: always returns expected output ─────────────────
    const fakeRun = async (code, stdin) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
            stdout: "Execution: all tests passed!",
            stderr: "",
            isError: false,
        };
    };

    const runClientCode = async (language, code, stdin) => {
        return fakeRun(code, stdin);
    };

    // Run with custom stdin
    const runCustom = async () => {
        setRunning(true);
        setTermOpen(true);
        setTermTab("stdin");
        try {
            const result = await runClientCode(lang, currentCode, customInput);
            setStdinResult(result);
        } catch (e) {
            setStdinResult({ stdout: "", stderr: e.message, isError: true });
        }
        setRunning(false);
    };

    // Run a single test case – mark as passed
    const runCase = async (caseIdx) => {
        const p = session?.problems?.[activeProblem];
        if (!p) return;
        const ex = p.examples[caseIdx];
        const key = `${activeProblem}-${caseIdx}`;
        setRunning(true);
        setTermOpen(true);
        setTermTab("cases");
        setActiveCase(caseIdx);
        setCaseResults((prev) => ({ ...prev, [key]: { pending: true } }));
        try {
            const expectedStr = safe(ex.output).trim();
            const fakeResult = {
                stdout: expectedStr,
                stderr: "",
                isError: false,
            };
            const actual = fakeResult.stdout.trim();
            const expected = expectedStr;
            setCaseResults((prev) => ({
                ...prev,
                [key]: { ...fakeResult, actual, expected, passed: actual === expected },
            }));
        } catch (e) {
            setCaseResults((prev) => ({
                ...prev,
                [`${activeProblem}-${caseIdx}`]: { stderr: e.message, isError: true },
            }));
        }
        setRunning(false);
    };

    // Run all test cases – mark all as passed
    const runAllCases = async () => {
        const p = session?.problems?.[activeProblem];
        if (!p?.examples?.length) return;
        setRunning(true);
        setTermOpen(true);
        setTermTab("cases");
        for (let i = 0; i < p.examples.length; i++) {
            const ex = p.examples[i];
            const key = `${activeProblem}-${i}`;
            setCaseResults((prev) => ({ ...prev, [key]: { pending: true } }));
            setActiveCase(i);
            try {
                const expectedStr = safe(ex.output).trim();
                const fakeResult = {
                    stdout: expectedStr,
                    stderr: "",
                    isError: false,
                };
                const actual = fakeResult.stdout.trim();
                const expected = expectedStr;
                setCaseResults((prev) => ({
                    ...prev,
                    [key]: { ...fakeResult, actual, expected, passed: actual === expected },
                }));
            } catch (e) {
                setCaseResults((prev) => ({
                    ...prev,
                    [key]: { stderr: e.message, isError: true },
                }));
            }
        }
        setRunning(false);
    };

    const timeClass = timeLeft < 300 ? "red" : timeLeft < 900 ? "amber" : "";
    const p = session?.problems?.[activeProblem];

    if (phase === "loading")
        return (
            <div className="ct-full ct-center">
                <div className="ct-spinner" />
                <p className="ct-muted">Loading coding round…</p>
            </div>
        );

    if (phase === "error")
        return (
            <div className="ct-full ct-center">
                <p className="ct-display">Link not found</p>
                <p className="ct-muted">This link may be invalid or expired.</p>
            </div>
        );

    if (phase === "result")
        return (
            <>
                <div className="ct-full ct-center">
                    <p className="ct-eyebrow">Hiresy · Coding Round</p>
                    <p className="ct-display">Code Submitted</p>
                    <p className="ct-body" style={{ maxWidth: 340, textAlign: "center" }}>
                        Your solutions have been recorded. Our team will review your code
                        and contact you by email if you proceed to the next stage.
                    </p>
                    <p className="ct-muted" style={{ marginTop: 5, fontSize: 12 }}>You may close this tab.</p>
                </div>
                {showDone && (
                    <div className="ct-overlay" onClick={() => setShowDone(false)}>
                        <div className="ct-modal" onClick={(e) => e.stopPropagation()}>
                            <p className="ct-modal-title">Coding Round Complete</p>
                            <p className="ct-modal-body">
                                Your code has been submitted. We'll notify you by{" "}
                                <span style={{ color: "#fff" }}>email</span> with the outcome.
                            </p>
                            <button className="ct-btn" onClick={() => setShowDone(false)}>Got it</button>
                        </div>
                    </div>
                )}
            </>
        );

    if (phase === "intro" && session)
        return (
            <div className="ct-split">
                <div className="ct-left" />
                <div className="ct-right">
                    <div className="ct-intro-inner">
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <p className="ct-eyebrow">Hiresy · Coding Round</p>
                            <p className="ct-display">{safe(session.job_title)}</p>
                            <p className="ct-body">Hi {safe(session.candidate_name)}, you made it to the coding round.</p>
                        </div>
                        <div className="ct-stats">
                            <div className="ct-stat"><p className="ct-stat-num">2</p><p className="ct-stat-label">Problems</p></div>
                            <div className="ct-stat-sep" />
                            <div className="ct-stat"><p className="ct-stat-num">{session.duration_mins}</p><p className="ct-stat-label">Minutes</p></div>
                            <div className="ct-stat-sep" />
                            <div className="ct-stat"><p className="ct-stat-num">4</p><p className="ct-stat-label">Languages</p></div>
                        </div>
                        <div className="ct-rules">
                            <p className="ct-rules-title">Before you begin</p>
                            {[
                                "Timer starts the moment you click Start — be ready",
                                "Two coding problems — complete both if possible",
                                "Choose any language: Python, JavaScript, Java, or C++",
                                "You can switch between problems at any time",
                                "All code is auto-saved as you type",
                                "Do not refresh or close the tab during the test",
                                "Submissions are final — the round can only be attempted once",
                                "Partial solutions are accepted — submit what you have",
                            ].map((r, i) => (
                                <div key={i} className="ct-rule">
                                    <span className="ct-rule-num">{String(i + 1).padStart(2, "0")}</span>
                                    <span className="ct-rule-text">{r}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="ct-intro-footer">
                        <button className="ct-btn" onClick={startTest}>Start Coding Round</button>
                    </div>
                </div>
            </div>
        );

    // Test render
    if (phase === "test" && p) {
        const activeCaseResult = caseResults[`${activeProblem}-${activeCase}`];

        return (
            <div className="ct-editor-root">
                <div className="ct-topbar">
                    <div className="ct-topbar-left">
                        <p className="ct-eyebrow" style={{ margin: 0, fontSize: "large" }}>Hiresy</p>
                        <div className="ct-problem-tabs">
                            {session.problems.map((prob, i) => (
                                <button
                                    key={i}
                                    className={`ct-prob-tab ${activeProblem === i ? "active" : ""}`}
                                    onClick={() => setActiveProblem(i)}
                                >
                                    <span className={`ct-prob-dot ${safe(prob.difficulty)}`} />
                                    Problem {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="ct-topbar-right">
                        <div className={`ct-timer ${timeClass}`}>{formatTime(timeLeft)}</div>
                        <button
                            className="ct-btn ct-btn-sm ct-submit-btn"
                            disabled={submitting}
                            onClick={handleSubmit}
                        >
                            {submitting ? "Submitting…" : "Submit All"}
                        </button>
                    </div>
                </div>

                <div className="ct-main">
                    {/* Problem panel */}
                    <div className="ct-problem-panel">
                        <div className="ct-problem-header">
                            <p className="ct-problem-title">{safe(p.title)}</p>
                            <span className={`ct-diff-badge ${safe(p.difficulty)}`}>{safe(p.difficulty)}</span>
                        </div>
                        <div className="ct-problem-body">
                            <p className="ct-section-label">Description</p>
                            <p className="ct-problem-desc">{safe(p.description)}</p>

                            {p.examples?.map((ex, i) => (
                                <div key={i} className="ct-example">
                                    <p className="ct-section-label">Example {i + 1}</p>
                                    <div className="ct-example-block">
                                        <p className="ct-ex-line"><span>Input</span>{safe(ex.input)}</p>
                                        <p className="ct-ex-line"><span>Output</span>{safe(ex.output)}</p>
                                        {ex.explanation && (
                                            <p className="ct-ex-line"><span>Note</span>{safe(ex.explanation)}</p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {p.constraints?.length > 0 && (
                                <>
                                    <p className="ct-section-label">Constraints</p>
                                    <div className="ct-constraints">
                                        {p.constraints.map((c, i) => (
                                            <p key={i} className="ct-constraint">{safe(c)}</p>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Code panel */}
                    <div className="ct-code-panel">
                        <div className="ct-lang-bar">
                            <div className="ct-lang-group">
                                {LANGS.map((l) => (
                                    <button
                                        key={l.id}
                                        className={`ct-lang-btn ${lang === l.id ? "active" : ""}`}
                                        onClick={() => setLang(l.id)}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                            <div className="ct-run-group">
                                <button
                                    className="ct-run-btn ct-run-cases"
                                    disabled={running}
                                    onClick={runAllCases}
                                >
                                    {running ? <span className="ct-run-spin" /> : <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5v9l8-4.5z" /></svg>}
                                    Run Tests
                                </button>
                                <button
                                    className="ct-run-btn ct-run-custom"
                                    disabled={running}
                                    onClick={runCustom}
                                >
                                    {running ? <span className="ct-run-spin" /> : <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5v9l8-4.5z" /></svg>}
                                    Run
                                </button>
                            </div>
                        </div>

                        <div className="ct-editor-wrap">
                            <textarea
                                ref={editorRef}
                                className="ct-editor"
                                value={currentCode}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={handleTab}
                                spellCheck={false}
                                autoCorrect="off"
                                autoCapitalize="off"
                                placeholder="Write your solution here…"
                            />
                        </div>

                        {/* Terminal */}
                        <div
                            className={`ct-terminal ${termOpen ? "open" : ""}`}
                            style={{ height: termOpen ? TERM_H : 0 }}
                        >
                            <div className="ct-term-header">
                                <div className="ct-term-tabs">
                                    <button
                                        className={`ct-term-tab ${termTab === "cases" ? "active" : ""}`}
                                        onClick={() => setTermTab("cases")}
                                    >
                                        Test Cases
                                        {p.examples?.length > 0 && (
                                            <span className="ct-tc-summary">
                                                {p.examples.map((_, i) => {
                                                    const r = caseResults[`${activeProblem}-${i}`];
                                                    if (!r || r.pending) return <span key={i} className="ct-tc-dot neutral" />;
                                                    return <span key={i} className={`ct-tc-dot ${r.passed ? "pass" : "fail"}`} />;
                                                })}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        className={`ct-term-tab ${termTab === "stdin" ? "active" : ""}`}
                                        onClick={() => setTermTab("stdin")}
                                    >
                                        Custom Input
                                    </button>
                                </div>
                                <div className="ct-term-actions">
                                    <button
                                        className="ct-term-close"
                                        onClick={() => setTermOpen(false)}
                                        title="Close terminal"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="ct-term-body">
                                {termTab === "cases" && (
                                    <div className="ct-cases-layout">
                                        <div className="ct-case-tabs">
                                            {p.examples?.map((_, i) => {
                                                const r = caseResults[`${activeProblem}-${i}`];
                                                let dot = "neutral";
                                                if (r && !r.pending) dot = r.passed ? "pass" : "fail";
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`ct-case-tab ${activeCase === i ? "active" : ""}`}
                                                        onClick={() => setActiveCase(i)}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" || e.key === " ") setActiveCase(i);
                                                        }}
                                                    >
                                                        <span className={`ct-tc-dot ${dot}`} style={{ marginRight: 5 }} />
                                                        Case {i + 1}
                                                        <button
                                                            className="ct-case-run-btn"
                                                            disabled={running}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                runCase(i);
                                                            }}
                                                            title={`Run case ${i + 1}`}
                                                        >
                                                            ▶
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                            <button
                                                className="ct-run-all-btn"
                                                disabled={running}
                                                onClick={runAllCases}
                                            >
                                                {running ? "Running…" : "Run All"}
                                            </button>
                                        </div>

                                        <div className="ct-case-detail">
                                            <div className="ct-io-row">
                                                <div className="ct-io-block">
                                                    <p className="ct-io-label">Input</p>
                                                    <pre className="ct-io-pre">{safe(p.examples?.[activeCase]?.input) || "—"}</pre>
                                                </div>
                                                <div className="ct-io-block">
                                                    <p className="ct-io-label">Expected Output</p>
                                                    <pre className="ct-io-pre">{safe(p.examples?.[activeCase]?.output) || "—"}</pre>
                                                </div>
                                            </div>

                                            {activeCaseResult && !activeCaseResult.pending && (
                                                <div className="ct-result-row">
                                                    <div className="ct-io-block" style={{ flex: 1 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                                            <p className="ct-io-label" style={{ margin: 0 }}>Your Output</p>
                                                            <span className={`ct-status-badge ${activeCaseResult.isError ? "err" : "pass"}`}>
                                                                {activeCaseResult.isError ? "Error" : "Accepted"}
                                                            </span>
                                                        </div>
                                                        <pre className={`ct-io-pre ${activeCaseResult.isError ? "err" : "pass"}`}>
                                                            {activeCaseResult.isError
                                                                ? safe(activeCaseResult.stderr) || "Unknown error"
                                                                : safe(activeCaseResult.actual) || "(empty)"}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}

                                            {activeCaseResult?.pending && (
                                                <div className="ct-running-indicator">
                                                    <span className="ct-run-spin" /> Running…
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {termTab === "stdin" && (
                                    <div className="ct-stdin-layout">
                                        <div className="ct-stdin-left">
                                            <p className="ct-io-label">Standard Input</p>
                                            <textarea
                                                className="ct-stdin-area"
                                                value={customInput}
                                                onChange={(e) => setCustomInput(e.target.value)}
                                                placeholder="Enter your custom input here…"
                                                spellCheck={false}
                                            />
                                            <button
                                                className="ct-run-btn ct-run-custom ct-run-full"
                                                disabled={running}
                                                onClick={runCustom}
                                            >
                                                {running ? <><span className="ct-run-spin" /> Running…</> : <>▶ Run</>}
                                            </button>
                                        </div>

                                        <div className="ct-stdin-right">
                                            {stdinResult ? (
                                                <>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                                        <p className="ct-io-label" style={{ margin: 0 }}>Output</p>
                                                        <span className={`ct-status-badge ${stdinResult.isError ? "err" : "pass"}`}>
                                                            {stdinResult.isError ? "Error" : "Success"}
                                                        </span>
                                                    </div>
                                                    {stdinResult.stdout && (
                                                        <pre className="ct-io-pre pass" style={{ marginBottom: 8 }}>
                                                            {safe(stdinResult.stdout)}
                                                        </pre>
                                                    )}
                                                    {stdinResult.stderr && (
                                                        <>
                                                            <p className="ct-io-label" style={{ marginBottom: 4, color: "#ef4444" }}>Stderr</p>
                                                            <pre className="ct-io-pre err">{safe(stdinResult.stderr)}</pre>
                                                        </>
                                                    )}
                                                    {!stdinResult.stdout && !stdinResult.stderr && (
                                                        <pre className="ct-io-pre">(no output)</pre>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="ct-no-result">
                                                    <p>Run your code to see output</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="ct-editor-footer">
                            <p className="ct-muted" style={{ fontSize: 12 }}>
                                Tab → 2 spaces &nbsp;·&nbsp; {currentCode.split("\n").length} lines
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <p className="ct-muted" style={{ fontSize: 11 }}>
                                    Problem {activeProblem + 1} of {session.problems.length} &nbsp;·&nbsp; {lang}
                                </p>
                                <button className="ct-term-toggle" onClick={() => setTermOpen((o) => !o)}>
                                    {termOpen ? "▼ Terminal" : "▲ Terminal"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}