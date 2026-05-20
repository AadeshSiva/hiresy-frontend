import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './Background.css';

/* ─── SVG Icons ──────────────────────────────────────── */
const IconUpload = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);
const IconCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const IconCamera = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
    </svg>
);
const IconX = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const IconAlert = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);
const IconUser = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);
const IconShield = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);
const IconBook = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);
const IconBriefcase = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);
const IconFileText = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
);
const IconSmile = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
);
const IconUsers = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const IconChevronRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
const IconChevronLeft = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const IconRotateCcw = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
);
const IconLock = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

/* ─── Section Config ─────────────────────────────────── */
const SECTIONS = [
    { id: 'identity', label: 'Identity', icon: IconUser },
    { id: 'education', label: 'Education', icon: IconBook },
    { id: 'employment', label: 'Employment', icon: IconBriefcase },
    { id: 'criminal', label: 'Criminal', icon: IconShield },
    // { id: 'face', label: 'Face', icon: IconSmile },
    { id: 'references', label: 'References', icon: IconUsers },
];

// Accepted file types for all upload inputs
const ACCEPT = 'image/*,application/pdf,.pdf';

const Back = () => {
    const { token } = useParams();
    const [bgvData, setBgvData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTestMode, setIsTestMode] = useState(false);
    const [testToken, setTestToken] = useState(null);
    const [activeSection, setActiveSection] = useState('identity');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRefs = useRef({});
    const sectionRefs = useRef({});

    const [formData, setFormData] = useState({
        aadhaar_b64: null,
        pan_b64: null,
        passport_b64: null,
        degree_cert_b64: null,
        experience_letters_b64: [],
        criminal_affidavit_b64: null,
        selfie_b64: null,
        reference_contacts: []
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id.replace('section-', '');
                        setActiveSection(id);
                    }
                });
            },
            { rootMargin: '-20% 0px -60% 0px' }
        );
        SECTIONS.forEach(section => {
            const el = document.getElementById(`section-${section.id}`);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const isTest = !token || window.location.pathname === '/back-test';
        setIsTestMode(isTest);
        if (isTest) {
            const dummyToken = 'test-token-123';
            setTestToken(dummyToken);
            setBgvData({ candidate_name: 'Test Candidate', status: 'pending', submitted_at: null });
            setLoading(false);
        } else if (token) {
            fetchBGVData();
        }
    }, [token]);

    const fetchBGVData = async () => {
        try {
            const response = await fetch(`https://hiresy-bgv.onrender.com/bgv/${token}`);
            if (!response.ok) throw new Error('Failed to fetch BGV data');
            const data = await response.json();
            setBgvData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const convertToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

    const handleFileUpload = async (e, fieldName) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        if (fieldName === 'experience_letters_b64') {
            const base64Files = await Promise.all(files.map(convertToBase64));
            setFormData(prev => ({ ...prev, experience_letters_b64: [...prev.experience_letters_b64, ...base64Files] }));
        } else {
            const base64File = await convertToBase64(files[0]);
            setFormData(prev => ({ ...prev, [fieldName]: base64File }));
        }
    };

    const removeFile = (fieldName, index) => {
        if (fieldName === 'experience_letters_b64') {
            setFormData(prev => ({ ...prev, experience_letters_b64: prev.experience_letters_b64.filter((_, i) => i !== index) }));
        } else {
            setFormData(prev => ({ ...prev, [fieldName]: null }));
        }
    };

    const handleReferenceChange = (index, field, value) => {
        const updatedRefs = [...formData.reference_contacts];
        updatedRefs[index] = { ...updatedRefs[index], [field]: value };
        setFormData(prev => ({ ...prev, reference_contacts: updatedRefs }));
    };

    const addReference = () => {
        setFormData(prev => ({ ...prev, reference_contacts: [...prev.reference_contacts, { name: '', company: '', phone: '', email: '' }] }));
    };

    const removeReference = (index) => {
        setFormData(prev => ({ ...prev, reference_contacts: prev.reference_contacts.filter((_, i) => i !== index) }));
    };

    // No required fields — all documents are optional
    const validateForm = () => true;

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            const activeToken = isTestMode ? testToken : token;
            const response = await fetch(`https://hiresy-bgv.onrender.com/bgv/${activeToken}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                if (isTestMode) { console.log('Test mode: Documents submitted successfully'); setSubmitted(true); return; }
                throw new Error('Submission failed');
            }
            const result = await response.json();
            setSubmitted(true);
            console.log('Submission result:', result);
        } catch (error) {
            console.error('Error submitting documents:', error);
            if (!isTestMode) alert('Failed to submit documents. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setShowCamera(true);
        } catch (err) {
            alert('Could not access camera. Please use file upload instead.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
        setShowCamera(false);
        setCountdown(null);
    };

    const captureSelfie = useCallback(() => {
        setCountdown(3);
        let count = 3;
        const timer = setInterval(() => {
            count -= 1;
            if (count > 0) {
                setCountdown(count);
            } else {
                clearInterval(timer);
                setCountdown(null);
                if (videoRef.current) {
                    const canvas = document.createElement('canvas');
                    canvas.width = videoRef.current.videoWidth;
                    canvas.height = videoRef.current.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(videoRef.current, 0, 0);
                    const dataUrl = canvas.toDataURL('image/jpeg');
                    setFormData(prev => ({ ...prev, selfie_b64: dataUrl }));
                }
                stopCamera();
            }
        }, 1000);
    }, []);

    const getProgress = () => {
        let filled = 0;
        if (formData.aadhaar_b64) filled++;
        if (formData.degree_cert_b64) filled++;
        if (formData.criminal_affidavit_b64) filled++;
        if (formData.selfie_b64) filled++;
        if (formData.experience_letters_b64.length > 0) filled++;
        if (formData.reference_contacts.length > 0) filled++;
        return Math.round((filled / 6) * 100);
    };

    const getSectionStatus = (sectionId) => {
        switch (sectionId) {
            case 'identity': return formData.aadhaar_b64 ? 'done' : 'pending';
            case 'education': return formData.degree_cert_b64 ? 'done' : 'pending';
            case 'employment': return formData.experience_letters_b64.length > 0 ? 'done' : 'pending';
            case 'criminal': return formData.criminal_affidavit_b64 ? 'done' : 'pending';
            case 'face': return formData.selfie_b64 ? 'done' : 'pending';
            case 'references': return formData.reference_contacts.length > 0 ? 'done' : 'pending';
            default: return 'pending';
        }
    };

    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId);
        const el = document.getElementById(`section-${sectionId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const goToNextSection = () => {
        const idx = SECTIONS.findIndex(s => s.id === activeSection);
        if (idx < SECTIONS.length - 1) scrollToSection(SECTIONS[idx + 1].id);
    };

    const goToPrevSection = () => {
        const idx = SECTIONS.findIndex(s => s.id === activeSection);
        if (idx > 0) scrollToSection(SECTIONS[idx - 1].id);
    };

    /* ─── Upload Box ─────────────────────────────────── */
    const UploadBox = ({ label, hint, fieldName, multiple }) => {
        const isFilled = multiple ? formData[fieldName]?.length > 0 : !!formData[fieldName];
        const fileCount = multiple ? formData[fieldName]?.length || 0 : 0;
        return (
            <div className="upload-wrapper">
                <div className={`upload-box ${isFilled ? 'upload-box--filled' : ''}`} onClick={() => fileInputRefs.current[fieldName]?.click()}>
                    <div className="upload-icon-wrap">
                        {isFilled ? <IconCheck /> : <IconUpload />}
                    </div>
                    <span className="upload-label">{label}</span>
                    {isFilled && multiple && <span className="upload-count">{fileCount} file{fileCount > 1 ? 's' : ''}</span>}
                    <span className="upload-hint">{hint || 'Click to upload'}</span>
                </div>
                <input
                    ref={el => fileInputRefs.current[fieldName] = el}
                    type="file"
                    accept={ACCEPT}
                    multiple={multiple}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e, fieldName)}
                />
                {isFilled && (
                    <div className="file-tags">
                        {multiple
                            ? formData[fieldName].map((_, i) => (
                                <span key={i} className="file-tag">
                                    <IconFileText /> File {i + 1}
                                    <button className="file-tag-remove" onClick={() => removeFile(fieldName, i)}><IconX /></button>
                                </span>
                            ))
                            : (
                                <span className="file-tag">
                                    <IconFileText /> Uploaded
                                    <button className="file-tag-remove" onClick={() => removeFile(fieldName)}><IconX /></button>
                                </span>
                            )
                        }
                    </div>
                )}
            </div>
        );
    };

    /* ─── Shell states ───────────────────────────────── */
    const Shell = ({ children }) => (
        <div className="bgv-root">
            <header className="bgv-topbar">
                <div className="bgv-logo">
                    <img src="/icon.svg" alt="Hiresy" style={{ width: 20, height: 20 }} />
                    <span className="bgv-logo-name">Hiresy</span>
                </div>
            </header>
            {children}
        </div>
    );

    if (loading) return (
        <Shell>
            <div className="bgv-state-center">
                <div className="bgv-spinner" />
                <p className="bgv-state-text">Loading verification session…</p>
            </div>
        </Shell>
    );

    if (error) return (
        <Shell>
            <div className="bgv-state-center">
                <div className="bgv-state-badge bgv-state-badge--error">!</div>
                <p className="bgv-state-title">Something went wrong</p>
                <p className="bgv-state-text">{error}</p>
            </div>
        </Shell>
    );

    if (!bgvData) return (
        <Shell>
            <div className="bgv-state-center">
                <div className="bgv-state-badge bgv-state-badge--neutral">?</div>
                <p className="bgv-state-title">Session not found</p>
                <p className="bgv-state-text">This verification link may be invalid or expired.</p>
            </div>
        </Shell>
    );

    if (submitted) return (
        <Shell>
            <div className="bgv-state-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="23" stroke="#16a34a" strokeWidth="1.5" />
                    <path d="M15 25l6 6 12-12" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="bgv-state-title">Documents submitted</p>
                <p className="bgv-state-text">
                    Thank you, <strong>{bgvData.candidate_name}</strong>. Your documents are under review. We'll notify you once verification is complete.
                </p>
                <div className="success-tags">
                    {formData.aadhaar_b64 && <span className="success-tag">Aadhaar</span>}
                    {formData.degree_cert_b64 && <span className="success-tag">Degree</span>}
                    {formData.criminal_affidavit_b64 && <span className="success-tag">Affidavit</span>}
                    {formData.selfie_b64 && <span className="success-tag">Selfie</span>}
                    {formData.experience_letters_b64.length > 0 && <span className="success-tag">Experience</span>}
                    {formData.reference_contacts.length > 0 && <span className="success-tag">References</span>}
                </div>
            </div>
        </Shell>
    );

    /* ─── Main ───────────────────────────────────────── */
    return (
        <div className="bgv-root">
            {/* Topbar */}
            <header className="bgv-topbar">
                <div className="bgv-logo">
                    <img src="/icon.svg" alt="Hiresy" style={{ width: 20, height: 20 }} />
                    <span className="bgv-logo-name">Hiresy</span>
                </div>
                <div className="bgv-topbar-right">
                    <span className="bgv-candidate-chip">{bgvData.candidate_name}</span>
                </div>
            </header>

            <div className="bgv-layout">
                {/* Sidebar */}
                <nav className="bgv-sidebar">
                    <div className="bgv-sidebar-label">Sections</div>
                    {SECTIONS.map((section, i) => {
                        const status = getSectionStatus(section.id);
                        const isActive = activeSection === section.id;
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                className={`bgv-nav-btn ${isActive ? 'bgv-nav-btn--active' : ''} ${status === 'done' ? 'bgv-nav-btn--done' : ''}`}
                                onClick={() => scrollToSection(section.id)}
                            >
                                <span className="bgv-nav-step">{status === 'done' ? <IconCheck /> : String(i + 1).padStart(2, '0')}</span>
                                <span className="bgv-nav-icon"><Icon /></span>
                                <span className="bgv-nav-text">{section.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Content */}
                <main className="bgv-content">

                    {/* Identity */}
                    <section id="section-identity" className="bgv-card">
                        <div className="bgv-card-head">
                            <div className="bgv-card-icon"><IconUser /></div>
                            <div>
                                <h2 className="bgv-card-title">Identity verification</h2>
                                <p className="bgv-card-desc">Upload government-issued ID documents</p>
                            </div>
                        </div>
                        <div className="bgv-grid bgv-grid--3">
                            <UploadBox label="Aadhaar card" fieldName="aadhaar_b64" hint="Image or PDF" />
                            <UploadBox label="PAN card" fieldName="pan_b64" hint="Image or PDF" />
                            <UploadBox label="Passport" fieldName="passport_b64" hint="Image or PDF" />
                        </div>
                    </section>

                    {/* Education */}
                    <section id="section-education" className="bgv-card">
                        <div className="bgv-card-head">
                            <div className="bgv-card-icon"><IconBook /></div>
                            <div>
                                <h2 className="bgv-card-title">Education verification</h2>
                                <p className="bgv-card-desc">Upload your highest degree certificate</p>
                            </div>
                        </div>
                        <div className="bgv-grid bgv-grid--1">
                            <UploadBox label="Degree certificate" fieldName="degree_cert_b64" hint="Image or PDF" />
                        </div>
                    </section>

                    {/* Employment */}
                    <section id="section-employment" className="bgv-card">
                        <div className="bgv-card-head">
                            <div className="bgv-card-icon"><IconBriefcase /></div>
                            <div>
                                <h2 className="bgv-card-title">Employment verification</h2>
                                <p className="bgv-card-desc">Upload experience letters from previous employers</p>
                            </div>
                        </div>
                        <div className="bgv-grid bgv-grid--1">
                            <UploadBox label="Experience letters" fieldName="experience_letters_b64" multiple hint="Select multiple files — image or PDF" />
                        </div>
                    </section>

                    {/* Criminal */}
                    <section id="section-criminal" className="bgv-card">
                        <div className="bgv-card-head">
                            <div className="bgv-card-icon"><IconShield /></div>
                            <div>
                                <h2 className="bgv-card-title">Criminal record</h2>
                                <p className="bgv-card-desc">Self-declaration affidavit for background check</p>
                            </div>
                        </div>
                        <div className="bgv-grid bgv-grid--1">
                            <UploadBox label="Self-declaration affidavit" fieldName="criminal_affidavit_b64" hint="Image or PDF" />
                        </div>
                    </section>

                    {/* Face */}
                    <section id="section-face" className="bgv-card">
                        <div className="bgv-card-head">
                            <div className="bgv-card-icon"><IconSmile /></div>
                            <div>
                                <h2 className="bgv-card-title">Face verification</h2>
                                <p className="bgv-card-desc">Take a selfie holding your Aadhaar card next to your face</p>
                            </div>
                        </div>
                        <div className="bgv-face-area">
                            {!showCamera && !formData.selfie_b64 && (
                                <button className="bgv-cam-btn" onClick={startCamera}>
                                    <IconCamera /> Open camera
                                </button>
                            )}

                            {showCamera && (
                                <div className="bgv-cam-box">
                                    <p className="bgv-cam-hint">Position your face and Aadhaar card within the frame</p>
                                    <div className="bgv-video-frame">
                                        <video ref={videoRef} autoPlay playsInline muted className="bgv-video" />
                                        {countdown && <div className="bgv-countdown">{countdown}</div>}
                                    </div>
                                    <div className="bgv-cam-actions">
                                        <button className="bgv-btn-primary" onClick={captureSelfie} disabled={countdown !== null}>
                                            {countdown ? 'Capturing…' : 'Capture'}
                                        </button>
                                        <button className="bgv-btn-ghost" onClick={stopCamera}>Cancel</button>
                                    </div>
                                </div>
                            )}

                            {formData.selfie_b64 && !showCamera && (
                                <div className="bgv-selfie-result">
                                    <img src={formData.selfie_b64} alt="Selfie" className="bgv-selfie-img" />
                                    <button className="bgv-btn-ghost bgv-btn-ghost--sm" onClick={() => { setFormData(prev => ({ ...prev, selfie_b64: null })); startCamera(); }}>
                                        <IconRotateCcw /> Retake
                                    </button>
                                </div>
                            )}

                            {!showCamera && (
                                <div className="bgv-face-alt">
                                    <span className="bgv-face-alt-or">or</span>
                                    <button className="bgv-link-btn" onClick={() => fileInputRefs.current['selfie_b64']?.click()}>
                                        upload from device
                                    </button>
                                    <input
                                        ref={el => fileInputRefs.current['selfie_b64'] = el}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleFileUpload(e, 'selfie_b64')}
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* References */}
                    <section id="section-references" className="bgv-card">
                        <div className="bgv-card-head">
                            <div className="bgv-card-icon"><IconUsers /></div>
                            <div>
                                <h2 className="bgv-card-title">Professional references</h2>
                                <p className="bgv-card-desc">Add contacts who can vouch for your work experience</p>
                            </div>
                        </div>
                        <div className="bgv-refs">
                            {formData.reference_contacts.map((ref, idx) => (
                                <div key={idx} className="bgv-ref-card">
                                    <div className="bgv-ref-top">
                                        <span className="bgv-ref-label">Reference {idx + 1}</span>
                                        <button className="bgv-icon-btn" onClick={() => removeReference(idx)}><IconX /></button>
                                    </div>
                                    <div className="bgv-ref-grid">
                                        <input className="bgv-input" type="text" placeholder="Full name" value={ref.name} onChange={(e) => handleReferenceChange(idx, 'name', e.target.value)} />
                                        <input className="bgv-input" type="text" placeholder="Company" value={ref.company} onChange={(e) => handleReferenceChange(idx, 'company', e.target.value)} />
                                        <input className="bgv-input" type="tel" placeholder="Phone" value={ref.phone} onChange={(e) => handleReferenceChange(idx, 'phone', e.target.value)} />
                                        <input className="bgv-input" type="email" placeholder="Email" value={ref.email} onChange={(e) => handleReferenceChange(idx, 'email', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                            <button className="bgv-add-ref-btn" onClick={addReference}>+ Add reference</button>
                        </div>
                    </section>

                    {/* Privacy note */}
                    <div className="bgv-privacy-note">
                        <IconLock />
                        <span>All documents are encrypted and used solely for verification. They are permanently deleted 30 days after the process is complete.</span>
                    </div>

                    {/* Footer actions */}
                    <div className="bgv-footer-actions">
                        {activeSection !== 'identity' && (
                            <button className="bgv-btn-ghost" onClick={goToPrevSection}>
                                <IconChevronLeft /> Back
                            </button>
                        )}
                        <div style={{ flex: 1 }} />
                        {activeSection !== 'references' ? (
                            <button className="bgv-btn-primary" onClick={goToNextSection}>
                                Next <IconChevronRight />
                            </button>
                        ) : (
                            <button className="bgv-btn-submit" onClick={handleSubmit} disabled={submitting}>
                                {submitting
                                    ? <><span className="bgv-spinner-sm" /> Submitting…</>
                                    : 'Submit documents'
                                }
                            </button>
                        )}
                    </div>

                    <footer className="bgv-footer">
                        <p>&copy; {new Date().getFullYear()} Hiresy. Secure background verification.</p>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default Back;