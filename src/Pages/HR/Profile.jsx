// Profile.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiCheck, FiLogOut, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const LIVEHR_API = "https://hiresy-livehr.onrender.com";

export default function Profile() {
    const email = localStorage.getItem("hr_email") || "";
    const name = localStorage.getItem("hr_name") || "";

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: name,
        title: localStorage.getItem("hr_title") || "",
        company: localStorage.getItem("hr_company") || "",
    });

    // interviews = live HR sessions fetched from backend
    const [interviews, setInterviews] = useState([]);
    const [eventPopup, setEventPopup] = useState(null);
    const [calDate, setCalDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());

    const navigate = useNavigate();

    // ── Fetch real Live HR sessions for this HR's email ───────────────────────
    useEffect(() => {
        if (!email) return;
        fetch(`${LIVEHR_API}/livehr/sessions?hr_email=${encodeURIComponent(email)}`)
            .then((r) => r.json())
            .then((sessions) => {
                const mapped = sessions.map((s) => {
                    const dt = s.scheduled_time ? new Date(s.scheduled_time) : null;
                    return {
                        // identity
                        token: s.token,
                        application_id: s.application_id,
                        // display
                        full_name: s.candidate_name,
                        job_name: s.job_title,
                        meet: s.meet_url,
                        status: s.status,
                        // time display
                        time: dt
                            ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "10:00",
                        dur: "1h",
                        // calendar placement
                        _day: dt ? dt.getDate() : null,
                        _month: dt ? dt.getMonth() : null,
                        _year: dt ? dt.getFullYear() : null,
                    };
                });
                setInterviews(mapped);
            })
            .catch(() => {
                // silently fail — calendar shows empty
            });
    }, [email]);

    // ── Open meet URL directly (session already created by round_router) ───────
    // const startInterview = (iv) => {
    //     if (iv.meet) {
    //         window.open(iv.meet, "_blank");
    //         return;
    //     }
    //     if (iv.token) {
    //         window.open(`/livehr/${iv.token}`, "_blank");
    //     }
    // };

    const startInterview = (iv) => {
        if (iv.token) {
            window.open(`/livehr/${iv.token}`, "_blank");
        }
    };

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = async () => {
        setSaving(true);
        localStorage.setItem("hr_name", form.name);
        localStorage.setItem("hr_title", form.title);
        localStorage.setItem("hr_company", form.company);
        await new Promise((r) => setTimeout(r, 500));
        setSaving(false);
        setEditing(false);
    };

    const logout = () => { localStorage.clear(); window.location.href = "/"; };

    const initials = form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "HR";

    // ── Calendar computation ──────────────────────────────────────────────────
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const monthName = calDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isToday = (d) =>
        d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    // Only show sessions that fall in the currently viewed month/year
    const scheduledDays = {};
    interviews.forEach((s) => {
        if (s._month === month && s._year === year && s._day) {
            if (!scheduledDays[s._day]) scheduledDays[s._day] = [];
            scheduledDays[s._day].push(s);
        }
    });
    const interviewDays = new Set(Object.keys(scheduledDays).map(Number));

    const prevMonth = () => setCalDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCalDate(new Date(year, month + 1, 1));
    const dayInterviews = scheduledDays[selectedDay] || [];

    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="pf-main">

            {/* ── Top bar ── */}
            <div className="pf-topbar">
                <p className="pf-topbar-title">Profile</p>
                <div className="pf-topbar-right">
                    {!editing ? (
                        <button className="pf-btn-ghost" onClick={() => setEditing(true)}>
                            <FiEdit2 size={13} /> Edit
                        </button>
                    ) : (
                        <>
                            <button className="pf-btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                            <button className="pf-btn-orange" onClick={save} disabled={saving}>
                                {saving ? <span className="pf-spin" /> : <FiCheck size={13} />}
                                {saving ? "Saving" : "Save"}
                            </button>
                        </>
                    )}
                    <button className="pf-btn-logout" onClick={logout}>
                        Logout <FiLogOut size={13} />
                    </button>
                </div>
            </div>

            <div className="pf-body">

                {/* ── Left ── */}
                <div className="pf-left">
                    <div className="pf-avatar-block">
                        <div className="pf-avatar">{initials}</div>
                        <div>
                            {editing ? (
                                <input
                                    className="pf-name-input"
                                    value={form.name}
                                    placeholder="Full name"
                                    onChange={(e) => set("name", e.target.value)}
                                />
                            ) : (
                                <p className="pf-name">{form.name || "Your Name"}</p>
                            )}
                            <p className="pf-email">{email}</p>
                        </div>
                    </div>

                    <div className="pf-meta-rows">
                        <div className="pf-meta-row">
                            <span className="pf-meta-label">Role</span>
                            {editing ? (
                                <input
                                    className="pf-meta-input"
                                    value={form.title}
                                    placeholder="e.g. HR Manager"
                                    onChange={(e) => set("title", e.target.value)}
                                />
                            ) : (
                                <span className="pf-meta-value">{form.title || "—"}</span>
                            )}
                        </div>
                        <div className="pf-meta-row">
                            <span className="pf-meta-label">Company</span>
                            {editing ? (
                                <input
                                    className="pf-meta-input"
                                    value={form.company}
                                    placeholder="Company name"
                                    onChange={(e) => set("company", e.target.value)}
                                />
                            ) : (
                                <span className="pf-meta-value">{form.company || "—"}</span>
                            )}
                        </div>
                    </div>

                    <div className="pf-stats-row">
                        <div className="pf-stat">
                            <span className="pf-stat-num">{interviews.length}</span>
                            <span className="pf-stat-label">Scheduled</span>
                        </div>
                        <div className="pf-stat">
                            <span className="pf-stat-num">
                                {interviews.filter((i) => i.status === "completed").length}
                            </span>
                            <span className="pf-stat-label">Completed</span>
                        </div>
                    </div>
                </div>

                {/* ── Right: Calendar ── */}
                <div className="pf-right">
                    <div className="cal-header">
                        <button className="cal-nav" onClick={prevMonth}><FiChevronLeft size={15} /></button>
                        <p className="cal-month">{monthName}</p>
                        <button className="cal-nav" onClick={nextMonth}><FiChevronRight size={15} /></button>
                    </div>

                    <div className="cal-days-row">
                        {DAYS.map((d) => <span key={d} className="cal-day-name">{d}</span>)}
                    </div>

                    <div className="cal-grid">
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`e${i}`} className="cal-cell cal-cell-empty" />
                        ))}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                            <div
                                key={d}
                                className={[
                                    "cal-cell",
                                    isToday(d) ? "cal-today" : "",
                                    selectedDay === d ? "cal-selected" : "",
                                    interviewDays.has(d) ? "cal-has-event" : "",
                                ].join(" ")}
                                onClick={() => setSelectedDay(d)}
                            >
                                <span>{d}</span>
                                {interviewDays.has(d) && (
                                    <span className="cal-event-badge">
                                        {(scheduledDays[d] || []).length}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="cal-events">
                        <p className="cal-events-title">
                            {new Date(year, month, selectedDay).toLocaleDateString("en-US", {
                                weekday: "long", month: "short", day: "numeric",
                            })}
                        </p>
                        {dayInterviews.length === 0 ? (
                            <p className="cal-events-empty">No interviews scheduled</p>
                        ) : (
                            dayInterviews.map((iv, i) => (
                                <div
                                    key={i}
                                    className="cal-event-item"
                                    onClick={() => setEventPopup(iv)}
                                >
                                    <div className="cal-event-time">
                                        <span className="cal-event-clock">{iv.time}</span>
                                        {/* <span className="cal-event-dur">{iv.dur}</span> */}
                                    </div>
                                    <div className="cal-event-bar" />
                                    <div className="cal-event-info">
                                        <p className="cal-event-name">{iv.full_name}</p>
                                        <p className="cal-event-role">{iv.job_name}</p>
                                    </div>
                                    <button
                                        className="ep-popup-join-btn"
                                        onClick={(e) => { e.stopPropagation(); startInterview(iv); }}
                                    >
                                        Join Now
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ── Event Popup ── */}
            {eventPopup && (
                <div className="ep-overlay" onClick={() => setEventPopup(null)}>
                    <div className="ep-popup" onClick={(e) => e.stopPropagation()}>

                        <div className="ep-popup-header">
                            <div>
                                <p className="ep-popup-time">{eventPopup.time} · {eventPopup.dur}</p>
                                <p className="ep-popup-title">{eventPopup.job_name}</p>
                            </div>
                            <button className="ep-popup-close" onClick={() => setEventPopup(null)}>✕</button>
                        </div>

                        <div className="ep-popup-candidate">
                            <div className="ep-popup-avatar">
                                {(eventPopup.full_name || "?")[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="ep-popup-cname">{eventPopup.full_name}</p>
                                <p className="ep-popup-crole">{eventPopup.job_name}</p>
                            </div>
                        </div>

                        <div className="ep-popup-meet-card">
                            <div className="ep-popup-meet-icon">
                                <img src="/gmeet.svg" width="28" height="28" alt="Meet" />
                            </div>
                            <div className="ep-popup-meet-info">
                                <p className="ep-popup-meet-label">
                                    {eventPopup.meet?.includes("8x8.vc") ? "JaaS Meet" : "Jitsi Meet"}
                                </p>
                                <p className="ep-popup-meet-url">
                                    {eventPopup.meet || "No meeting link"}
                                </p>
                            </div>
                            <a
                                href={eventPopup.meet || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="ep-popup-join-btn"
                            >
                                Join Now
                            </a>
                        </div>

                        <div className="ep-popup-actions">
                            <button className="ep-popup-reschedule" onClick={() => setEventPopup(null)}>
                                ↻ Reschedule
                            </button>
                            <button
                                className="ep-popup-view-btn"
                                onClick={() => {
                                    setEventPopup(null);
                                    navigate("/hrdashboard/all", {
                                        state: {
                                            candidateName: eventPopup.full_name,
                                            ts: Date.now(),
                                        },
                                    });
                                }}
                            >
                                View Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}