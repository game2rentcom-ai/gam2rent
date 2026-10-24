import { Link } from "react-router-dom";
import { SkillForgeLogo } from "./LearnPage";

// Shared shell used by all /learn/* sub-pages
function LearnShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg-base font-sans text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-base/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/learn">
            <SkillForgeLogo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-text-muted sm:flex">
            <Link to="/learn#courses" className="transition-colors hover:text-text-primary">Courses</Link>
            <Link to="/learn/about" className="transition-colors hover:text-text-primary">About</Link>
            <Link to="/learn/contact" className="transition-colors hover:text-text-primary">Contact</Link>
          </nav>
          <Link to="/learn" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-400">
            Browse courses
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
        <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">{title}</h1>
        <div className="mt-8 space-y-5 text-sm leading-relaxed text-text-muted">{children}</div>
      </main>
      <LearnFooter />
    </div>
  );
}

export function LearnFooter() {
  return (
    <footer className="border-t border-border-subtle bg-bg-surface px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <SkillForgeLogo />
            <p className="max-w-xs text-xs leading-relaxed text-text-muted">
              Professional online courses built by practitioners. Learn a new skill, earn a certificate, advance your career.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
            <Link to="/learn" className="font-semibold text-text-muted transition-colors hover:text-text-primary">Courses</Link>
            <Link to="/learn/about" className="font-semibold text-text-muted transition-colors hover:text-text-primary">About</Link>
            <Link to="/learn/contact" className="font-semibold text-text-muted transition-colors hover:text-text-primary">Contact</Link>
            <Link to="/learn/privacy" className="font-semibold text-text-muted transition-colors hover:text-text-primary">Privacy policy</Link>
            <Link to="/learn/terms" className="font-semibold text-text-muted transition-colors hover:text-text-primary">Terms of use</Link>
            <Link to="/learn/refund" className="font-semibold text-text-muted transition-colors hover:text-text-primary">Refund policy</Link>
          </div>
        </div>
        <div className="mt-8 border-t border-border-subtle pt-6 text-xs text-text-muted">
          © {new Date().getFullYear()} SkillForge. All rights reserved. · India
        </div>
      </div>
    </footer>
  );
}

export function LearnAboutPage() {
  return (
    <LearnShell title="About SkillForge">
      <p className="text-base font-semibold text-text-primary">
        SkillForge is an online learning platform built to help professionals in India grow their careers through structured, practical courses.
      </p>
      <p>
        We started SkillForge with a simple belief: the best learning happens when instructors have actually done the work. Every course on our platform is created and taught by practitioners — people who have worked at leading companies, built businesses, and faced the real challenges our learners face.
      </p>
      <p>
        Our courses are designed to be focused and actionable. Each one comes with video lessons, downloadable resources, and a verified certificate of completion. You learn at your own pace, and lifetime access means you can revisit the material whenever you need it.
      </p>
      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">What we offer</h2>
      <ul className="list-inside list-disc space-y-2">
        <li>Courses across business, technology, design, finance, and communication</li>
        <li>Instructor-led video content with real-world examples</li>
        <li>Downloadable workbooks and templates</li>
        <li>Verified completion certificates</li>
        <li>Lifetime access on any device</li>
      </ul>
      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Our mission</h2>
      <p>
        To make high-quality professional education accessible to every working professional in India — without the cost, commute, or rigid schedule of a traditional classroom.
      </p>
      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Contact us</h2>
      <p>
        Questions about a course or your account? Reach us at{" "}
        <a href="mailto:support@skillforge.in" className="font-semibold text-brand-300 hover:underline">support@skillforge.in</a>{" "}
        — we respond within one business day.
      </p>
    </LearnShell>
  );
}

export function LearnPrivacyPage() {
  return (
    <LearnShell title="Privacy Policy">
      <p>Last updated: October 2024</p>
      <p>
        SkillForge ("we", "us", "our") is committed to protecting your privacy. This policy explains what personal data we collect, how we use it, and the choices you have.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Information we collect</h2>
      <p>When you create an account or purchase a course, we collect:</p>
      <ul className="list-inside list-disc space-y-1">
        <li>Your name and email address</li>
        <li>Payment information (processed securely by our payment provider — we do not store card details)</li>
        <li>Course progress and completion records</li>
        <li>Device and browser information for technical troubleshooting</li>
      </ul>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">How we use your information</h2>
      <ul className="list-inside list-disc space-y-1">
        <li>To provide access to courses you have purchased</li>
        <li>To issue your completion certificate</li>
        <li>To send transactional emails (purchase confirmation, certificate, password reset)</li>
        <li>To improve our courses and platform based on aggregated usage data</li>
      </ul>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Marketing communications</h2>
      <p>
        We may send you emails about new courses and offers. You can unsubscribe at any time via the link in any email we send.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Third-party services</h2>
      <p>
        We use trusted third-party services for payments (Razorpay), video hosting, and analytics. These providers have their own privacy policies and are contractually obligated to protect your data.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Data retention and deletion</h2>
      <p>
        We retain your account data for as long as your account is active. To delete your account and data, email{" "}
        <a href="mailto:support@skillforge.in" className="font-semibold text-brand-300 hover:underline">support@skillforge.in</a>.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Contact</h2>
      <p>
        For any privacy-related questions, contact us at{" "}
        <a href="mailto:support@skillforge.in" className="font-semibold text-brand-300 hover:underline">support@skillforge.in</a>.
      </p>
    </LearnShell>
  );
}

export function LearnTermsPage() {
  return (
    <LearnShell title="Terms of Use">
      <p>Last updated: October 2024</p>
      <p>
        By accessing or purchasing from SkillForge, you agree to these terms. Please read them carefully.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Use of the platform</h2>
      <p>
        You must be at least 18 years old to purchase a course. You may use SkillForge for personal, non-commercial learning only. You may not share your account or distribute course materials.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Course access</h2>
      <p>
        Once purchased, you have lifetime access to that course on your account. We reserve the right to update or improve course content at any time.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Intellectual property</h2>
      <p>
        All course content — videos, workbooks, templates, and assessments — is owned by SkillForge or its instructors. You may not copy, redistribute, or resell any course content without written permission.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Certificates</h2>
      <p>
        Completion certificates are issued when you finish all lessons in a course. Certificates are non-transferable and issued to the purchaser only.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Limitation of liability</h2>
      <p>
        SkillForge provides educational content for informational purposes. We make no guarantee of specific career or financial outcomes from completing our courses.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Governing law</h2>
      <p>
        These terms are governed by the laws of India. Disputes are subject to the jurisdiction of courts in India.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Contact</h2>
      <p>
        Questions about these terms? Write to{" "}
        <a href="mailto:support@skillforge.in" className="font-semibold text-brand-300 hover:underline">support@skillforge.in</a>.
      </p>
    </LearnShell>
  );
}

export function LearnRefundPage() {
  return (
    <LearnShell title="Refund Policy">
      <p>Last updated: October 2024</p>
      <p>
        We want you to be confident when you invest in a SkillForge course. If a course is not what you expected, we offer a straightforward refund policy.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">7-day money-back guarantee</h2>
      <p>
        If you are not satisfied with a course, you may request a full refund within 7 days of purchase — provided you have completed no more than 30% of the course content.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">How to request a refund</h2>
      <ol className="list-inside list-decimal space-y-2">
        <li>Email us at <a href="mailto:support@skillforge.in" className="font-semibold text-brand-300 hover:underline">support@skillforge.in</a> within 7 days of purchase</li>
        <li>Include your order number and the reason for your request</li>
        <li>We will review and respond within 2 business days</li>
        <li>Approved refunds are processed within 5–7 business days to your original payment method</li>
      </ol>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Exceptions</h2>
      <ul className="list-inside list-disc space-y-1">
        <li>Requests made after 7 days of purchase are not eligible</li>
        <li>Courses where more than 30% of content has been accessed are not eligible</li>
        <li>Certificates already issued are non-refundable</li>
        <li>Bundle purchases: refunds apply only to the individual course, not the full bundle</li>
      </ul>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Contact</h2>
      <p>
        For refund queries, contact{" "}
        <a href="mailto:support@skillforge.in" className="font-semibold text-brand-300 hover:underline">support@skillforge.in</a>.
      </p>
    </LearnShell>
  );
}

export function LearnContactPage() {
  return (
    <LearnShell title="Contact Us">
      <p className="text-base font-semibold text-text-primary">
        We're here to help. Whether it's a question about a course, a technical issue, or anything else — reach out and we'll get back to you within one business day.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-5">
          <p className="font-display text-sm font-bold text-text-primary">General enquiries</p>
          <a href="mailto:hello@skillforge.in" className="mt-1 block text-sm font-semibold text-brand-300 hover:underline">hello@skillforge.in</a>
        </div>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-5">
          <p className="font-display text-sm font-bold text-text-primary">Course support</p>
          <a href="mailto:support@skillforge.in" className="mt-1 block text-sm font-semibold text-brand-300 hover:underline">support@skillforge.in</a>
        </div>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-5">
          <p className="font-display text-sm font-bold text-text-primary">Billing &amp; refunds</p>
          <a href="mailto:billing@skillforge.in" className="mt-1 block text-sm font-semibold text-brand-300 hover:underline">billing@skillforge.in</a>
        </div>
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-5">
          <p className="font-display text-sm font-bold text-text-primary">Business &amp; partnerships</p>
          <a href="mailto:partnerships@skillforge.in" className="mt-1 block text-sm font-semibold text-brand-300 hover:underline">partnerships@skillforge.in</a>
        </div>
      </div>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Location</h2>
      <p>
        SkillForge is operated from India. Our support team is available Monday–Friday, 10 AM–6 PM IST.
      </p>

      <h2 className="pt-4 font-display text-xl font-bold text-text-primary">Become an instructor</h2>
      <p>
        Are you a practitioner with expertise you'd like to share? We work with domain experts to develop and publish courses on SkillForge. Email us at{" "}
        <a href="mailto:instructors@skillforge.in" className="font-semibold text-brand-300 hover:underline">instructors@skillforge.in</a>{" "}
        with a short pitch about your course idea.
      </p>
    </LearnShell>
  );
}
