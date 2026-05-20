import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import "./Offer.css";

const API = import.meta.env.VITE_OFFER_URL || "https://hiresy-offer.onrender.com";

export default function Offer() {
    const { token } = useParams();

    /* ─── offer data ─── */
    const [offer, setOffer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ─── signature canvas ─── */
    const canvasRef = useRef(null);
    const drawing = useRef(false);
    const history = useRef([]);          // snapshots for undo
    const [hasSig, setHasSig] = useState(false);

    /* ─── submission ─── */
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    /* ═══════════════════════════════════════
       1. Fetch offer details
    ═══════════════════════════════════════ */
    useEffect(() => {
        if (!token) return;
        fetch(`${API}/offer/${token}`)
            .then((r) => {
                if (!r.ok) throw new Error(`Server returned ${r.status}`);
                return r.json();
            })
            .then((d) => { setOffer(d); setLoading(false); })
            .catch((e) => { setError(e.message); setLoading(false); });
    }, [token]);

    /* ═══════════════════════════════════════
       2. Canvas helpers
    ═══════════════════════════════════════ */
    const getXY = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left) * (canvas.width / rect.width),
            y: (src.clientY - rect.top) * (canvas.height / rect.height),
        };
    };

    const saveSnapshot = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        history.current.push(canvas.toDataURL());
        if (history.current.length > 30) history.current.shift();
    }, []);

    const onPointerDown = useCallback((e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        saveSnapshot();
        const ctx = canvas.getContext("2d");
        const { x, y } = getXY(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
        drawing.current = true;
    }, [saveSnapshot]);

    const onPointerMove = useCallback((e) => {
        e.preventDefault();
        if (!drawing.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const { x, y } = getXY(e, canvas);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "#1a1a2e";
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        setHasSig(true);
    }, []);

    const onPointerUp = useCallback(() => { drawing.current = false; }, []);

    const clearSig = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        history.current = [];
        setHasSig(false);
    };

    const undoSig = () => {
        const canvas = canvasRef.current;
        if (!canvas || history.current.length === 0) return;
        const prev = history.current.pop();
        const img = new Image();
        img.onload = () => {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = prev;
        if (history.current.length === 0) setHasSig(false);
    };

    /* ═══════════════════════════════════════
       3. Submit signature
    ═══════════════════════════════════════ */
    const handleSign = async () => {
        if (!hasSig) return;
        setSubmitting(true);
        const canvas = canvasRef.current;
        const signature_b64 = canvas.toDataURL("image/png");
        try {
            const res = await fetch(`${API}/offer/${token}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signature_b64 }),
            });
            if (!res.ok) throw new Error("Failed to submit signature");
            setDone(true);
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    /* ═══════════════════════════════════════
       4. Render states
    ═══════════════════════════════════════ */
    if (loading) return (
        <div className="offer-shell">
            <div className="offer-loader">
                <span className="offer-loader-ring" />
                <p>Fetching your offer letter…</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="offer-shell">
            <div className="offer-error">
                <span className="offer-error-icon">✗</span>
                <h2>Unable to load offer</h2>
                <p>{error}</p>
            </div>
        </div>
    );

    if (done) return (
        <div className="offer-shell">
            <div className="offer-done">
                <div className="offer-done-seal">✦</div>
                <h2>Offer Accepted</h2>
                <p>
                    Congratulations, <strong>{offer?.candidate_name}</strong>!<br />
                    Your signed offer letter has been submitted. We'll be in touch shortly.
                </p>
                <span className="offer-done-sub">You may now close this window.</span>
            </div>
        </div>
    );

    const today = new Date().toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
    });

    const startDate = offer?.start_date
        ? new Date(offer.start_date).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric",
        })
        : "To be confirmed";

    return (
        <div className="offer-shell">

            {/* ── Ambient background shapes ── */}
            <div className="offer-bg-blob b1" />
            <div className="offer-bg-blob b2" />

            <main className="offer-doc" role="document">

                {/* ── Header ── */}
                <header className="offer-header">
                    <div className="offer-wordmark">Hiersy</div>
                    <div className="offer-header-rule" />
                    <p className="offer-header-sub">Confidential Offer of Employment</p>
                </header>

                {/* ── Meta row ── */}
                <div className="offer-meta-row">
                    <div className="offer-meta-item">
                        <span className="offer-meta-label">Date</span>
                        <span className="offer-meta-val">{today}</span>
                    </div>
                    <div className="offer-meta-item">
                        <span className="offer-meta-label">Reference</span>
                        <span className="offer-meta-val offer-token">{token?.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="offer-meta-item">
                        <span className="offer-meta-label">Status</span>
                        <span className="offer-meta-val offer-badge">Awaiting Signature</span>
                    </div>
                </div>

                {/* ── Salutation ── */}
                <section className="offer-body">
                    <p className="offer-salutation">
                        Dear <span className="offer-highlight">{offer?.candidate_name || "Candidate"}</span>,
                    </p>

                    <p>
                        We are delighted to extend this offer of employment to you for the position of{" "}
                        <strong>{offer?.job_title || "the role"}</strong> at <strong>Hiersy</strong>.
                        This offer reflects our confidence in your abilities and our excitement about having
                        you join our team.
                    </p>

                    {/* ── Terms table ── */}
                    <div className="offer-terms">
                        <h3 className="offer-section-title">
                            <span className="offer-section-num">01</span> Terms of Employment
                        </h3>
                        <div className="offer-terms-grid">
                            <TermRow label="Position" value={offer?.job_title} />
                            <TermRow label="Department" value={offer?.department} />
                            <TermRow label="Work Mode" value={offer?.work_style} />
                            <TermRow label="Employment Type" value={offer?.job_type} />
                            <TermRow label="Commencement Date" value={startDate} />
                            <TermRow
                                label="Annual CTC"
                                value={
                                    offer?.salary
                                        ? `₹ ${Number(offer.salary).toLocaleString("en-IN")}`
                                        : offer?.salary_range
                                }
                            />
                            <TermRow label="Reporting Manager" value={offer?.reporting_manager} />
                            <TermRow label="Work Location" value={offer?.location} />
                        </div>
                    </div>

                    {/* ── Conditions ── */}
                    <div className="offer-conditions">
                        <h3 className="offer-section-title">
                            <span className="offer-section-num">02</span> Conditions of Offer
                        </h3>
                        <ul className="offer-cond-list">
                            <li>This offer is contingent upon the successful completion of background verification.</li>
                            <li>You are required to provide original documents for verification on your first day.</li>
                            <li>The offer is subject to your acceptance within <strong>5 business days</strong> of receipt.</li>
                            <li>Your employment will be subject to a probation period of <strong>3 months</strong>.</li>
                            <li>Compensation details remain strictly confidential.</li>
                        </ul>
                    </div>

                    {/* ── Custom clauses from offer data ── */}
                    {offer?.additional_notes && (
                        <div className="offer-notes">
                            <h3 className="offer-section-title">
                                <span className="offer-section-num">03</span> Additional Notes
                            </h3>
                            <p>{offer.additional_notes}</p>
                        </div>
                    )}

                    {/* ── Closing ── */}
                    <p className="offer-closing">
                        We look forward to your positive response and are confident that you will find this
                        a rewarding opportunity. Please sign below to formally accept this offer.
                    </p>

                    <p className="offer-regards">
                        Warm regards,<br />
                        <strong>{offer?.hr_name || "The Hiring Team"}</strong><br />
                        <span className="offer-regards-sub">Human Resources · Hiersy</span>
                    </p>
                </section>

                {/* ── Divider ── */}
                <div className="offer-divider">
                    <span>E-Signature</span>
                </div>

                {/* ── Signature block ── */}
                <section className="offer-sign-section">
                    <p className="offer-sign-instruction">
                        Draw your signature in the box below using your mouse or finger to accept this offer.
                    </p>

                    <div className="offer-canvas-wrap">
                        <div className="offer-canvas-label">Candidate Signature</div>
                        <canvas
                            ref={canvasRef}
                            className="offer-canvas"
                            width={680}
                            height={180}
                            onMouseDown={onPointerDown}
                            onMouseMove={onPointerMove}
                            onMouseUp={onPointerUp}
                            onMouseLeave={onPointerUp}
                            onTouchStart={onPointerDown}
                            onTouchMove={onPointerMove}
                            onTouchEnd={onPointerUp}
                        />
                        <div className="offer-canvas-baseline" />
                        <div className="offer-canvas-actions">
                            <button className="offer-btn-ghost" onClick={undoSig} disabled={!hasSig}>
                                ↩ Undo
                            </button>
                            <button className="offer-btn-ghost" onClick={clearSig} disabled={!hasSig}>
                                ✕ Clear
                            </button>
                        </div>
                    </div>

                    <div className="offer-sign-meta">
                        <div className="offer-sign-meta-item">
                            <span className="offer-meta-label">Full Name</span>
                            <span className="offer-meta-val">{offer?.candidate_name}</span>
                        </div>
                        <div className="offer-sign-meta-item">
                            <span className="offer-meta-label">Date of Signing</span>
                            <span className="offer-meta-val">{today}</span>
                        </div>
                    </div>

                    <button
                        className={`offer-btn-primary ${!hasSig || submitting ? "disabled" : ""}`}
                        onClick={handleSign}
                        disabled={!hasSig || submitting}
                    >
                        {submitting ? (
                            <>
                                <span className="offer-btn-spinner" />
                                Submitting…
                            </>
                        ) : (
                            <>✦ Accept &amp; Submit Offer</>
                        )}
                    </button>

                    <p className="offer-legal">
                        By submitting your signature you confirm that you have read, understood, and agree to
                        the terms stated in this offer letter. This constitutes a legally binding e-signature
                        under applicable law.
                    </p>
                </section>

                {/* ── Footer ── */}
                <footer className="offer-footer">
                    <span>Hiersy · Confidential</span>
                    <span>Token: {token?.slice(0, 8).toUpperCase()}</span>
                    <span>Generated {today}</span>
                </footer>

            </main>
        </div>
    );
}

/* ── Helper component ── */
function TermRow({ label, value }) {
    if (!value) return null;
    return (
        <div className="offer-term-row">
            <span className="offer-term-label">{label}</span>
            <span className="offer-term-val">{value}</span>
        </div>
    );
}