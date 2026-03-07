import { Link } from 'react-router-dom';
import heroSketch from '../assets/hero-sketch.png';
import { FileClusterIllustration, EmbeddingIllustration, QueryIllustration } from '../components/landing/SketchIllustration';
import '../styles/landing.css';

const steps = [
    {
        number: "01",
        title: "Drop your files",
        description: "Add any documents—PDFs, notes, reports. The system extracts and reads every word.",
        illustration: <QueryIllustration />,
        annotation: "PDF · DOCX · TXT",
    },
    {
        number: "02",
        title: "Meaning is mapped",
        description: "Each file is chunked, embedded into vectors, and clustered with semantically similar documents—automatically.",
        illustration: <EmbeddingIllustration />,
        annotation: "1536-dim vectors",
    },
    {
        number: "03",
        title: "Ask in plain English",
        description: "Query your entire library with natural language. Get precise answers drawn from the right files.",
        illustration: <FileClusterIllustration />,
        annotation: "cosine similarity",
    },
];

const features = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" strokeLinecap="round" />
            </svg>
        ),
        title: "Semantic Clustering",
        description: "Files group themselves by meaning, not by name or folder. Related ideas find each other.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
        ),
        title: "Natural Language Search",
        description: "Ask questions the way you think them. The AI retrieves relevant context across all your files.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        title: "Instant Processing",
        description: "Text extraction, chunking, and embedding happen the moment a file is added.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2a10 10 0 110 20A10 10 0 0112 2z" />
                <path d="M12 6v6l4 2" strokeLinecap="round" />
            </svg>
        ),
        title: "Zero Manual Sorting",
        description: "No folders to create, no tags to assign. Organization emerges from the content itself.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
        title: "React Interface",
        description: "A clean, fast UI for browsing clusters, exploring relationships, and querying your library.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        title: "Private by Design",
        description: "Your files and embeddings stay yours. No third-party indexing, no data leaving your system.",
    },
];

/* ── Hand-drawn SVG decorations ────────────────────────────────────────── */

/** Scattered dot field with loose connections */
const DotField = ({ className = "" }) => (
    <svg viewBox="0 0 200 120" fill="none" className={`absolute pointer-events-none ${className}`} aria-hidden="true">
        {[
            [20, 20], [55, 10], [90, 35], [130, 15], [170, 25],
            [10, 60], [40, 75], [80, 55], [115, 70], [150, 50], [185, 65],
            [25, 100], [65, 90], [105, 105], [145, 95], [180, 100],
        ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={1.5 + (i % 3)} fill="currentColor" opacity={0.08 + (i % 4) * 0.04} />
        ))}
        <path d="M20 20 Q38 8 55 10" stroke="currentColor" strokeWidth="0.8" opacity="0.1" fill="none" strokeLinecap="round" />
        <path d="M55 10 Q72 22 90 35" stroke="currentColor" strokeWidth="0.8" opacity="0.1" fill="none" strokeLinecap="round" />
        <path d="M90 35 Q85 46 80 55" stroke="currentColor" strokeWidth="0.8" opacity="0.1" fill="none" strokeLinecap="round" />
        <path d="M115 70 Q132 62 150 50" stroke="currentColor" strokeWidth="0.8" opacity="0.1" fill="none" strokeLinecap="round" />
    </svg>
);

/** Loose hand-drawn ring */
const LooseCircle = ({ className = "", style }) => (
    <svg viewBox="0 0 100 100" fill="none" className={`absolute pointer-events-none ${className}`} style={style} aria-hidden="true">
        <path d="M50 5 C80 3 97 25 96 50 C95 78 75 97 48 96 C22 95 3 75 4 48 C5 22 24 3 50 5 Z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.1" />
        <path d="M48 8 C76 6 94 28 93 52"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.06" strokeDasharray="4 6" />
    </svg>
);

/** Node-graph clusters illustration */
const NodeGraph = ({ className = "" }) => (
    <svg viewBox="0 0 120 80" fill="none" className={`absolute pointer-events-none ${className}`} aria-hidden="true">
        <circle cx="20" cy="40" r="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="60" cy="15" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="60" cy="65" r="6" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="100" cy="40" r="4.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M25 40 Q42 28 56 17" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.35" fill="none" strokeLinecap="round" />
        <path d="M25 42 Q42 54 56 63" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.35" fill="none" strokeLinecap="round" />
        <path d="M64 17 Q82 28 96 38" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.35" fill="none" strokeLinecap="round" />
        <path d="M64 63 Q82 52 96 42" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.35" fill="none" strokeLinecap="round" />
        <path d="M60 20 Q62 40 60 60" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 5" opacity="0.2" fill="none" />
    </svg>
);

/** Hand-drawn vector axes */
const VectorAxes = ({ className = "" }) => (
    <svg viewBox="0 0 90 70" fill="none" className={`absolute pointer-events-none ${className}`} aria-hidden="true">
        <path d="M15 55 Q45 54 75 55" stroke="currentColor" strokeWidth="1.2" opacity="0.15" strokeLinecap="round" fill="none" />
        <path d="M15 55 Q14 32 15 10" stroke="currentColor" strokeWidth="1.2" opacity="0.15" strokeLinecap="round" fill="none" />
        <path d="M15 55 Q30 44 45 35" stroke="currentColor" strokeWidth="1" opacity="0.1" strokeLinecap="round" strokeDasharray="3 3" fill="none" />
        <circle cx="55" cy="28" r="3.5" fill="currentColor" opacity="0.15" />
        <circle cx="38" cy="43" r="2.5" fill="currentColor" opacity="0.1" />
        <circle cx="65" cy="40" r="2" fill="currentColor" opacity="0.12" />
        <circle cx="28" cy="23" r="4" fill="currentColor" opacity="0.08" />
        <circle cx="50" cy="18" r="2.5" fill="currentColor" opacity="0.18" />
    </svg>
);

/** Curly bracket brace */
const Brace = ({ className = "" }) => (
    <svg viewBox="0 0 30 120" fill="none" className={`absolute pointer-events-none ${className}`} aria-hidden="true">
        <path d="M24 4 Q5 6 6 22 L7 52 Q6 60 2 60 Q6 61 7 68 L6 100 Q5 118 24 116"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.15" fill="none" />
    </svg>
);

/** Annotation with bracket and label */
const Annotation = ({ text, className = "" }) => (
    <div className={`absolute pointer-events-none flex items-center gap-1.5 ${className}`} aria-hidden="true">
        <svg viewBox="0 0 14 24" fill="none" className="w-3.5 h-5 shrink-0" stroke="currentColor" strokeWidth="1.8" opacity="0.3">
            <path d="M11 2 Q2 3 2 12 Q2 21 11 22" strokeLinecap="round" fill="none" />
        </svg>
        <span className="annotation-badge">{text}</span>
    </div>
);

/** Arrow with label */
const ArrowLabel = ({ label, className = "" }) => (
    <div className={`absolute pointer-events-none flex flex-col items-center gap-1 ${className}`} aria-hidden="true">
        <span className="annotation-badge" style={{ fontSize: '0.75rem' }}>{label}</span>
        <svg viewBox="0 0 20 30" fill="none" className="w-5 h-7" stroke="currentColor" strokeWidth="1.8" opacity="0.25">
            <path d="M10 2 Q11 15 10 24" strokeLinecap="round" fill="none" />
            <path d="M5 19 L10 27 L15 19" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    </div>
);

/** Hand-drawn wavy divider */
const WavyDivider = () => (
    <div className="max-w-5xl mx-auto px-6">
        <svg viewBox="0 0 800 30" fill="none" className="w-full" style={{ height: '30px' }}>
            <path d="M0 15 Q40 5 80 15 Q120 25 160 15 Q200 5 240 15 Q280 25 320 15 Q360 5 400 15 Q440 25 480 15 Q520 5 560 15 Q600 25 640 15 Q680 5 720 15 Q760 25 800 15"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.1" fill="none" />
            {/* second offset line for hand-drawn feel */}
            <path d="M0 16 Q45 8 85 16 Q125 24 165 14 Q205 6 245 16 Q285 24 325 14 Q365 6 405 16 Q445 24 485 14 Q525 6 565 16 Q605 24 645 14 Q685 6 725 16 Q765 24 800 14"
                stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.06" fill="none" />
        </svg>
    </div>
);

/* ── Main Landing Page ─────────────────────────────────────────────────── */

export default function LandingPage() {
    return (
        <div className="landing-page min-h-screen overflow-x-hidden">
            {/* Nav */}
            <nav className="sketch-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
                            <path d="M4 4h6l2 2h6v12H4V4z" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="13" r="2.5" />
                            <path d="M9.5 16 L6 20M14.5 16 L18 20" strokeLinecap="round" opacity="0.4" />
                        </svg>
                        <span className="font-display text-xl" style={{ fontFamily: "'Caveat', cursive", fontWeight: 700 }}>FileMind</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-handwritten" style={{ color: 'hsl(220 9% 46%)', fontSize: '1rem' }}>
                        <a href="#how-it-works" className="hover:opacity-70 transition-opacity">How it works</a>
                        <a href="#features" className="hover:opacity-70 transition-opacity">Features</a>
                    </div>
                    <Link to="/dashboard" className="sketch-button" style={{ padding: '8px 20px', fontSize: '1rem' }}>
                        Get early access →
                    </Link>
                </div>
            </nav>

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section className="relative pt-24 pb-20 px-6 max-w-5xl mx-auto">
                {/* Background decorations */}
                <DotField className="top-8 right-0 w-72 h-44 opacity-80 float-anim-slow" />
                <LooseCircle className="w-52 h-52 -top-6 -left-20 opacity-60" style={{ color: 'hsl(42 80% 55%)' }} />
                <NodeGraph className="w-36 h-24 bottom-12 left-0 opacity-50 float-anim" />
                <VectorAxes className="w-32 h-24 bottom-28 right-8" />
                <Annotation text="vector space" className="top-40 right-4 md:right-56 hidden md:flex" />

                <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 text-sm mb-10 annotation-badge" style={{ transform: 'rotate(-1deg)' }}>
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'hsl(142 72% 50%)' }}></span>
                            AI-powered · semantic · zero folders
                        </div>

                        {/* Headline */}
                        <h1 className="font-display mb-8" style={{ fontSize: '4.5rem', lineHeight: 1.05 }}>
                            Files that{" "}
                            <span className="sketch-underline italic">understand</span>{" "}
                            themselves.
                        </h1>

                        <p className="text-lg leading-relaxed mb-12 max-w-md" style={{ color: 'hsl(220 9% 46%)', fontFamily: "'Architects Daughter', sans-serif" }}>
                            Drop your documents and walk away. FileMind reads every word, maps
                            meaning into vectors, and clusters related files — automatically.
                            Then ask anything in plain English.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <a id="get-started" href="#how-it-works" className="sketch-button">
                                See how it works
                                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </a>
                            <a href="#features" className="sketch-button-outline">
                                Explore features
                            </a>
                        </div>
                    </div>

                    {/* Hero illustration */}
                    <div className="relative float-anim-slow">
                        <ArrowLabel label="embeddings" className="-top-12 right-14 hidden md:flex" />
                        <div className="relative" style={{ overflow: 'visible' }}>
                            <img
                                src={heroSketch}
                                alt="Files clustering by semantic meaning"
                                className="w-full object-contain"
                                style={{ transform: 'scale(1.4)', transformOrigin: 'center center' }}
                            />
                        </div>
                        {/* Floating stat badge */}
                        <div className="absolute -bottom-5 -left-5 annotation-badge" style={{ padding: '6px 14px', transform: 'rotate(1deg)', boxShadow: '3px 3px 0 hsl(30 10% 75% / 0.2)' }}>
                            <span style={{ fontWeight: 700, color: 'hsl(220 15% 10%)' }}>6 clusters</span> · 142 files · 0 folders
                        </div>
                        <Brace className="w-7 h-24 -right-7 top-8 hidden lg:block" />
                    </div>
                </div>
            </section>

            {/* Divider */}
            <WavyDivider />

            {/* ── How it works ──────────────────────────────────────────────── */}
            <section id="how-it-works" className="relative py-28 px-6 max-w-5xl mx-auto">
                <LooseCircle className="w-72 h-72 -right-24 top-24 opacity-40" style={{ color: 'hsl(42 80% 55%)' }} />
                <DotField className="w-60 h-40 left-0 bottom-16 opacity-50" />
                <NodeGraph className="w-44 h-32 right-8 bottom-36 opacity-40 float-anim" />
                <Brace className="w-9 h-36 left-2 top-72 hidden lg:block" />

                <div className="mb-20 relative">
                    <p className="font-handwritten text-lg uppercase tracking-widest mb-3" style={{ color: 'hsl(220 9% 46%)', fontFamily: "'Caveat', cursive" }}>Process</p>
                    <h2 className="font-display text-5xl">Three steps,<br />infinite clarity.</h2>
                    <Annotation text="auto-organized" className="right-0 top-5 hidden lg:flex" />
                </div>

                <div className="space-y-24 relative z-10">
                    {steps.map((step, i) => (
                        <div key={i} className="relative">
                            {/* Hand-drawn connector arrow between steps */}
                            {i < steps.length - 1 && (
                                <div className="absolute -bottom-18 left-14 hidden md:block" style={{ bottom: '-56px' }}>
                                    <div className="sketch-arrow-down"></div>
                                </div>
                            )}

                            <div className={`grid md:grid-cols-2 gap-14 items-center ${i % 2 === 1 ? "md:[&>:first-child]:order-2" : ""}`}>
                                <div className="relative">
                                    <span className="step-number block mb-5">{step.number}</span>
                                    <h3 className="font-display text-3xl mb-4">{step.title}</h3>
                                    <p className="leading-relaxed text-lg" style={{ color: 'hsl(220 9% 46%)', fontFamily: "'Architects Daughter', sans-serif" }}>{step.description}</p>
                                    <Annotation text={step.annotation} className="-right-2 top-14 hidden lg:flex" />
                                </div>
                                <div className="sketch-box p-6 h-48 flex items-center justify-center relative sketch-grid" style={{ color: 'hsl(220 15% 10% / 0.5)' }}>
                                    {step.illustration}
                                    {i === 1 && <VectorAxes className="w-18 h-14 bottom-2 right-2" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Divider */}
            <WavyDivider />

            {/* ── Features ──────────────────────────────────────────────────── */}
            <section id="features" className="relative py-28 px-6 overflow-hidden sketch-section-alt">
                <LooseCircle className="w-80 h-80 -top-12 -right-20 opacity-25" />
                <DotField className="w-80 h-44 left-0 bottom-0 opacity-30" />
                <NodeGraph className="w-48 h-32 right-4 bottom-28 opacity-25 float-anim-slow" />

                {/* Big faint brace */}
                <svg viewBox="0 0 30 300" fill="none" className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-60 pointer-events-none hidden lg:block" aria-hidden="true">
                    <path d="M24 4 Q5 6 6 52 L7 140 Q6 150 2 150 Q6 151 7 158 L6 248 Q5 298 24 296"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.08" fill="none" />
                </svg>

                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="mb-20 relative">
                        <p className="font-handwritten text-lg uppercase tracking-widest mb-3" style={{ color: 'hsl(220 9% 46%)', fontFamily: "'Caveat', cursive" }}>Features</p>
                        <h2 className="font-display text-5xl max-w-sm">Built for how knowledge actually works.</h2>
                        <VectorAxes className="w-28 h-20 top-0 right-0 hidden md:block" />
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
                        {features.map((f, i) => (
                            <div key={i} className="relative sketch-card p-7">
                                <div className="feature-icon mb-5">
                                    {f.icon}
                                </div>
                                <h4 className="font-display text-xl font-semibold mb-3">{f.title}</h4>
                                <p className="text-sm leading-relaxed" style={{ color: 'hsl(220 9% 46%)', fontFamily: "'Architects Daughter', sans-serif" }}>{f.description}</p>
                                {/* Mini node decoration on some cards */}
                                {i % 3 === 0 && (
                                    <svg viewBox="0 0 40 30" fill="none" className="absolute bottom-3 right-3 w-10 h-7 opacity-8" aria-hidden="true" style={{ opacity: 0.08 }}>
                                        <circle cx="8" cy="15" r="3.5" fill="currentColor" />
                                        <circle cx="22" cy="7" r="3" fill="currentColor" />
                                        <circle cx="34" cy="21" r="3.5" fill="currentColor" />
                                        <path d="M11 14 Q16 10 19 8" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                                        <path d="M25 9 Q29 14 31 19" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                                    </svg>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Divider */}
            <WavyDivider />

            {/* ── CTA ───────────────────────────────────────────────────────── */}
            <section className="relative py-36 px-6 overflow-hidden">
                <LooseCircle className="w-60 h-60 -left-20 top-10 opacity-40 float-anim" style={{ color: 'hsl(42 80% 55%)' }} />
                <LooseCircle className="w-44 h-44 -right-12 bottom-16 opacity-25 float-anim-slow" />
                <DotField className="w-72 h-36 left-0 bottom-0 opacity-40" />
                <DotField className="w-72 h-36 right-0 top-10 opacity-40" />
                <NodeGraph className="w-40 h-28 left-10 top-28 opacity-30" />
                <NodeGraph className="w-40 h-28 right-10 bottom-24 opacity-30" />

                <div className="max-w-2xl mx-auto text-center relative z-10">
                    {/* Decorative sketch swoosh */}
                    <svg viewBox="0 0 200 40" fill="none" className="w-40 mx-auto mb-10 opacity-15">
                        <path d="M10 25 Q50 5 100 20 Q150 35 190 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                        <circle cx="100" cy="20" r="3.5" fill="currentColor" />
                        <circle cx="40" cy="18" r="2" fill="currentColor" opacity="0.5" />
                        <circle cx="160" cy="22" r="2" fill="currentColor" opacity="0.5" />
                    </svg>

                    <h2 className="font-display text-5xl md:text-6xl mb-8 leading-tight">
                        Stop filing.<br />Start{" "}
                        <span className="sketch-underline italic">finding.</span>
                    </h2>
                    <p className="leading-relaxed mb-12 max-w-md mx-auto text-lg" style={{ color: 'hsl(220 9% 46%)', fontFamily: "'Architects Daughter', sans-serif" }}>
                        FileMind is in active development. Get early access and experience the future of semantic file organization.
                    </p>
                    <Link to="/dashboard" className="sketch-button" style={{ fontSize: '1.2rem', padding: '14px 36px' }}>
                        Get Early Access
                        <svg viewBox="0 0 16 16" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                    <p className="text-sm mt-6 font-handwritten" style={{ color: 'hsl(220 9% 46%)', fontFamily: "'Caveat', cursive", fontSize: '1rem' }}>Free during the development phase ✨</p>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '2px solid hsl(30 10% 85%)' }} className="py-10 px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4" style={{ color: 'hsl(220 9% 46%)', fontFamily: "'Caveat', cursive", fontSize: '1rem' }}>
                    <div className="flex items-center gap-2.5">
                        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
                            <path d="M4 4h5l2 2h5v10H4V4z" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="10" cy="11" r="2" />
                        </svg>
                        FileMind · AI-powered semantic file system
                    </div>
                    <span>Built with embeddings, clustering & React ✏️</span>
                </div>
            </footer>
        </div>
    );
}
