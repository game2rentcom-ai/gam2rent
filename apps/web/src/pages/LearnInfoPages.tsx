import { Link } from "react-router-dom";

// Shared shell for all /learn/* info pages
function LearnShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg-base font-sans text-text-primary selection:bg-brand-500 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-base/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/learn" className="flex items-center gap-3">
            <img src="/logo.png" alt="Game2Rent" className="h-8 w-auto" />
            <span className="hidden font-display text-sm font-bold tracking-wide text-text-muted sm:block">Learn</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-text-muted sm:flex">
            <Link to="/learn/about" className="hover:text-text-primary">About</Link>
            <Link to="/learn" className="hover:text-text-primary">Courses</Link>
            <Link to="/learn/contact" className="hover:text-text-primary">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm font-semibold text-text-muted hover:text-text-primary">← Store</Link>
            <Link to="/learn" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-400 transition-colors">Courses</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="mb-8 font-display text-3xl font-bold text-text-primary sm:text-4xl">{title}</h1>
        <div className="prose-learn">{children}</div>
      </main>

      <LearnFooter />
    </div>
  );
}

export function LearnFooter() {
  return (
    <footer className="border-t border-border-subtle bg-bg-surface px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="ProLearn" className="h-8 w-auto" />
              <span className="font-display text-sm font-bold text-text-muted">Learn</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-text-muted">
              Professional masterclasses and online courses operated by Game2Rent. India's growing platform for accessible professional education.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-text-muted">Platform</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/learn" className="text-text-muted hover:text-text-primary">Home</Link></li>
              <li><Link to="/learn/about" className="text-text-muted hover:text-text-primary">About us</Link></li>
              <li><Link to="/learn/contact" className="text-text-muted hover:text-text-primary">Contact</Link></li>
              <li><Link to="/" className="text-text-muted hover:text-text-primary">Game2Rent Store</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-text-muted">Legal</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/learn/privacy" className="text-text-muted hover:text-text-primary">Privacy Policy</Link></li>
              <li><Link to="/learn/terms" className="text-text-muted hover:text-text-primary">Terms of Service</Link></li>
              <li><Link to="/learn/refund" className="text-text-muted hover:text-text-primary">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-6 text-xs text-text-muted">
          <span>© {new Date().getFullYear()} ProLearn by Game2Rent. All rights reserved.</span>
          <span>Made in India 🇮🇳</span>
        </div>
      </div>
    </footer>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-8 font-display text-xl font-bold text-text-primary first:mt-0">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-sm leading-relaxed text-text-muted">{children}</p>;
}
function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 ml-4 list-disc space-y-1 text-sm text-text-muted">{children}</ul>;
}

// ── About ────────────────────────────────────────────────────────────────────
export function LearnAboutPage() {
  return (
    <LearnShell title="About ProLearn">
      <H2>Who we are</H2>
      <P>
        ProLearn is an online education platform operated by Game2Rent, a digital commerce business registered in India. We offer structured video-based masterclasses and professional development courses designed to help working professionals and students build career-relevant skills — at their own pace and at prices accessible to the Indian market.
      </P>

      <H2>Our mission</H2>
      <P>
        We believe quality education should not be gated by geography or cost. Our mission is to bridge the gap between academic learning and real-world professional skills by delivering courses taught by practitioners — people who have built, led, and shipped in their respective fields.
      </P>

      <H2>What we offer</H2>
      <Ul>
        <li>Self-paced video courses with downloadable workbooks</li>
        <li>Live masterclass sessions with Q&amp;A</li>
        <li>Verified digital certificates on course completion</li>
        <li>Community access for peer learning and mentorship</li>
        <li>Courses across business communication, product management, marketing, and more</li>
      </Ul>

      <H2>Our instructors</H2>
      <P>
        Every instructor on ProLearn is selected based on demonstrated real-world experience — not just academic credentials. We work with product managers, founders, marketers, and domain specialists who bring practical knowledge into every module.
      </P>

      <H2>Business details</H2>
      <P>
        ProLearn is operated by Game2Rent. For queries related to the platform, billing, or course access, please reach us at{" "}
        <a href="mailto:support@game2rent.in" className="text-brand-300 hover:underline">support@game2rent.in</a>.
      </P>

      <H2>Contact us</H2>
      <P>
        For partnership enquiries, instructor applications, or institutional licensing, write to us at{" "}
        <a href="mailto:support@game2rent.in" className="text-brand-300 hover:underline">support@game2rent.in</a>.
        We typically respond within one business day.
      </P>
    </LearnShell>
  );
}

// ── Privacy Policy ───────────────────────────────────────────────────────────
export function LearnPrivacyPage() {
  return (
    <LearnShell title="Privacy Policy">
      <P>Last updated: October 2024</P>
      <P>
        ProLearn ("we", "us", or "our"), operated by Game2Rent, is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding it. By using our platform at game2rent.vercel.app/learn (and related URLs), you agree to this policy.
      </P>

      <H2>1. Information we collect</H2>
      <Ul>
        <li><strong className="text-text-primary">Account information:</strong> Name, email address, and password when you register.</li>
        <li><strong className="text-text-primary">Payment information:</strong> Transactions are processed by Razorpay. We do not store your card, UPI, or net-banking details. Razorpay may collect and store payment details per their own privacy policy.</li>
        <li><strong className="text-text-primary">Usage data:</strong> Pages visited, courses accessed, progress, and time spent — used to improve the platform and personalise your experience.</li>
        <li><strong className="text-text-primary">Communications:</strong> Emails or messages you send to our support team.</li>
        <li><strong className="text-text-primary">Technical data:</strong> IP address, browser type, device identifiers, and cookies for security and performance.</li>
      </Ul>

      <H2>2. How we use your information</H2>
      <Ul>
        <li>To create and manage your account and course access</li>
        <li>To process payments and issue invoices</li>
        <li>To send course updates, receipts, and support replies</li>
        <li>To improve platform performance and user experience</li>
        <li>To comply with legal obligations under Indian law</li>
      </Ul>

      <H2>3. Sharing of information</H2>
      <P>
        We do not sell or rent your personal data. We share information only with:
      </P>
      <Ul>
        <li><strong className="text-text-primary">Razorpay</strong> for payment processing (PCI-DSS certified)</li>
        <li><strong className="text-text-primary">Supabase</strong> for secure data storage (SOC 2 compliant)</li>
        <li>Authorities when required by law or court order</li>
      </Ul>

      <H2>4. Cookies</H2>
      <P>
        We use essential cookies to keep you logged in and remember your preferences. We do not use third-party advertising cookies. You can disable cookies in your browser settings, though this may affect platform functionality.
      </P>

      <H2>5. Data retention</H2>
      <P>
        We retain your account data for as long as your account is active or as required for legal compliance. You may request deletion of your account and personal data by writing to us.
      </P>

      <H2>6. Your rights</H2>
      <Ul>
        <li>Access the personal data we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your account and data</li>
        <li>Withdraw consent for marketing communications at any time</li>
      </Ul>

      <H2>7. Data security</H2>
      <P>
        We use industry-standard encryption (TLS/HTTPS) for all data in transit and store data on secured, access-controlled servers. Passwords are hashed and never stored in plain text.
      </P>

      <H2>8. Changes to this policy</H2>
      <P>
        We may update this Privacy Policy from time to time. We will notify registered users of material changes via email. Continued use of the platform after changes constitutes acceptance.
      </P>

      <H2>9. Contact</H2>
      <P>
        For privacy-related queries or to exercise your rights, write to:{" "}
        <a href="mailto:support@game2rent.in" className="text-brand-300 hover:underline">support@game2rent.in</a>
      </P>
    </LearnShell>
  );
}

// ── Terms of Service ──────────────────────────────────────────────────────────
export function LearnTermsPage() {
  return (
    <LearnShell title="Terms of Service">
      <P>Last updated: October 2024</P>
      <P>
        These Terms of Service ("Terms") govern your use of ProLearn, operated by Game2Rent ("we", "us"). By accessing or purchasing a course, you agree to these Terms. Please read them carefully.
      </P>

      <H2>1. Eligibility</H2>
      <P>
        You must be at least 18 years old (or have parental consent if between 13–17) to use this platform. By registering, you confirm you meet this requirement.
      </P>

      <H2>2. Account registration</H2>
      <P>
        You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Do not share your account with others. Notify us immediately at support@game2rent.in if you suspect unauthorised access.
      </P>

      <H2>3. Course access and licence</H2>
      <Ul>
        <li>Upon purchase, you receive a personal, non-transferable licence to access the course content.</li>
        <li>Access is for personal, non-commercial use only.</li>
        <li>You may not share, resell, redistribute, or reproduce course materials.</li>
        <li>We reserve the right to update course content at any time to keep it accurate and relevant.</li>
      </Ul>

      <H2>4. Payment</H2>
      <Ul>
        <li>All prices are listed in Indian Rupees (INR) and include applicable taxes.</li>
        <li>Payments are processed securely through Razorpay.</li>
        <li>Your purchase grants lifetime access to the course unless otherwise stated.</li>
        <li>We reserve the right to change pricing. Changes do not affect already-purchased courses.</li>
      </Ul>

      <H2>5. Refunds</H2>
      <P>
        Please refer to our{" "}
        <Link to="/learn/refund" className="text-brand-300 hover:underline">Refund Policy</Link>
        {" "}for full details on eligibility and process.
      </P>

      <H2>6. Prohibited conduct</H2>
      <P>You agree not to:</P>
      <Ul>
        <li>Reproduce, distribute, or publicly display course content without written permission</li>
        <li>Use automated tools to scrape, download, or copy platform content</li>
        <li>Attempt to gain unauthorised access to other users' accounts or our systems</li>
        <li>Post false, misleading, or defamatory reviews</li>
        <li>Use the platform for any unlawful purpose</li>
      </Ul>

      <H2>7. Intellectual property</H2>
      <P>
        All course content, videos, workbooks, branding, and platform code are owned by Game2Rent or its licensors and protected by Indian and international copyright law. Nothing in these Terms transfers ownership to you.
      </P>

      <H2>8. Disclaimers</H2>
      <P>
        Courses are provided for educational purposes. We make no guarantees about career outcomes, salary changes, or employment resulting from course completion. Course content represents the instructors' views and experience.
      </P>

      <H2>9. Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, Game2Rent shall not be liable for indirect, incidental, or consequential damages arising from use of the platform. Our total liability for any claim is limited to the amount you paid for the relevant course.
      </P>

      <H2>10. Governing law</H2>
      <P>
        These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India.
      </P>

      <H2>11. Changes to Terms</H2>
      <P>
        We may revise these Terms. We will notify you by email of material changes. Continued use of the platform after the effective date of changes constitutes your acceptance.
      </P>

      <H2>12. Contact</H2>
      <P>
        Questions about these Terms?{" "}
        <a href="mailto:support@game2rent.in" className="text-brand-300 hover:underline">support@game2rent.in</a>
      </P>
    </LearnShell>
  );
}

// ── Refund Policy ─────────────────────────────────────────────────────────────
export function LearnRefundPage() {
  return (
    <LearnShell title="Refund & Cancellation Policy">
      <P>Last updated: October 2024</P>
      <P>
        We want you to be satisfied with your purchase. This policy explains when and how you can request a refund for ProLearn courses.
      </P>

      <H2>1. Refund eligibility</H2>
      <P>You are eligible for a full refund if:</P>
      <Ul>
        <li>You request the refund within <strong className="text-text-primary">7 days</strong> of your purchase date, and</li>
        <li>You have completed <strong className="text-text-primary">less than 20%</strong> of the course content</li>
      </Ul>
      <P>Refunds are not available if:</P>
      <Ul>
        <li>More than 7 days have passed since purchase</li>
        <li>You have completed 20% or more of the course</li>
        <li>The course was purchased under a promotional or discounted offer where refunds were explicitly excluded</li>
        <li>You have downloaded or accessed any offline materials or workbooks</li>
      </Ul>

      <H2>2. How to request a refund</H2>
      <P>
        Email us at{" "}
        <a href="mailto:support@game2rent.in" className="text-brand-300 hover:underline">support@game2rent.in</a>
        {" "}with:
      </P>
      <Ul>
        <li>Your registered email address</li>
        <li>The name of the course</li>
        <li>Your order or payment ID</li>
        <li>A brief reason for the refund request</li>
      </Ul>

      <H2>3. Processing time</H2>
      <P>
        Once your refund request is approved, the amount will be credited to your original payment method within <strong className="text-text-primary">5–7 business days</strong>. Actual credit timing may vary depending on your bank or payment provider.
      </P>

      <H2>4. Cancellations</H2>
      <P>
        You may cancel your account at any time by writing to us. Course access purchased before cancellation remains available until it expires or until a refund (if eligible) is processed.
      </P>

      <H2>5. Technical issues</H2>
      <P>
        If you are unable to access a course due to a technical problem on our end, we will either resolve the issue or issue a full refund regardless of how much of the course you have completed.
      </P>

      <H2>6. Contact</H2>
      <P>
        For refund queries:{" "}
        <a href="mailto:support@game2rent.in" className="text-brand-300 hover:underline">support@game2rent.in</a>
        <br />Support hours: Monday – Saturday, 10:00 AM – 7:00 PM IST
      </P>
    </LearnShell>
  );
}

// ── Contact ──────────────────────────────────────────────────────────────────
export function LearnContactPage() {
  return (
    <LearnShell title="Contact Us">
      <P>
        We're here to help. Whether it's a question about a course, a billing issue, or a technical problem — reach out and we'll get back to you.
      </P>

      <H2>Email support</H2>
      <P>
        The fastest way to reach us:{" "}
        <a href="mailto:support@game2rent.in" className="text-brand-300 hover:underline font-semibold">support@game2rent.in</a>
        <br />We respond within <strong className="text-text-primary">24 hours</strong> on business days.
      </P>

      <H2>Support hours</H2>
      <Ul>
        <li>Monday – Saturday: 10:00 AM – 7:00 PM IST</li>
        <li>Sunday and public holidays: limited availability</li>
      </Ul>

      <H2>What to include in your message</H2>
      <P>To help us resolve your query faster, please share:</P>
      <Ul>
        <li>Your registered email address</li>
        <li>The course name or order ID (if relevant)</li>
        <li>A clear description of your issue or question</li>
        <li>Any screenshots that help explain the problem</li>
      </Ul>

      <H2>Refund requests</H2>
      <P>
        For refund requests, please refer to our{" "}
        <Link to="/learn/refund" className="text-brand-300 hover:underline">Refund Policy</Link>
        {" "}and include your order ID and the reason for the request in your email.
      </P>

      <H2>Business & partnership enquiries</H2>
      <P>
        For instructor applications, corporate training, or partnership proposals, write to us at{" "}
        <a href="mailto:support@game2rent.in" className="text-brand-300 hover:underline">support@game2rent.in</a>
        {" "}with the subject line "Partnership Enquiry".
      </P>

      <H2>Operated by</H2>
      <P>
        ProLearn is a platform operated by <strong className="text-text-primary">Game2Rent</strong>, India.
      </P>

      <div className="mt-8 rounded-2xl border border-brand-500/30 bg-brand-500/5 p-6">
        <p className="text-sm font-bold text-text-primary">Quick contact</p>
        <a
          href="mailto:support@game2rent.in"
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-400 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email us at support@game2rent.in
        </a>
      </div>
    </LearnShell>
  );
}
