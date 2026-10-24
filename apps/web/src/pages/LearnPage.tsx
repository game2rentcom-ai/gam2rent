import { Link } from "react-router-dom";
import { LearnFooter } from "./LearnInfoPages";

const COURSES = [
  {
    id: 1,
    title: "Digital Business Communication",
    tag: "Communication",
    level: "Beginner",
    hours: "10 hrs",
    enrolled: "3.2k",
    price: 1999,
    rating: 4.9,
    by: "Neha Sharma",
    color: "from-brand-600 to-brand-800",
    accent: "text-brand-300",
  },
  {
    id: 2,
    title: "Product Management Masterclass",
    tag: "Strategy",
    level: "Intermediate",
    hours: "14 hrs",
    enrolled: "2.1k",
    price: 2999,
    rating: 4.8,
    by: "Rohan Verma",
    color: "from-violet-700 to-violet-900",
    accent: "text-violet-300",
  },
  {
    id: 3,
    title: "Growth Marketing & Analytics",
    tag: "Marketing",
    level: "Advanced",
    hours: "18 hrs",
    enrolled: "1.7k",
    price: 3499,
    rating: 4.7,
    by: "Priya Nair",
    color: "from-gold-600 to-amber-900",
    accent: "text-gold-300",
  },
];

const FEATURES = [
  {
    icon: "🎯",
    title: "Expert-led curriculum",
    body: "Every course is built and delivered by practitioners with real-world experience in their field.",
  },
  {
    icon: "📱",
    title: "Learn on any device",
    body: "Access video lessons, workbooks, and live sessions from your phone, tablet, or desktop.",
  },
  {
    icon: "🏅",
    title: "Verified certificate",
    body: "Earn a shareable certificate on completion, recognised by leading employers and institutions.",
  },
];

const REVIEWS = [
  {
    name: "Ayesha Khan",
    role: "Marketing Manager",
    body: "The Product Management course completely changed how I approach roadmap planning. Practical, structured, and actually useful on day one.",
    stars: 5,
  },
  {
    name: "Karan Malhotra",
    role: "Startup Founder",
    body: "Communication masterclass helped me close two investor meetings I'd been stuck on for months. Worth every rupee.",
    stars: 5,
  },
];

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} out of 5 stars`} className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`h-3.5 w-3.5 ${i < n ? "text-gold-400" : "text-white/20"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function formatPrice(p: number) {
  return `₹${p.toLocaleString("en-IN")}`;
}

export function LearnPage() {
  return (
    <div className="min-h-dvh bg-bg-base font-sans text-text-primary selection:bg-brand-500 selection:text-white">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-base/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Game2Rent" className="h-8 w-auto" />
            <span className="hidden font-display text-sm font-bold tracking-wide text-text-muted sm:block">Learn</span>
          </div>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-text-muted sm:flex">
            <a href="#courses" className="hover:text-text-primary">Courses</a>
            <a href="#why" className="hover:text-text-primary">Why us</a>
            <Link to="/learn/about" className="hover:text-text-primary">About</Link>
            <Link to="/learn/contact" className="hover:text-text-primary">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm font-semibold text-text-muted hover:text-text-primary">← Store</Link>
            <a href="#courses" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-400 transition-colors">Enrol now</a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 py-20 text-center sm:px-8 sm:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_srgb,var(--color-brand-500)_30%,transparent),transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl">
          <span className="mb-4 inline-block rounded-full border border-brand-500/40 bg-brand-500/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-brand-300">Masterclass series</span>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.08] text-text-primary sm:text-5xl lg:text-6xl">
            Master new skills.<br />
            <span style={{ background: "linear-gradient(in oklch 105deg, var(--color-brand-300), var(--color-gold-400))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Grow your career.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-text-muted sm:text-lg">
            Structured courses taught by industry experts. Learn at your own pace — with live sessions, workbooks, and a certificate on completion.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#courses" className="rounded-xl bg-brand-500 px-7 py-3 font-bold text-white shadow-[0_0_24px_-4px_var(--color-brand-500)] hover:bg-brand-400 transition-colors">Browse courses</a>
            <a href="#why" className="rounded-xl border border-border-strong bg-bg-surface px-7 py-3 font-bold text-text-primary hover:border-brand-500 transition-colors">Learn more</a>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-text-muted">
            {[["7,000+", "Students enrolled"], ["15+", "Expert instructors"], ["4.8 ★", "Average rating"]].map(([val, lbl]) => (
              <div key={lbl} className="flex flex-col items-center gap-0.5">
                <span className="font-display text-xl font-bold text-text-primary">{val}</span>
                <span className="text-xs">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses ── */}
      <section id="courses" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-accent-300">Featured</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-text-primary sm:text-3xl">Top courses right now</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((c) => (
            <div key={c.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
              <div className={`flex h-36 items-end bg-gradient-to-br p-4 ${c.color}`}>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${c.accent}`}>{c.tag}</span>
                  <p className="mt-0.5 font-display text-lg font-bold leading-tight text-white">{c.title}</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="rounded-md border border-border-subtle px-2 py-0.5 font-semibold">{c.level}</span>
                  <span>{c.hours}</span>
                  <span>· {c.enrolled} enrolled</span>
                </div>
                <p className="text-xs text-text-muted">by {c.by}</p>
                <div className="mt-auto flex items-center justify-between">
                  <Stars n={c.rating} />
                  <span className="font-display text-base font-bold text-text-primary">{formatPrice(c.price)}</span>
                </div>
                <button className="mt-1 w-full rounded-lg bg-bg-base py-2 text-sm font-bold text-text-primary transition-colors hover:bg-brand-500 hover:text-white border border-border-subtle hover:border-brand-500">
                  Enrol in this course
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why us ── */}
      <section id="why" className="border-t border-border-subtle bg-bg-surface px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-300">Why ProLearn</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-text-primary sm:text-3xl">Built for real outcomes</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-bg-base p-6">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="font-display text-base font-bold text-text-primary">{f.title}</h3>
                <p className="text-sm leading-relaxed text-text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section id="reviews" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-accent-300">Student voices</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-text-primary sm:text-3xl">What our learners say</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {REVIEWS.map((r) => (
            <div key={r.name} className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-bg-surface p-6">
              <Stars n={r.stars} />
              <p className="flex-1 text-sm leading-relaxed text-text-muted">"{r.body}"</p>
              <div>
                <p className="text-sm font-bold text-text-primary">{r.name}</p>
                <p className="text-xs text-text-muted">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border-subtle px-5 py-16 text-center sm:px-8">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display text-3xl font-bold text-text-primary">Ready to start learning?</h2>
          <p className="mt-3 text-sm text-text-muted">Join thousands of professionals who've already levelled up with our courses.</p>
          <a href="#courses" className="mt-6 inline-block rounded-xl bg-brand-500 px-8 py-3.5 font-bold text-white shadow-[0_0_24px_-4px_var(--color-brand-500)] hover:bg-brand-400 transition-colors">
            Get started today
          </a>
        </div>
      </section>

      <LearnFooter />

    </div>
  );
}
