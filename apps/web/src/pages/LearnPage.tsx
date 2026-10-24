import { Link } from "react-router-dom";
import { LearnFooter } from "./LearnInfoPages";

export function SkillForgeLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <polygon points="17,2 30,9.5 30,24.5 17,32 4,24.5 4,9.5" fill="none" stroke="var(--color-brand-400)" strokeWidth="1.5" opacity="0.6" />
        <polygon points="17,6 26,11.5 26,22.5 17,28 8,22.5 8,11.5" fill="var(--color-brand-500)" opacity="0.18" />
        <path d="M19.5 10l-7 9.5H17l-2.5 6.5 8-10H18z" fill="var(--color-brand-300)" />
      </svg>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, fontSize: "1.2rem" }}>
        <span style={{ background: "linear-gradient(in oklch 90deg, var(--color-brand-300), var(--color-gold-400))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Skill</span>
        <span style={{ color: "var(--color-text-primary)" }}>Forge</span>
      </span>
    </div>
  );
}

function Stars({ n, count }: { n: number; count?: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="flex gap-0.5" aria-label={`${n} stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className={`h-3 w-3 ${i < Math.floor(n) ? "text-gold-400" : i < n ? "text-gold-400 opacity-50" : "text-white/20"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
      <span className="text-xs font-semibold text-gold-400">{n.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-text-muted">({count.toLocaleString()})</span>}
    </span>
  );
}

function formatPrice(p: number) {
  return `₹${p.toLocaleString("en-IN")}`;
}

const COURSES = [
  {
    id: 1,
    title: "Digital Business Communication",
    description: "Write clearly, speak with impact, and influence decisions at every level. Covers email, reports, presentations, and difficult conversations.",
    tag: "Communication",
    level: "Beginner",
    hours: "10 hrs",
    lessons: 24,
    enrolled: "3.2k",
    price: 1999,
    was: 3999,
    rating: 4.9,
    reviews: 342,
    by: "Neha Sharma",
    byTitle: "Corporate Communication Coach",
    from: "#1e3a8a",
    to: "#2563eb",
    icon: "💬",
  },
  {
    id: 2,
    title: "Product Management Masterclass",
    description: "Go from idea to launch. Learn roadmapping, user research, prioritisation frameworks, and stakeholder management used at top tech companies.",
    tag: "Product",
    level: "Intermediate",
    hours: "14 hrs",
    lessons: 32,
    enrolled: "2.1k",
    price: 2999,
    was: 5499,
    rating: 4.8,
    reviews: 218,
    by: "Rohan Verma",
    byTitle: "Senior Product Manager, ex-Flipkart",
    from: "#4c1d95",
    to: "#7c3aed",
    icon: "🗺️",
  },
  {
    id: 3,
    title: "Growth Marketing & Analytics",
    description: "Drive measurable growth through performance marketing, SEO, content strategy, and data-driven decision-making using Google Analytics and Meta Ads.",
    tag: "Marketing",
    level: "Intermediate",
    hours: "18 hrs",
    lessons: 40,
    enrolled: "1.7k",
    price: 2499,
    was: 4999,
    rating: 4.7,
    reviews: 179,
    by: "Priya Nair",
    byTitle: "Growth Lead, D2C Brands",
    from: "#92400e",
    to: "#d97706",
    icon: "📈",
  },
  {
    id: 4,
    title: "Data Science with Python",
    description: "From raw data to actionable insight. Covers Python, pandas, data visualisation, machine learning basics, and real-world case studies.",
    tag: "Technology",
    level: "Beginner–Intermediate",
    hours: "22 hrs",
    lessons: 48,
    enrolled: "4.1k",
    price: 3499,
    was: 6999,
    rating: 4.9,
    reviews: 511,
    by: "Arjun Mehta",
    byTitle: "Data Scientist, ex-Amazon",
    from: "#064e3b",
    to: "#059669",
    icon: "🔬",
  },
  {
    id: 5,
    title: "UI/UX Design Fundamentals",
    description: "Design products people love. Learn user research, wireframing, prototyping in Figma, and usability testing principles applied to real projects.",
    tag: "Design",
    level: "Beginner",
    hours: "16 hrs",
    lessons: 36,
    enrolled: "2.8k",
    price: 2799,
    was: 5499,
    rating: 4.8,
    reviews: 293,
    by: "Kavya Reddy",
    byTitle: "UX Designer, ex-Razorpay",
    from: "#831843",
    to: "#db2777",
    icon: "🎨",
  },
  {
    id: 6,
    title: "Leadership & Team Management",
    description: "Lead with clarity and confidence. Covers team motivation, feedback frameworks, conflict resolution, and building a high-performance culture.",
    tag: "Leadership",
    level: "Advanced",
    hours: "12 hrs",
    lessons: 28,
    enrolled: "1.3k",
    price: 3299,
    was: 5999,
    rating: 4.7,
    reviews: 147,
    by: "Sameer Kapoor",
    byTitle: "Executive Coach & Ex-COO",
    from: "#1e3a5f",
    to: "#1e4976",
    icon: "🏆",
  },
  {
    id: 7,
    title: "Financial Planning for Professionals",
    description: "Take control of your money. Mutual funds, tax planning, insurance, retirement, and building a personal investment strategy that actually works.",
    tag: "Finance",
    level: "Beginner",
    hours: "8 hrs",
    lessons: 20,
    enrolled: "5.0k",
    price: 1499,
    was: 2999,
    rating: 4.9,
    reviews: 628,
    by: "Ananya Singh",
    byTitle: "SEBI-Registered Investment Advisor",
    from: "#14532d",
    to: "#16a34a",
    icon: "💰",
  },
  {
    id: 8,
    title: "Public Speaking & Presentation",
    description: "Turn nerves into confidence. Structured storytelling, slide design, voice modulation, and live practice sessions with expert feedback.",
    tag: "Communication",
    level: "All levels",
    hours: "9 hrs",
    lessons: 22,
    enrolled: "2.4k",
    price: 1799,
    was: 3499,
    rating: 4.8,
    reviews: 264,
    by: "Vikram Joshi",
    byTitle: "TED Speaker & Corporate Trainer",
    from: "#7c2d12",
    to: "#c2410c",
    icon: "🎤",
  },
];

const FEATURES = [
  {
    icon: (
      <svg className="h-7 w-7 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Practitioner-led learning",
    body: "Every course is built by people who have done the job — not just taught it. Expect real examples, honest trade-offs, and skills you use from day one.",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Learn at your own pace",
    body: "Lifetime access to all course materials on any device. Start and stop whenever suits you — your progress is always saved.",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: "Verified certificate",
    body: "Earn a shareable certificate on completion, backed by SkillForge. Recognised by hiring managers and useful for your LinkedIn and portfolio.",
  },
];

const REVIEWS = [
  {
    name: "Ayesha Khan",
    role: "Marketing Manager, Bangalore",
    body: "The Product Management course completely changed how I approach roadmap planning. The frameworks are practical and I started using them in my job the very next week.",
    stars: 5,
    course: "Product Management Masterclass",
  },
  {
    name: "Karan Malhotra",
    role: "Startup Founder, Mumbai",
    body: "Business Communication course helped me close two investor meetings I'd been stuck on for months. The email templates and pitch frameworks are genuinely worth 10x the price.",
    stars: 5,
    course: "Digital Business Communication",
  },
  {
    name: "Divya Patel",
    role: "Software Engineer, Pune",
    body: "I went from knowing nothing about investing to setting up my own SIP and term insurance plan. Ananya explains finance like a friend, not a textbook.",
    stars: 5,
    course: "Financial Planning for Professionals",
  },
];

export function LearnPage() {
  return (
    <div className="min-h-dvh bg-bg-base font-sans text-text-primary selection:bg-brand-500 selection:text-white">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-base/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <SkillForgeLogo />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-text-muted sm:flex">
            <a href="#courses" className="transition-colors hover:text-text-primary">Courses</a>
            <a href="#why" className="transition-colors hover:text-text-primary">Why us</a>
            <Link to="/learn/about" className="transition-colors hover:text-text-primary">About</Link>
            <Link to="/learn/contact" className="transition-colors hover:text-text-primary">Contact</Link>
          </nav>
          <a href="#courses" className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_-4px_var(--color-brand-500)] transition-colors hover:bg-brand-400">
            Enrol now
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 py-20 text-center sm:px-8 sm:py-28">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-5%,color-mix(in_srgb,var(--color-brand-500)_25%,transparent),transparent_70%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_80%_20%,color-mix(in_srgb,var(--color-gold-500)_12%,transparent),transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl">
          <span className="mb-5 inline-block rounded-full border border-brand-500/40 bg-brand-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-300">
            Online Masterclass Platform
          </span>
          <h1 className="mt-2 font-display text-4xl font-bold leading-[1.06] text-text-primary sm:text-5xl lg:text-6xl">
            Build skills that<br />
            <span style={{ background: "linear-gradient(in oklch 105deg, var(--color-brand-300) 0%, var(--color-gold-400) 50%, var(--color-brand-300) 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "gradient-flow 5s ease-in-out infinite" }}>
              move your career forward.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            Structured video courses taught by industry practitioners. Learn at your own pace — with workbooks, live Q&amp;A, and a verified certificate on completion.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#courses" className="rounded-xl bg-brand-500 px-8 py-3.5 font-bold text-white shadow-[0_0_28px_-4px_var(--color-brand-500)] transition-colors hover:bg-brand-400">
              Browse courses
            </a>
            <Link to="/learn/about" className="rounded-xl border border-border-strong bg-bg-surface px-8 py-3.5 font-bold text-text-primary transition-colors hover:border-brand-500/60">
              About SkillForge
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-x-10 gap-y-5">
            {[["10,000+", "Students enrolled"], ["8", "Expert courses"], ["4.8 ★", "Average rating"], ["96%", "Completion rate"]].map(([val, lbl]) => (
              <div key={lbl} className="flex flex-col items-center gap-1">
                <span className="font-display text-2xl font-bold text-text-primary">{val}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses ── */}
      <section id="courses" className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-300">Curriculum</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-text-primary sm:text-3xl">All courses</h2>
            <p className="mt-1 text-sm text-text-muted">Pick a course. Start today. Each one comes with lifetime access and a certificate.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {COURSES.map((c) => (
              <div key={c.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.65)]">
                {/* Cover */}
                <div
                  className="relative flex h-40 flex-col items-start justify-between p-4"
                  style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                >
                  <div className="flex w-full items-start justify-between">
                    <span className="rounded-md border border-white/20 bg-black/30 px-2 py-0.5 text-xs font-bold text-white/90 backdrop-blur-sm">{c.tag}</span>
                    <span className="text-3xl" aria-hidden>{c.icon}</span>
                  </div>
                  <div>
                    <p className="font-display text-base font-bold leading-snug text-white drop-shadow">{c.title}</p>
                    <p className="mt-0.5 text-xs text-white/75">by {c.by}</p>
                  </div>
                </div>
                {/* Body */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <p className="text-xs leading-relaxed text-text-muted line-clamp-3">{c.description}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                    <span className="rounded border border-border-subtle px-1.5 py-0.5 font-semibold">{c.level}</span>
                    <span>{c.hours}</span>
                    <span>{c.lessons} lessons</span>
                  </div>
                  <Stars n={c.rating} count={c.reviews} />
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-base font-bold text-text-primary">{formatPrice(c.price)}</span>
                      <span className="text-xs text-text-muted line-through">{formatPrice(c.was)}</span>
                    </div>
                    <span className="rounded bg-trust-100 px-1.5 py-0.5 text-xs font-bold text-trust-600">
                      {Math.round((1 - c.price / c.was) * 100)}% off
                    </span>
                  </div>
                  <button className="w-full rounded-lg border border-border-subtle bg-bg-base py-2 text-sm font-bold text-text-primary transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white">
                    Enrol — {formatPrice(c.price)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section id="why" className="border-y border-border-subtle bg-bg-surface px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-300">Why SkillForge</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-text-primary sm:text-3xl">Built for real outcomes</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">We don't just deliver content — we build skills that show up at work the next day.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-bg-base p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-strong bg-bg-surface">
                  {f.icon}
                </div>
                <h3 className="font-display text-base font-bold text-text-primary">{f.title}</h3>
                <p className="text-sm leading-relaxed text-text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-300">Student voices</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-text-primary sm:text-3xl">What our learners say</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {REVIEWS.map((r) => (
              <div key={r.name} className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-bg-surface p-6">
                <Stars n={r.stars} />
                <p className="flex-1 text-sm leading-relaxed text-text-muted">"{r.body}"</p>
                <div className="border-t border-border-subtle pt-3">
                  <p className="text-sm font-bold text-text-primary">{r.name}</p>
                  <p className="text-xs text-text-muted">{r.role}</p>
                  <p className="mt-1 text-xs font-semibold text-brand-300">{r.course}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-brand-500/30" style={{ background: "radial-gradient(ellipse 80% 80% at 50% 120%, color-mix(in srgb, var(--color-brand-500) 25%, transparent), var(--color-bg-surface))" }}>
          <div className="p-10 text-center">
            <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">Start learning today.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted">
              Join over 10,000 professionals who've used SkillForge to level up their careers — one course at a time.
            </p>
            <a href="#courses" className="mt-6 inline-block rounded-xl bg-brand-500 px-9 py-3.5 font-bold text-white shadow-[0_0_28px_-4px_var(--color-brand-500)] transition-colors hover:bg-brand-400">
              Browse all courses
            </a>
          </div>
        </div>
      </section>

      <LearnFooter />
    </div>
  );
}
