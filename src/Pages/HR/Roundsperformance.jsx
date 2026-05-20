import { useMemo, useState } from "react";
import "./RoundsPerformance.css";

/* ─── helpers ─────────────────────────────────────────── */
function scoreColor(s) {
    if (s == null) return "#888";
    if (s >= 75) return "#00a855";
    if (s >= 50) return "#f59e0b";
    return "#ff4400";
}
function scoreBg(s) {
    if (s == null) return "rgba(0,0,0,0.04)";
    if (s >= 75) return "rgba(0,168,85,0.10)";
    if (s >= 50) return "rgba(245,158,11,0.10)";
    return "rgba(255,68,0,0.10)";
}
function fmtDuration(start, end, secs) {
    if (secs != null) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    if (!start || !end) return "—";
    const ms = new Date(end) - new Date(start);
    if (isNaN(ms) || ms <= 0) return "—";
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}
function getScore(d) {
    if (!d) return null;
    const raw = d.score_pct ?? d.score ?? d.candidate_score ?? null;
    return raw != null ? Math.round(raw) : null;
}
function getDuration(d) {
    if (!d) return "—";
    return fmtDuration(d.started_at, d.submitted_at, d.duration_secs);
}

/* ─── pass badge ─────────────────────────────────────── */
function PassBadge({ passed, status }) {
    if (status === "pending" || status === "pending_review" || passed == null)
        return <span className="rp3-badge rp3-badge--pending">Pending</span>;
    return passed
        ? <span className="rp3-badge rp3-badge--pass">Passed</span>
        : <span className="rp3-badge rp3-badge--fail">Failed</span>;
}

/* ─── per-round meta ────────────────────────────────── */
const SHORTLISTING = ["MCQ Test", "Vibe Coding", "Aptitude / Logical"];
const VERBAL = ["Verbal Ability Test"];
const SPOKEN = ["Spoken English Test"];
const CODING = ["Basic Programming"];

function getRoundMeta(r) {
    const d = r.data;
    const name = r.round_name;
    const score = getScore(d);
    const passed = d?.passed ?? null;
    const status = d?.status ?? null;
    const duration = getDuration(d);
    let correct = "—", total = "—", type = "generic";

    if (SHORTLISTING.includes(name) || VERBAL.includes(name)) {
        type = "mcq";
        const answers = Array.isArray(d?.answers) ? d.answers : [];
        total = d?.total_questions || answers.length || "—";
        const c = d?.correct ?? (answers.length > 0 ? answers.filter(a => a?.is_correct).length : null);
        correct = c != null ? c : (score != null && total !== "—" ? Math.round((score / 100) * total) : "—");
    } else if (SPOKEN.includes(name)) {
        type = "spoken";
    } else if (CODING.includes(name)) {
        type = "coding";
        const subs = Array.isArray(d?.submissions) ? d.submissions : [];
        total = subs.length || "—";
        correct = d?.language || "—";
    }
    return { score, passed, status, duration, correct, total, type };
}

/* ─── KV pair ───────────────────────────────────────── */
function KV({ label, value, accent }) {
    return (
        <div className="rp3-kv">
            <span className="rp3-kv-label">{label}</span>
            <span className="rp3-kv-val" style={accent ? { color: accent, fontWeight: 500 } : {}}>{value ?? "—"}</span>
        </div>
    );
}

/* ─── expand renderers ──────────────────────────────── */
function MCQExpand({ data, correct, total, score }) {
    const answers = Array.isArray(data.answers) ? data.answers.slice(0, 15) : [];
    const wrong = data.wrong ?? (total !== "—" && correct !== "—" ? total - correct : "—");
    return (
        <div className="rp3-expand-grid">
            <div className="rp3-expand-meta">
                <div className="rp3-kv-grid">
                    <KV label="Score" value={score != null ? `${score}%` : "—"} />
                    <KV label="Pass mark" value={`${data.pass_score ?? 60}%`} />
                    <KV label="Total Qs" value={total} />
                    <KV label="Correct" value={correct} accent="#00a855" />
                    <KV label="Wrong" value={wrong} accent="#ff4400" />
                </div>
            </div>
            {answers.length > 0 && (
                <div className="rp3-expand-answers">
                    <p className="rp3-expand-sub">Question breakdown</p>
                    <table className="rp3-inner-table">
                        <thead><tr><th>#</th><th>Result</th><th>Answer given</th></tr></thead>
                        <tbody>
                            {answers.map((a, i) => (
                                <tr key={i}>
                                    <td>Q{i + 1}</td>
                                    <td><span className={`rp3-result-pill ${a?.is_correct ? "correct" : "wrong"}`}>{a?.is_correct ? "✓ Correct" : "✗ Wrong"}</span></td>
                                    <td className="rp3-td-muted">{a?.selected ?? "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function SpokenExpand({ data }) {
    let evalObj = {};
    try { evalObj = typeof data.evaluation === "string" ? JSON.parse(data.evaluation) : (data.evaluation || {}); } catch { }
    const evalText = typeof evalObj === "string" ? evalObj : (evalObj.feedback || evalObj.evaluation || evalObj.summary || "");
    const transcript = data.transcript || "";
    return (
        <div className="rp3-expand-grid rp3-expand-grid--single">
            {evalText && <><p className="rp3-expand-sub">AI evaluation</p><p className="rp3-expand-text">{evalText}</p></>}
            {transcript && <><p className="rp3-expand-sub" style={{ marginTop: 12 }}>Transcript</p><p className="rp3-expand-text rp3-transcript">{transcript.slice(0, 500)}{transcript.length > 500 ? "…" : ""}</p></>}
            {!evalText && !transcript && <p className="rp3-expand-empty">No evaluation data yet.</p>}
        </div>
    );
}

function CodingExpand({ data }) {
    const subs = Array.isArray(data.submissions) ? data.submissions : [];
    const lastSub = subs.find(s => s?.code) || subs[0] || null;
    const code = lastSub?.code || "";
    return (
        <div className="rp3-expand-grid">
            <div className="rp3-expand-meta">
                <div className="rp3-kv-grid">
                    <KV label="Language" value={data.language || "—"} />
                    <KV label="Submissions" value={subs.length || 0} />
                    <KV label="Status" value={data.status || "—"} />
                    {lastSub?.problem_idx != null && <KV label="Problem" value={`#${lastSub.problem_idx + 1}`} />}
                </div>
                {/* <div className="rp3-review-note">Requires manual HR review — no automated score.</div> */}
            </div>
            {code && (
                <div className="rp3-expand-answers">
                    <p className="rp3-expand-sub">Code preview</p>
                    <pre className="rp3-code">{code.slice(0, 900)}{code.length > 900 ? "\n… (truncated)" : ""}</pre>
                </div>
            )}
        </div>
    );
}

/* ─── BGV popup ─────────────────────────────────────── */
const DUMMY_BGV_FILES = [
    { name: "Aadhaar Card.pdf", type: "Identity", size: "1.2 MB", status: "verified", uploaded: "18 May 2026" },
    { name: "PAN Card.pdf", type: "Identity", size: "0.8 MB", status: "verified", uploaded: "18 May 2026" },
    { name: "10th Marksheet.pdf", type: "Education", size: "2.1 MB", status: "verified", uploaded: "18 May 2026" },
    { name: "12th Marksheet.pdf", type: "Education", size: "1.9 MB", status: "pending", uploaded: "19 May 2026" },
    { name: "Degree Certificate.pdf", type: "Education", size: "3.4 MB", status: "pending", uploaded: "19 May 2026" },
    { name: "Experience Letter.pdf", type: "Employment", size: "0.5 MB", status: "verified", uploaded: "18 May 2026" },
    { name: "Relieving Letter.pdf", type: "Employment", size: "0.4 MB", status: "under_review", uploaded: "20 May 2026" },
    { name: "Bank Statement (3mo).pdf", type: "Financial", size: "4.2 MB", status: "under_review", uploaded: "20 May 2026" },
];

function fileStatusStyle(s) {
    if (s === "verified") return { label: "Verified", color: "#00a855", bg: "rgba(0,168,85,0.08)", border: "rgba(0,168,85,0.25)" };
    if (s === "pending") return { label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" };
    return { label: "Under Review", color: "#cc6600", bg: "rgba(204,102,0,0.07)", border: "rgba(204,102,0,0.22)" };
}

function BGVPopup({ onClose }) {
    const groups = DUMMY_BGV_FILES.reduce((acc, f) => {
        if (!acc[f.type]) acc[f.type] = [];
        acc[f.type].push(f);
        return acc;
    }, {});
    const verified = DUMMY_BGV_FILES.filter(f => f.status === "verified").length;
    const total = DUMMY_BGV_FILES.length;

    return (
        <div className="rp3-overlay" onClick={onClose}>
            <div className="rp3-modal" onClick={e => e.stopPropagation()}>
                <div className="rp3-modal-hd">
                    <div>
                        <p className="rp3-modal-title">Background Verification</p>
                        <p className="rp3-modal-sub">{verified} of {total} documents verified</p>
                    </div>
                    <button className="rp3-modal-x" onClick={onClose}>✕</button>
                </div>

                <div className="rp3-modal-pbar">
                    <div className="rp3-modal-pfill" style={{ width: `${Math.round((verified / total) * 100)}%` }} />
                </div>
                <p className="rp3-modal-pct">{Math.round((verified / total) * 100)}% complete</p>

                <div className="rp3-modal-body">
                    {Object.entries(groups).map(([type, files]) => (
                        <div key={type} className="rp3-bgv-group">
                            <p className="rp3-bgv-group-label">{type}</p>
                            {files.map((f, i) => {
                                const st = fileStatusStyle(f.status);
                                return (
                                    <div key={i} className="rp3-bgv-row">
                                        <div className="rp3-bgv-icon">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                            </svg>
                                        </div>
                                        <div className="rp3-bgv-info">
                                            <p className="rp3-bgv-fname">{f.name}</p>
                                            <p className="rp3-bgv-fmeta">{f.size} · {f.uploaded}</p>
                                        </div>
                                        <span className="rp3-fstatus" style={{ color: st.color, background: st.bg, borderColor: st.border }}>{st.label}</span>
                                        <button className="rp3-bgv-view">View</button>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="rp3-modal-ft">
                    <button className="rp3-modal-cancel" onClick={onClose}>Close</button>
                    <button className="rp3-modal-approve">Approve All Verified</button>
                </div>
            </div>
        </div>
    );
}

/* ─── LEFT PANEL ─────────────────────────────────────── */
function OverallPanel({ rounds }) {
    const validScores = rounds.map(r => getScore(r.data)).filter(s => s != null);
    const avg = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : null;
    const passed = rounds.filter(r => r.data?.passed === true).length;
    const failed = rounds.filter(r => r.data?.passed === false).length;
    const pending = rounds.filter(r => r.data?.passed == null).length;
    const bestRound = rounds.reduce((best, r) => {
        const s = getScore(r.data);
        return (s != null && (best == null || s > getScore(best.data))) ? r : best;
    }, null);

    return (
        <div className="rp3-left">
            <div className="rp3-left-top">
                <div className="rp3-left-header">
                    <span className="rp3-left-tag">Summary</span>
                    <p className="rp3-left-title">Pipeline Performance</p>
                </div>

                <div className="rp3-avg-block">
                    <div className="rp3-avg-ring" style={{ "--ring-color": scoreColor(avg), "--ring-pct": avg != null ? `${avg}%` : "0%" }}>
                        <span className="rp3-avg-num" style={{ color: scoreColor(avg ?? 0) }}>{avg ?? "—"}</span>
                        <span className="rp3-avg-sublabel">avg</span>
                    </div>
                    <p className="rp3-avg-caption">Overall Score</p>
                </div>

                <div className="rp3-stat-list">
                    <div className="rp3-stat-row"><span className="rp3-stat-label">Total rounds</span><span className="rp3-stat-val">{rounds.length}</span></div>
                    <div className="rp3-stat-row"><span className="rp3-stat-label">Passed</span><span className="rp3-stat-val" style={{ color: "#00a855" }}>{passed}</span></div>
                    <div className="rp3-stat-row"><span className="rp3-stat-label">Failed</span><span className="rp3-stat-val" style={{ color: "#ff4400" }}>{failed}</span></div>
                    <div className="rp3-stat-row"><span className="rp3-stat-label">Pending</span><span className="rp3-stat-val" style={{ color: "#f59e0b" }}>{pending}</span></div>
                    {bestRound && (
                        <div className="rp3-stat-row">
                            <span className="rp3-stat-label">Best round</span>
                            <span className="rp3-best-name">{bestRound.round_name}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="rp3-left-bottom">
                <div className="rp3-score-legend">
                    <div className="rp3-legend-row"><span className="rp3-legend-dot" style={{ background: "#00a855" }} />75+ <span className="rp3-legend-hint">Excellent</span></div>
                    <div className="rp3-legend-row"><span className="rp3-legend-dot" style={{ background: "#f59e0b" }} />50–74 <span className="rp3-legend-hint">Average</span></div>
                    <div className="rp3-legend-row"><span className="rp3-legend-dot" style={{ background: "#ff4400" }} />{"<"}50 <span className="rp3-legend-hint">Below pass</span></div>
                </div>
            </div>
        </div>
    );
}

/* ─── RIGHT PANEL ────────────────────────────────────── */
function DetailPanel({ rounds }) {
    const [expandedRow, setExpandedRow] = useState(null);
    const [bgvOpen, setBgvOpen] = useState(false);

    // Replace with real data from props/API
    const offer = {
        status: "accepted",       // "sent" | "accepted" | "declined" | null
        salary: "₹12,00,000 / yr",
        joiningDate: "16 Jun 2026",
        location: "Bangalore / Remote",
    };

    // status badge styles — no blue, only red shades + green
    const offerBadgeStyle = (() => {
        if (!offer.status) return { color: "#999", bg: "rgba(0,0,0,0.04)", border: "rgba(0,0,0,0.10)", label: "Not Sent" };
        if (offer.status === "accepted") return { color: "#00a855", bg: "rgba(0,168,85,0.08)", border: "rgba(0,168,85,0.25)", label: "Accepted" };
        if (offer.status === "declined") return { color: "#ff4400", bg: "rgba(255,68,0,0.08)", border: "rgba(255,68,0,0.25)", label: "Declined" };
        // "sent" — use a muted orange-red tint
        return { color: "#cc4400", bg: "rgba(204,68,0,0.07)", border: "rgba(204,68,0,0.22)", label: "Awaiting" };
    })();

    return (
        <div className="rp3-right">
            {bgvOpen && <BGVPopup onClose={() => setBgvOpen(false)} />}

            {/* ── table ── */}
            <div className="rp3-right-table-section">
                <p className="rp3-right-title">Round Details</p>
                <div className="rp3-table-wrap">
                    <table className="rp3-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Round</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Duration</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rounds.map((r, i) => {
                                const { score, passed, status, duration, correct, total, type } = getRoundMeta(r);
                                const d = r.data;
                                const isExpanded = expandedRow === i;
                                const date = d?.submitted_at
                                    ? new Date(d.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                                    : "—";
                                return [
                                    <tr key={`row-${i}`}
                                        className={`rp3-tr ${isExpanded ? "rp3-tr--expanded" : ""}`}
                                        onClick={() => setExpandedRow(isExpanded ? null : i)}
                                    >
                                        <td className="rp3-td-index">{i + 1}</td>
                                        <td className="rp3-td-name"><span className="rp3-round-name">{r.round_name}</span></td>
                                        <td className="rp3-td-score">
                                            {score != null
                                                ? <span className="rp3-score-chip" style={{ color: scoreColor(score), background: scoreBg(score) }}>{score}</span>
                                                : <span className="rp3-score-null">—</span>}
                                        </td>
                                        <td className="rp3-td-badge"><PassBadge passed={passed} status={status} /></td>
                                        <td className="rp3-td-dur">{duration}</td>
                                        <td className="rp3-td-date">{date}</td>
                                        <td className="rp3-td-chevron"><span className={`rp3-chevron ${isExpanded ? "rp3-chevron--open" : ""}`}>›</span></td>
                                    </tr>,
                                    isExpanded && (
                                        <tr key={`expand-${i}`} className="rp3-expand-row">
                                            <td colSpan={7}>
                                                <div className="rp3-expand-body">
                                                    {!d ? (
                                                        <p className="rp3-expand-empty">No data available yet.</p>
                                                    ) : type === "mcq" ? (
                                                        <MCQExpand data={d} correct={correct} total={total} score={score} />
                                                    ) : type === "spoken" ? (
                                                        <SpokenExpand data={d} />
                                                    ) : type === "coding" ? (
                                                        <CodingExpand data={d} />
                                                    ) : (
                                                        <div className="rp3-kv-grid" style={{ maxWidth: 300 }}>
                                                            <KV label="Score" value={score != null ? `${score}` : "—"} />
                                                            <KV label="Status" value={d.status || "—"} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                ];
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── bottom info strip ── */}
            <div className="rp3-info-strip">

                {/* BGV */}
                <div className="rp3-info-card">
                    <div className="rp3-info-card-icon rp3-info-card-icon--bgv">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <polyline points="9 12 11 14 15 10" />
                        </svg>
                    </div>
                    <div className="rp3-info-card-text">
                        <p className="rp3-info-card-title">Background Verification</p>
                        <p className="rp3-info-card-sub">8 documents · 5 verified</p>
                    </div>
                    <button className="rp3-bgv-btn" onClick={() => setBgvOpen(true)}>
                        View Files
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 5 }}>
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </button>
                </div>

                {/* Offer */}
                <div className="rp3-info-card">
                    <div className="rp3-info-card-icon rp3-info-card-icon--offer">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 3H8l-6 4h20l-6-4z" />
                        </svg>
                    </div>
                    <div className="rp3-info-card-text">
                        <p className="rp3-info-card-title">Offer Letter</p>
                        {offer.status ? (
                            <p className="rp3-info-card-sub">
                                {offer.salary} · {offer.joiningDate}
                            </p>
                        ) : (
                            <p className="rp3-info-card-sub">No offer sent yet</p>
                        )}
                    </div>
                    <span
                        className="rp3-offer-status-badge"
                        style={{ color: offerBadgeStyle.color, background: offerBadgeStyle.bg, borderColor: offerBadgeStyle.border }}
                    >
                        {offerBadgeStyle.label}
                    </span>
                </div>

            </div>
        </div>
    );
}

/* ─── MAIN ───────────────────────────────────────────── */
export default function RoundsPerformance({ roundsData }) {
    const rounds = useMemo(() => {
        if (!roundsData || !Array.isArray(roundsData)) return [];
        return roundsData.filter(r => r?.round_name);
    }, [roundsData]);

    if (!rounds.length) {
        return (
            <div className="rp3-empty">
                <span>📋</span>
                <p>No round data yet. Results will appear as the candidate progresses.</p>
            </div>
        );
    }

    return (
        <div className="rp3-root">
            <OverallPanel rounds={rounds} />
            <DetailPanel rounds={rounds} />
        </div>
    );
}