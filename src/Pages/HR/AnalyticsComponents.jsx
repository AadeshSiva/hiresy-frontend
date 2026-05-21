import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    AreaChart, Area, CartesianGrid, LineChart, Line
} from "recharts";
import { useState } from "react";
import {
    FiGithub, FiStar, FiGitBranch, FiCode, FiUsers, FiGlobe,
    FiActivity, FiAlertCircle, FiTrendingUp, FiBook, FiMapPin,
    FiBriefcase, FiAward, FiExternalLink
} from "react-icons/fi";
import "./Analyticscomponents.css";

const ORANGE = "#ff4400";
const PALETTE = ["#ff4400", "#ff6633", "#ff8855", "#ffaa77", "#cc3700", "#b33000", "#ff2200", "#ff9966", "#dd5500", "#ff7744"];

/* ── Tooltip ── */
const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="ac-tip">
            {label && <p className="ac-tip-label">{label}</p>}
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color || "#ccc" }}>{p.name}: <b>{p.value}</b></p>
            ))}
        </div>
    );
};

/* ── Error overlay ── */
function DataError({ msg = "Cannot fetch data" }) {
    return (
        <div className="ac-error-overlay">
            <FiAlertCircle size={20} />
            <span>{msg}</span>
        </div>
    );
}

/* ── Metric card ── */
function Metric({ label, value, icon: Icon, color = ORANGE, sub }) {
    return (
        <div className="ac-metric">
            <div className="ac-metric-top">
                <span className="ac-metric-label">{label}</span>
                {Icon && <Icon size={12} color={color} />}
            </div>
            <p className="ac-metric-value" style={{ color }}>{value}</p>
            {sub && <p className="ac-metric-sub">{sub}</p>}
        </div>
    );
}

/* ── Section header ── */
function SectionHeader({ title, sub }) {
    return (
        <div className="ac-section-header">
            <p className="ac-section-title">{title}</p>
            {sub && <p className="ac-section-sub">{sub}</p>}
        </div>
    );
}

// ══════════════════════════════════════════════
// GITHUB ANALYTICS
// ══════════════════════════════════════════════
export function GitHubAnalytics({ data, aiNote }) {
    const [view, setView] = useState("overview");

    if (!data || !data.username) {
        return (
            <div className="ac-unavailable">
                <DataError msg="No GitHub profile provided" />
            </div>
        );
    }

    const langData = Object.entries(data.languages || {})
        .sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([name, value], i) => ({
            name, value, fill: PALETTE[i],
            pct: ((value / (data.total_repos || 1)) * 100).toFixed(1)
        }));

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const commitActivity = (data.commit_activity || months.map(month => ({ month, commits: 0 })));

    const heatmapData = Array.from({ length: 52 * 7 }, (_, idx) => ({
        week: Math.floor(idx / 7), day: idx % 7,
        value: Math.floor(Math.random() * 8 * (Math.random() > 0.3 ? 1 : 0))
    }));

    const topByStars = [...(data.top_repos || [])].sort((a, b) => b.stars - a.stars).slice(0, 6)
        .map(r => ({ name: r.name?.slice(0, 14) || "?", stars: r.stars || 0, forks: r.forks || 0 }));

    const sizeData = [...(data.top_repos || [])].sort((a, b) => (b.size_kb || 0) - (a.size_kb || 0)).slice(0, 6)
        .map(r => ({ name: r.name?.slice(0, 14) || "?", size: +(((r.size_kb || 0) / 1024).toFixed(1)) }));

    const repoTypeData = [
        { name: "Original", value: data.repo_types?.original || 0, fill: ORANGE },
        { name: "Forked", value: data.repo_types?.forked || 0, fill: "#b33000" },
    ];

    const radarData = [
        { metric: "Repos", value: Math.min(100, (data.total_repos || 0) * 4) },
        { metric: "Stars", value: Math.min(100, (data.total_stars || 0) * 5) },
        { metric: "Forks", value: Math.min(100, (data.total_forks || 0) * 8) },
        { metric: "Languages", value: Math.min(100, Object.keys(data.languages || {}).length * 12) },
        { metric: "Followers", value: Math.min(100, (data.followers || 0) * 5) },
    ];

    const TABS = ["overview", "languages", "activity", "repos"];

    return (
        <div className="ac-root">

            {/* Tab nav */}
            <div className="ac-tabs">
                {TABS.map(t => (
                    <button key={t} className={`ac-tab ${view === t ? "active" : ""}`} onClick={() => setView(t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
                <a href={`https://github.com/${data.username}`} target="_blank" rel="noreferrer" className="ac-tab-link">
                    <FiGithub size={13} /> @{data.username} <FiExternalLink size={11} />
                </a>
            </div>

            {/* ── OVERVIEW ── */}
            {view === "overview" && (
                <div className="ac-overview-grid">

                    {/* Metrics row */}
                    <div className="ac-metrics-band">
                        <Metric label="Public Repos" value={data.public_repos || data.total_repos || 0} icon={FiGithub} color={ORANGE} />
                        <Metric label="Total Stars" value={data.total_stars || 0} icon={FiStar} color="#f59e0b" />
                        <Metric label="Total Forks" value={data.total_forks || 0} icon={FiGitBranch} color="#3b82f6" />
                        <Metric label="Followers" value={data.followers || 0} icon={FiUsers} color="#8b5cf6" />
                        <Metric label="Following" value={data.following || 0} icon={FiUsers} color="#555" />
                        <Metric label="Code Size" value={`${data.total_size_mb || 0} MB`} icon={FiCode} color="#22c55e" />
                        <Metric label="Languages" value={Object.keys(data.languages || {}).length} icon={FiCode} color={ORANGE} />
                        <Metric label="Original" value={data.repo_types?.original || 0} icon={FiActivity} color="#ff6633" />
                    </div>

                    {/* Charts row */}
                    <div className="ac-charts-row">
                        {/* Language pie */}
                        {langData.length > 0 && (
                            <div className="ac-card">
                                <SectionHeader title="Language Distribution" />
                                <div className="ac-pie-wrap">
                                    <PieChart width={170} height={170}>
                                        <Pie data={langData.slice(0, 6)} cx={83} cy={83} innerRadius={44} outerRadius={75}
                                            dataKey="value" strokeWidth={2} stroke="#ffffff">
                                            {langData.slice(0, 6).map((_, i) => <Cell key={i} fill={PALETTE[i]} />)}
                                        </Pie>
                                        <Tooltip content={<Tip />} />
                                    </PieChart>
                                    <div className="ac-legend">
                                        {langData.slice(0, 6).map((l, i) => (
                                            <div key={i} className="ac-legend-row">
                                                <span className="ac-legend-dot" style={{ background: l.fill }} />
                                                <span className="ac-legend-name">{l.name}</span>
                                                <span className="ac-legend-val">{l.pct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Repo types */}
                        <div className="ac-card">
                            <SectionHeader title="Repo Types" />
                            <div className="ac-pie-wrap">
                                <PieChart width={150} height={150}>
                                    <Pie data={repoTypeData} cx={72} cy={72} innerRadius={36} outerRadius={62}
                                        dataKey="value" strokeWidth={2} stroke="#ffffff">
                                        {repoTypeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                    </Pie>
                                    <Tooltip content={<Tip />} />
                                </PieChart>
                                <div className="ac-legend">
                                    {repoTypeData.map((d, i) => (
                                        <div key={i} className="ac-legend-row">
                                            <span className="ac-legend-dot" style={{ background: d.fill }} />
                                            <span className="ac-legend-name">{d.name}</span>
                                            <span className="ac-legend-val">{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Radar */}
                        <div className="ac-card ac-card-grow">
                            <SectionHeader title="Profile Strength" />
                            <RadarChart cx={110} cy={90} outerRadius={68} width={220} height={180} data={radarData}>
                                <PolarGrid stroke="#1e1e1e" />
                                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#555" }} />
                                <Radar dataKey="value" stroke={ORANGE} fill={ORANGE} fillOpacity={0.15} strokeWidth={2} />
                                <Tooltip content={<Tip />} />
                            </RadarChart>
                        </div>
                    </div>

                    {/* AI note */}
                    {aiNote && (
                        <div className="ac-ai-note">
                            <span className="ac-ai-badge">AI</span>
                            {aiNote}
                        </div>
                    )}
                </div>
            )}

            {/* ── LANGUAGES ── */}
            {view === "languages" && (
                <div className="ac-card ac-card-full">
                    <SectionHeader title="All Languages Used" sub={`${langData.length} languages detected`} />
                    <div className="ac-lang-bars">
                        {langData.map((l, i) => (
                            <div key={i} className="ac-lang-row">
                                <div className="ac-lang-label">
                                    <span className="ac-legend-dot" style={{ background: l.fill }} />
                                    <span>{l.name}</span>
                                </div>
                                <div className="ac-lang-track">
                                    <div className="ac-lang-fill" style={{ width: `${l.pct}%`, background: l.fill }} />
                                </div>
                                <span className="ac-lang-count">{l.value} repos · {l.pct}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── ACTIVITY ── */}
            {view === "activity" && (
                <div className="ac-activity-grid">
                    <div className="ac-card ac-card-full">
                        <SectionHeader title="Commit Activity" sub="Based on public push events (last 90 days)" />
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={commitActivity} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="ghGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={ORANGE} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="2 4" stroke="#111" />
                                <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 10 }} />
                                <YAxis tick={{ fill: "#555", fontSize: 10 }} />
                                <Tooltip content={<Tip />} />
                                <Area type="monotone" dataKey="commits" name="Commits" stroke={ORANGE} fill="url(#ghGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="ac-card ac-card-full">
                        <SectionHeader title="Contribution Heatmap" sub="Illustrative — full data requires GitHub OAuth" />
                        <div className="ac-heatmap">
                            {Array.from({ length: 7 }).map((_, day) => (
                                <div key={day} className="ac-heatmap-row">
                                    {Array.from({ length: 52 }).map((_, week) => {
                                        const v = heatmapData.find(d => d.week === week && d.day === day)?.value || 0;
                                        return (
                                            <div key={week} className="ac-heatmap-cell"
                                                style={{ backgroundColor: `rgba(255,68,0,${v / 8})` }}
                                                title={`${v} contributions`} />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                        <div className="ac-heatmap-legend">
                            <span>Less</span>
                            <div className="ac-heatmap-gradient" />
                            <span>More</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── REPOS ── */}
            {view === "repos" && (
                <div className="ac-repos-grid">
                    <div className="ac-card">
                        <SectionHeader title="Top by Stars" />
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={topByStars} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="2 4" stroke="#111" horizontal={false} />
                                <XAxis type="number" tick={{ fill: "#555", fontSize: 10 }} />
                                <YAxis dataKey="name" type="category" tick={{ fill: "#555", fontSize: 10 }} width={90} />
                                <Tooltip content={<Tip />} />
                                <Bar dataKey="stars" name="Stars" radius={[0, 4, 4, 0]} fill={ORANGE} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="ac-card">
                        <SectionHeader title="Top by Forks" />
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={topByStars} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="2 4" stroke="#111" horizontal={false} />
                                <XAxis type="number" tick={{ fill: "#555", fontSize: 10 }} />
                                <YAxis dataKey="name" type="category" tick={{ fill: "#555", fontSize: 10 }} width={90} />
                                <Tooltip content={<Tip />} />
                                <Bar dataKey="forks" name="Forks" radius={[0, 4, 4, 0]} fill="#b33000" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {sizeData.some(d => d.size > 0) && (
                        <div className="ac-card ac-card-full">
                            <SectionHeader title="Repository Size (MB)" />
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={sizeData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="2 4" stroke="#111" />
                                    <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 10 }} />
                                    <YAxis tick={{ fill: "#555", fontSize: 10 }} />
                                    <Tooltip content={<Tip />} />
                                    <Bar dataKey="size" name="Size (MB)" radius={[4, 4, 0, 0]}>
                                        {sizeData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className="ac-card ac-card-full">
                        <SectionHeader title="Repository Details" />
                        <div className="ac-repo-table">
                            <div className="ac-repo-thead">
                                <span>Name</span><span>Language</span><span>Stars</span><span>Forks</span><span>Description</span>
                            </div>
                            {(data.top_repos || []).map((r, i) => (
                                <div key={i} className="ac-repo-trow">
                                    <span className="ac-repo-name">{r.name}</span>
                                    <span className="ac-lang-tag" style={{ color: PALETTE[i % PALETTE.length], borderColor: PALETTE[i % PALETTE.length] + "44", background: PALETTE[i % PALETTE.length] + "11" }}>
                                        {r.language || "—"}
                                    </span>
                                    <span className="ac-repo-stars">{r.stars}</span>
                                    <span className="ac-repo-forks">{r.forks || 0}</span>
                                    <span className="ac-repo-desc">{r.description || "—"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════
// LEETCODE ANALYTICS
// ══════════════════════════════════════════════
export function LeetCodeAnalytics({ data, aiNote }) {
    const [view, setView] = useState("overview");

    if (!data || !data.total) {
        return (
            <div className="ac-unavailable">
                <DataError msg="No LeetCode data available" />
            </div>
        );
    }

    const total = data.total || 0;
    const diffData = [
        { name: "Easy", value: data.easy || 0, fill: "#22c55e", pct: total ? +((data.easy || 0) / total * 100).toFixed(1) : 0 },
        { name: "Medium", value: data.medium || 0, fill: ORANGE, pct: total ? +((data.medium || 0) / total * 100).toFixed(1) : 0 },
        { name: "Hard", value: data.hard || 0, fill: "#ef4444", pct: total ? +((data.hard || 0) / total * 100).toFixed(1) : 0 },
    ];

    const topics = [
        { name: "Arrays & Hashing", solved: Math.floor((data.easy || 0) * 0.4 + 5) },
        { name: "Two Pointers", solved: Math.floor((data.easy || 0) * 0.2 + 3) },
        { name: "Stack", solved: Math.floor((data.medium || 0) * 0.2 + 2) },
        { name: "Binary Search", solved: Math.floor((data.medium || 0) * 0.15 + 2) },
        { name: "Trees", solved: Math.floor((data.medium || 0) * 0.25 + 3) },
        { name: "Dynamic Programming", solved: Math.floor((data.hard || 0) * 0.5 + 2) },
        { name: "Graphs", solved: Math.floor((data.hard || 0) * 0.3 + 1) },
        { name: "Backtracking", solved: Math.floor((data.hard || 0) * 0.2 + 1) },
    ].sort((a, b) => b.solved - a.solved);

    return (
        <div className="ac-root">
            <div className="ac-tabs">
                {["overview", "topics", "contest"].map(t => (
                    <button key={t} className={`ac-tab ${view === t ? "active" : ""}`} onClick={() => setView(t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
                {data.username && (
                    <a href={`https://leetcode.com/${data.username}`} target="_blank" rel="noreferrer" className="ac-tab-link">
                        <img src="/leetcode.svg" width={13} height={13} alt="LeetCode" />
                        @{data.username} <FiExternalLink size={11} />
                    </a>
                )}
            </div>

            {view === "overview" && (
                <div className="ac-overview-grid">
                    <div className="ac-metrics-band">
                        <Metric label="Total Solved" value={total} icon={FiCode} color={ORANGE} />
                        <Metric label="Easy" value={data.easy || 0} icon={FiActivity} color="#22c55e" />
                        <Metric label="Medium" value={data.medium || 0} icon={FiActivity} color={ORANGE} />
                        <Metric label="Hard" value={data.hard || 0} icon={FiActivity} color="#ef4444" />
                        <Metric label="Global Rank" value={data.ranking ? `#${Number(data.ranking).toLocaleString()}` : "N/A"} icon={FiTrendingUp} color="#8b5cf6" />
                    </div>

                    <div className="ac-charts-row">
                        {/* Donut */}
                        <div className="ac-card">
                            <SectionHeader title="Difficulty Split" />
                            <div className="ac-pie-wrap" style={{ position: "relative" }}>
                                <div style={{ position: "relative" }}>
                                    <PieChart width={170} height={170}>
                                        <Pie data={diffData} cx={83} cy={83} innerRadius={52} outerRadius={78}
                                            dataKey="value" strokeWidth={2} stroke="#ffffff">
                                            {diffData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                        </Pie>
                                        <Tooltip content={<Tip />} />
                                    </PieChart>
                                    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                                        <div style={{ fontSize: 22, fontWeight: 500, color: "#181818", lineHeight: 1 }}>{total}</div>
                                        <div style={{ fontSize: 9, color: "#000000", textTransform: "uppercase" }}>Solved</div>
                                    </div>
                                </div>
                                <div className="ac-legend">
                                    {diffData.map((d, i) => (
                                        <div key={i} className="ac-legend-row">
                                            <span className="ac-legend-dot" style={{ background: d.fill }} />
                                            <span className="ac-legend-name">{d.name}</span>
                                            <span className="ac-legend-val" style={{ color: d.fill }}>{d.value} ({d.pct}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bar */}
                        <div className="ac-card ac-card-grow">
                            <SectionHeader title="Problems by Difficulty" />
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={diffData} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="2 4" stroke="#111" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: "#555", fontSize: 10 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#888" }} width={60} />
                                    <Tooltip content={<Tip />} />
                                    <Bar dataKey="value" name="Solved" radius={[0, 6, 6, 0]}>
                                        {diffData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Acceptance gauge */}
                        <div className="ac-card">
                            <SectionHeader title="Acceptance Rate" />
                            <div className="ac-gauge-center">
                                <svg width="160" height="100" viewBox="0 0 160 100">
                                    <path d="M16,80 A64,64 0 0,1 144,80" fill="none" stroke="#cbcbcb" strokeWidth="13" strokeLinecap="round" />
                                    <path d="M16,80 A64,64 0 0,1 144,80" fill="none" stroke={ORANGE} strokeWidth="13"
                                        strokeDasharray={`${0.72 * 201} 201`} strokeLinecap="round" />
                                    <text x="80" y="74" textAnchor="middle" fill="#282828" fontSize="22" fontWeight="800">72%</text>
                                    <text x="80" y="90" textAnchor="middle" fill="#555" fontSize="9">Acceptance</text>
                                </svg>
                            </div>
                        </div>
                    </div>
                    {aiNote && <div className="ac-ai-note"><span className="ac-ai-badge">AI</span>{aiNote}</div>}
                </div>
            )}

            {view === "topics" && (
                <div className="ac-card ac-card-full">
                    <SectionHeader title="Estimated Problems by Topic" sub="* Estimated based on total solved" />
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={topics} layout="vertical" margin={{ top: 4, right: 30, left: 130, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="2 4" stroke="#111" horizontal={false} />
                            <XAxis type="number" tick={{ fill: "#555", fontSize: 10 }} />
                            <YAxis dataKey="name" type="category" tick={{ fill: "#888", fontSize: 11 }} width={120} />
                            <Tooltip content={<Tip />} />
                            <Bar dataKey="solved" name="Solved" radius={[0, 4, 4, 0]}>
                                {topics.map((_, i) => <Cell key={i} fill={`rgba(255,68,0,${0.35 + i * 0.065})`} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {view === "contest" && (
                <div className="ac-card ac-card-full">
                    <SectionHeader title="Contest Rating" sub="* Estimated — actual data requires LeetCode premium API" />
                    <div className="ac-metrics-band" style={{ marginBottom: 16 }}>
                        <Metric label="Contest Rating" value={data.contest_rating || "N/A"} icon={FiAward} color="#f59e0b" />
                        <Metric label="Contests Attended" value={data.contests_attended || 0} icon={FiActivity} color={ORANGE} />
                        <Metric label="Active Days" value={data.active_days || 0} icon={FiTrendingUp} color="#22c55e" />
                    </div>
                    <div className="ac-no-contest-note">
                        <FiAlertCircle size={14} />
                        <span>Full contest history requires LeetCode Premium API access</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════
// LINKEDIN ANALYTICS
// ══════════════════════════════════════════════
export function LinkedInAnalytics({ score, reasoning, candidate, linkedinUrl }) {
    const c = candidate || {};
    const skills = (c.technical_skills || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 12);

    return (
        <div className="ac-root">
            <div className="ac-li-grid">

                {/* Bio card */}
                <div className="ac-li-bio-card">
                    <div className="ac-li-header">
                        <div className="ac-li-avatar">{(c.full_name || "?")[0].toUpperCase()}</div>
                        <div>
                            <p className="ac-li-name">{c.full_name || "—"}</p>
                            <p className="ac-li-role">{c.current_title || ""}{c.company_name ? ` · ${c.company_name}` : ""}</p>
                            {linkedinUrl && (
                                <a href={linkedinUrl} target="_blank" rel="noreferrer" className="ac-li-ext">
                                    <img src="/linkedin.svg" width={12} height={12} alt="LinkedIn" />
                                    View Profile <FiExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="ac-li-divider" />

                    <div className="ac-li-facts">
                        {c.location && <div className="ac-li-fact"><FiMapPin size={11} /><span>{c.location}</span></div>}
                        {c.years_exp && <div className="ac-li-fact"><FiBriefcase size={11} /><span>{c.years_exp} years experience</span></div>}
                        {c.degree_type && <div className="ac-li-fact"><FiBook size={11} /><span>{c.degree_type}{c.field_of_study ? ` · ${c.field_of_study}` : ""}</span></div>}
                        {c.institution && <div className="ac-li-fact"><FiGlobe size={11} /><span>{c.institution}</span></div>}
                        {c.current_lpa && <div className="ac-li-fact"><FiAward size={11} /><span>₹{c.current_lpa} LPA</span></div>}
                        {c.notice_period && <div className="ac-li-fact"><FiActivity size={11} /><span>Notice: {c.notice_period}</span></div>}
                    </div>

                    {skills.length > 0 && (
                        <>
                            <div className="ac-li-divider" />
                            <p className="ac-li-skills-label">Technical Skills</p>
                            <div className="ac-li-skills">
                                {skills.map((s, i) => <span key={i} className="ac-li-skill">{s}</span>)}
                            </div>
                        </>
                    )}

                    {c.soft_skills && (
                        <>
                            <div className="ac-li-divider" />
                            <p className="ac-li-skills-label">Soft Skills</p>
                            <p className="ac-li-soft">{c.soft_skills}</p>
                        </>
                    )}
                </div>

                {/* Right column */}
                <div className="ac-li-right">
                    {/* Score card */}
                    <div className="ac-li-score-card" style={{ background: "#ffffff" }}>
                        <p className="ac-li-score-label">LinkedIn Score</p>
                        <div className="ac-li-score-num" style={{ color: score >= 50 ? "#22c55e" : "#ef4444" }}>{score}</div>
                        <div className="ac-li-score-bar-track">
                            <div className="ac-li-score-bar-fill" style={{ width: `${score}%`, background: score >= 50 ? "#22c55e" : "#ef4444" }} />
                        </div>
                        <p className="ac-li-score-note">Manual review recommended</p>
                    </div>

                    {/* AI reasoning */}
                    {reasoning && (
                        <div className="ac-li-reasoning">
                            <p className="ac-li-reasoning-label"><span className="ac-ai-badge">AI</span> Analysis</p>
                            <p className="ac-li-reasoning-text">{reasoning}</p>
                        </div>
                    )}

                    {/* Network estimate */}
                    <div className="ac-li-network-card">
                        <SectionHeader title="Estimated Network Growth" sub="Illustrative — not scraped" />
                        <ResponsiveContainer width="100%" height={130}>
                            <AreaChart
                                data={[320, 340, 370, 390, 420, 450, 480, 510, 540, 560, 580, 600].map((v, i) => ({ m: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i], v }))}
                                margin={{ top: 4, right: 10, left: -30, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="liGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={ORANGE} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="2 4" stroke="#111" />
                                <XAxis dataKey="m" tick={{ fill: "#555", fontSize: 9 }} />
                                <YAxis tick={{ fill: "#555", fontSize: 9 }} />
                                <Tooltip content={<Tip />} />
                                <Area type="monotone" dataKey="v" name="Connections" stroke={ORANGE} fill="url(#liGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}









