// The store's legal pages, written for how the store actually works. Business details ({name}, {address},
// {email}, {phone}, {officer}, {gstin}) are filled in from Admin → Settings when a page is shown, so nothing
// here needs editing when they change. The numbers people are promised live in ONE place, just below.

export const POLICIES_UPDATED = "11 October 2026";

/** Business promises — change a value here and every page that mentions it changes with it. */
export const PROMISE = {
  minAge: 18,
  /** how long after delivery a purchase is covered by the replacement guarantee */
  replacementDays: 30,
  /** if an order is still undelivered this long after payment, the customer may cancel for a full refund */
  deliveryOuterHours: 24,
  /** we acknowledge a complaint or request within this long … */
  acknowledgeHours: 48,
  /** … and resolve it within this many days */
  resolveDays: 30,
  /** how long an unpaid order is held before it cancels itself */
  unpaidOrderMinutes: 60,
  /** Razorpay's usual time for a refund to reach the customer */
  refundDays: "5–7 working days",
  /** where the database and logins are hosted */
  dataRegion: "Japan (Tokyo)",
  /** years order and payment records are kept for tax and accounting */
  recordYears: 8,
  supportYears: 2,
};

/** A section: intro paragraphs, then a bulleted list, then closing paragraphs. */
export interface PolicyBlock { heading: string; paragraphs?: string[]; bullets?: string[]; closing?: string[] }
export interface Policy { title: string; summary: string; blocks: PolicyBlock[] }

const P = PROMISE;

const terms: Policy = {
  title: "Terms of Service",
  summary: "The rules for using this website and purchasing digital game access from us. By creating an account or placing an order you agree to them.",
  blocks: [
    {
      heading: "1. Who we are",
      paragraphs: [
        '{name} ("we", "us") is a registered digital goods reseller operating at the address on the Contact us page. We provide customers with access to digital games for PC and PlayStation platforms. Our GSTIN is {gstin}.',
        "We are an independent service provider and are not affiliated with, endorsed by or sponsored by Sony Interactive Entertainment, Valve Corporation, Epic Games or any other platform holder or game publisher. All game titles, logos and artwork belong to their respective rights holders and are referenced only to identify the products.",
      ],
    },
    {
      heading: "2. Our service — digital game access",
      paragraphs: [
        "We are a digital game access service. When you place an order, we provide you with the credentials (account ID and password) or a scan-to-play access code for a pre-configured game account that contains the game you purchased. This gives you the right to sign in, download the game from the official platform store, and play it for yourself.",
        "Each game page tells you, before you pay: the platform, whether you will receive account credentials or a scan-to-play code, the price (inclusive of all applicable taxes where shown), and the usual delivery time.",
        "Purchasing gives you access with no fixed end date, backed by our replacement guarantee for the period stated in the Refund & Replacement Policy. Renting gives you access for the number of hours or days shown in the chosen plan, counted from the moment we deliver.",
      ],
    },
    {
      heading: "3. Nature of digital access — important",
      paragraphs: [
        "Digital game access of this kind is delivered through pre-configured game accounts. The continued availability of the access depends on the underlying account remaining in good standing with the platform. In rare cases an account may become inaccessible due to circumstances outside our control.",
        "This is the primary service risk, and it is precisely why we provide a comprehensive replacement guarantee on every order. By ordering you acknowledge this and confirm that you have read the Refund & Replacement Policy.",
      ],
    },
    {
      heading: "4. Your account with us",
      bullets: [
        `You must be at least ${P.minAge} years old to place an order. A person under this age may use a game only on an order placed and supervised by a parent or guardian, who accepts full responsibility.`,
        "Provide accurate details at registration and checkout, especially a working WhatsApp number, which we use to communicate about your order.",
        "Keep your login credentials private. You are responsible for all activity that takes place through your account.",
        "One account per person. Do not create multiple accounts to circumvent limits, promotional codes, or a prior suspension.",
      ],
    },
    {
      heading: "5. Prices, taxes and payment",
      paragraphs: [
        "All prices are displayed in Indian Rupees (INR). Where Goods and Services Tax (GST) applies to our supply it is included in the price shown, or disclosed at checkout. Online payments are processed by Razorpay Payment Solutions Pvt. Ltd. under Razorpay's own PCI-DSS-compliant security standards — we never receive, see or store your card, UPI or net-banking details.",
        "An order is confirmed only once payment is successfully authorised. An order left unpaid cancels itself automatically after " + `${P.unpaidOrderMinutes}` + " minutes and no charge is made. Coupon codes are single-use per customer unless we state otherwise; they have no cash value and we may withdraw a code that is misused.",
        "If funds leave your account but your order does not appear as confirmed, please do not pay again. Contact us with the Razorpay payment reference and we will investigate and resolve it promptly.",
      ],
    },
    {
      heading: "6. Cancellation before delivery",
      paragraphs: [
        "You may cancel a paid, undelivered order at any time and receive a full refund. If your order remains undelivered " + `${P.deliveryOuterHours}` + " hours after payment, you are entitled to cancel it and receive a full refund — see the Refund & Replacement Policy for how to request this.",
        "Because the product is digital access that is delivered to your order page, you lose the right to cancel for a change of mind once the access credentials have been delivered to you. This is consistent with Section 8(3) of the Consumer Protection (E-Commerce) Rules, 2020 and Section 19 read with Schedule II of the Consumer Protection Act, 2019 for digital goods that are fully performed with the consumer's agreement.",
      ],
    },
    {
      heading: "7. Delivery",
      paragraphs: [
        "Delivery works as described in the Delivery Times page. Your access credentials appear on your order page once your order is fulfilled. For rentals, the credentials stop being visible on your order page when the rental period ends, at which point you must stop using the access.",
      ],
    },
    {
      heading: "8. Acceptable use of access credentials",
      bullets: [
        "Use the access only for your own personal, non-commercial gameplay. Do not transfer, resell, sublicense, share or publish the credentials.",
        "Do not alter any settings of the underlying account, including its email address, password, security questions, linked payment methods or personal details, unless we specifically instruct you to do so.",
        "Do not engage in cheating, hacking, or any conduct that violates the platform's Terms of Service or the game's own end-user licence agreement. A suspension or ban resulting from prohibited conduct is not covered by our replacement guarantee.",
        "For a rental, you must stop using the access when the rental period ends.",
      ],
    },
    {
      heading: "9. User-generated content (reviews, comments, requests)",
      paragraphs: [
        "Reviews may be submitted only by customers who have received a game, and are published with your first name. Comments and game requests are public and attributed to your first name; votes are anonymous.",
        "Content must be honest, respectful and lawful. Do not post anything abusive, defamatory, misleading, obscene or that infringes a third party's rights. We may remove non-compliant content and suspend repeat offenders.",
      ],
    },
    {
      heading: "10. Prohibited conduct",
      bullets: [
        "Using the site for any unlawful purpose, or to commit fraud against us or another customer.",
        "Attempting to circumvent our order, payment, coupon, rate-limiting or security systems, or to access data that does not belong to you.",
        "Initiating a payment dispute (chargeback) with your bank or card issuer for a delivered order without first giving us the opportunity to resolve the matter.",
      ],
    },
    {
      heading: "11. Our liability",
      paragraphs: [
        "We stand behind every order with our replacement guarantee, as set out in the Refund & Replacement Policy. Beyond that guarantee, and to the maximum extent permitted by applicable law, we are not liable for any indirect, consequential, incidental or special loss, for decisions made by a platform holder, or for any issue arising from your use of the access after it has been delivered to you.",
        "Our total liability for any single order is limited to the amount you paid for that order. Nothing in these terms limits or excludes any right you have under the Consumer Protection Act, 2019 or any other mandatory provision of Indian law.",
      ],
    },
    {
      heading: "12. Account suspension and termination",
      paragraphs: [
        "You may stop using the site at any time and request closure of your account. We may suspend or close an account and cancel any outstanding orders (with a refund of amounts paid) if these terms are materially breached or if we have reasonable grounds to suspect fraud or misuse.",
      ],
    },
    {
      heading: "13. Changes to these terms",
      paragraphs: [
        "We may update these terms from time to time. The date shown at the top of this page reflects the most recent revision. Your continued use of the site after a change constitutes acceptance of the revised terms. Orders already placed are governed by the terms in force at the time of the order.",
      ],
    },
    {
      heading: "14. Governing law and grievance redressal",
      paragraphs: [
        "These terms are governed by the laws of India. The courts at the location of our registered address (shown on the Contact us page) have jurisdiction, without prejudice to your right to approach any consumer forum or the National Consumer Disputes Redressal Commission.",
        "Grievance Officer: {officer}, reachable at {email}. We acknowledge complaints within " + `${P.acknowledgeHours}` + " hours and aim to resolve them within " + `${P.resolveDays}` + " days, in accordance with the Consumer Protection (E-Commerce) Rules, 2020.",
      ],
    },
  ],
};

const privacy: Policy = {
  title: "Privacy Policy",
  summary: "What personal information we collect, why we collect it, who processes it, how long we keep it, and the choices you have. We comply with India's Digital Personal Data Protection Act, 2023.",
  blocks: [
    {
      heading: "1. Data fiduciary",
      paragraphs: ["{name} (GSTIN: {gstin}) is the data fiduciary responsible for the personal data processed through this website. Contact details are on the Contact us page."],
    },
    {
      heading: "2. What we collect",
      bullets: [
        "Registration details: your name, email address, password (stored only in hashed form by our authentication provider), and WhatsApp number.",
        "Preferences: platforms you play on, game genres you enjoy, your wishlist, and cart contents.",
        "Transaction data: games purchased or rented, price paid, coupon codes used, order timestamps, delivery status, contact name and number at time of order, and the payment reference issued by Razorpay.",
        "Delivered access credentials: stored encrypted and visible only to you. Any access by our staff for support purposes is logged.",
        "Support communications: messages, ticket content, and resolution notes.",
        "Community content: reviews, comments, game requests, and votes you submit.",
        "Technical data: IP address, browser and device identifiers, and pages visited — retained in our hosting providers' infrastructure logs for security and diagnostics.",
      ],
      closing: ["We never receive, store or process your card number, UPI VPA, or banking credentials — those are handled entirely by Razorpay."],
    },
    {
      heading: "3. Purposes of processing",
      bullets: [
        "To fulfil your order: processing payment, preparing and delivering digital access, and issuing your receipt.",
        "Customer communication: updates on your order, support responses, and service notifications via email, in-app messages, or WhatsApp.",
        "Personalisation: recommending games based on your stated preferences, purchase history, and wishlist.",
        "Security and compliance: fraud prevention, abuse detection, and maintaining records required by applicable law (including the GST Act and accounting standards).",
        "Community: publishing your first name alongside any review, comment, or game request you choose to post.",
      ],
      closing: ["We rely on your consent (provided at registration and at checkout) and on our legitimate interest in operating a secure, lawful service. You may withdraw consent at any time (see Your rights), though doing so may prevent us from completing your orders."],
    },
    {
      heading: "4. Sub-processors and data recipients",
      bullets: [
        "Razorpay Payment Solutions Pvt. Ltd. — payment processing and refund execution.",
        "Supabase Inc. — database hosting, authentication, file storage, and backend functions. Data is stored in " + `${P.dataRegion}` + ", meaning your personal data is transferred to and processed outside India.",
        "Vercel Inc. — website hosting and CDN; retains standard access logs.",
        "Resend Inc. — transactional email delivery (order confirmations and notifications).",
        "Meta Platforms (WhatsApp) — messaging, when you or we initiate contact via WhatsApp.",
      ],
      closing: [
        "Each sub-processor uses your data solely to provide their service to us and is bound by data processing terms. We do not sell, rent or trade your personal data, and we do not share it for advertising or marketing by third parties.",
        "We may disclose data if required by a court order, statutory authority, or applicable law.",
      ],
    },
    {
      heading: "5. Cookies and browser storage",
      paragraphs: [
        "We store a sign-in token (a session cookie, strictly necessary for authentication) and a banner-dismissed flag (a sessionStorage entry). No advertising cookies, cross-site tracking pixels, or third-party analytics scripts are currently active on this site. If we introduce any optional tracking technology in future, we will update this policy and seek your consent in advance where the law requires.",
      ],
    },
    {
      heading: "6. Retention periods",
      bullets: [
        `Order and payment records: up to ${P.recordYears} years, to comply with GST, income-tax and accounting obligations.`,
        `Support conversations: up to ${P.supportYears} years after closure.`,
        "Account profile data: for as long as your account remains open and for the period needed to retain the transaction records above.",
        "Hosting infrastructure logs: as set by each provider's retention policy (typically 30–90 days).",
      ],
    },
    {
      heading: "7. Security measures",
      paragraphs: [
        "All data in transit is protected by TLS/HTTPS. Access credentials delivered to customers are stored at rest with encryption. Row-level security ensures each customer can access only their own data. The admin area is restricted to authorised personnel only. Payments are verified with Razorpay's API before an order is marked as paid. In the event of a personal data breach that poses a risk to your rights, we will notify you and the Data Protection Board of India in accordance with applicable law.",
      ],
    },
    {
      heading: "8. Your rights as a data principal",
      paragraphs: ["Under the Digital Personal Data Protection Act, 2023, you have the right to:"],
      bullets: [
        "Access: know what personal data we hold about you and how it is processed.",
        "Correction: update inaccurate or incomplete data (name and phone number can be changed on the Account page; other corrections can be requested by contacting us).",
        "Erasure: request deletion of your personal data — we will delete what we are not legally required to retain.",
        "Withdrawal of consent: withdraw consent to any processing based on consent.",
        "Grievance redressal: lodge a complaint with our Grievance Officer.",
        "Nomination: nominate another person to exercise these rights on your behalf.",
      ],
    },
    {
      heading: "9. Grievance redressal",
      paragraphs: [
        "Contact our Grievance Officer ({officer}) at {email} for any privacy-related concern. We acknowledge within " + `${P.acknowledgeHours}` + " hours and aim to resolve within " + `${P.resolveDays}` + " days. If you remain dissatisfied, you may escalate to the Data Protection Board of India once it is operational.",
      ],
    },
    {
      heading: "10. Minors",
      paragraphs: [`This service is intended for persons aged ${P.minAge} and above. We do not knowingly collect personal data from anyone younger. If you believe a minor's data has been collected, please notify us immediately and we will delete it.`],
    },
    {
      heading: "11. Updates to this policy",
      paragraphs: ["We will update the date at the top of this page when material changes are made. For changes that significantly affect your rights, we will notify you directly where required by law."],
    },
  ],
};

const refund: Policy = {
  title: "Refund & Replacement Policy",
  summary: "When you can cancel, how our replacement guarantee works, how to raise a request, and how refunds are processed.",
  blocks: [
    {
      heading: "1. Cancellation before delivery",
      paragraphs: [
        "You may cancel a paid, undelivered order at any time for a full refund. There is no cancellation fee.",
        `If your order has not been delivered within ${P.deliveryOuterHours} hours of confirmed payment, you are entitled to cancel it and receive a full refund — contact us with your order number to initiate this. An order left unpaid cancels itself automatically after ${P.unpaidOrderMinutes} minutes; nothing is charged.`,
      ],
    },
    {
      heading: "2. After delivery — replacement guarantee",
      paragraphs: [
        "Because digital access is an intangible product delivered instantly to your order page, we do not offer refunds for a change of mind once credentials have been delivered. However, every purchase is backed by our replacement guarantee:",
      ],
      bullets: [
        `Purchases: covered for ${P.replacementDays} days from the date and time of delivery.`,
        "Rentals: covered for the full duration of the rental period.",
      ],
      closing: [
        "The guarantee applies if: (a) the access stops working through no fault of yours; (b) the underlying account is reclaimed or suspended for reasons outside your control; or (c) the product does not match the description on the game page.",
        "The guarantee does not cover: issues caused by changing the account settings, sharing credentials with others, violating the platform's Terms of Service, using cheats or hacks, or continuing to use a rental after its period has ended.",
      ],
    },
    {
      heading: "3. How we resolve a claim",
      paragraphs: [
        "Once we verify the claim, we will either provide replacement access of equivalent value or, if a suitable replacement is not available within a reasonable time, issue a full refund. We will not leave you without a resolution for a valid claim.",
      ],
    },
    {
      heading: "4. Rentals — additional terms",
      paragraphs: [
        "The rental period begins at the time of delivery, not at the time of payment. We do not refund unused time for a rental that functioned as described. If access stops working during the rental period through no fault of yours, we will either provide a replacement for the remaining time or refund the proportional unused portion.",
      ],
    },
    {
      heading: "5. How to raise a request",
      paragraphs: [
        "Raise a support request via Account → Help & support (this automatically links to your order and is the fastest route). Alternatively, message us on WhatsApp with your order number and a description of the issue. We acknowledge within " + `${P.acknowledgeHours}` + " hours and aim to resolve within " + `${P.resolveDays}` + " days.",
      ],
    },
    {
      heading: "6. Refund processing",
      paragraphs: [
        `Approved refunds are returned to the original payment method via Razorpay and typically appear within ${P.refundDays}. Razorpay's payment processing fee is not passed on to you — your refund is for the full amount paid. Refunds cannot be processed for transactions more than 6 months old due to Razorpay's processing window.`,
        "Partial refunds (for example, the unused portion of a rental) are calculated proportionally. These rules apply equally to orders arranged directly with us off-platform.",
      ],
    },
    {
      heading: "7. Promotional codes and coupons",
      paragraphs: [
        "A coupon code is not reinstated if the associated order is refunded. If the refund is due to our fault, we will issue a replacement code upon request.",
      ],
    },
  ],
};

const shipping: Policy = {
  title: "Delivery Policy",
  summary: "How we deliver digital game access, how long it takes, and what to do if something goes wrong. There is no physical shipping — everything is digital.",
  blocks: [
    {
      heading: "1. Delivery method",
      paragraphs: [
        "This is a fully digital service. After your payment is confirmed, we prepare your access credentials. Once ready, they appear on your order page: either an account ID and password, or a scan-to-play QR/access code — the game page specifies which before you pay.",
        "You will receive an order confirmation email. We may also contact you via WhatsApp if we need anything to complete delivery. To access your credentials, go to Account → My orders → your order → \"Show my login details\". The credentials are shown to you only.",
      ],
    },
    {
      heading: "2. Delivery timeframes",
      paragraphs: [
        "Each game page displays the expected delivery time for that specific game (for example, \"about 45 minutes\"). The same estimate is shown in your cart before you pay. These are honest estimates based on typical fulfilment times — every order is prepared individually rather than dispatched from ready stock, so actual times may vary, particularly outside our working hours or during high-demand periods.",
        `If your order is not delivered within ${P.deliveryOuterHours} hours of confirmed payment, you are entitled to a full refund — see the Refund & Replacement Policy.`,
      ],
    },
    {
      heading: "3. What you will receive",
      bullets: [
        "Account credential listings: an account ID (email or username) and a password for an account that has the game installed or licenced.",
        "Scan-to-play listings: a QR code or access link that signs you in directly — no password required.",
        "The game page clearly states which type applies to each listing, before checkout.",
      ],
    },
    {
      heading: "4. Rentals",
      paragraphs: [
        "For rentals, the access period begins at the moment of delivery, not at the moment of payment. Your order page shows the exact start and end date and time. When the rental period expires, your credentials stop appearing on the order page and you must immediately cease using the access.",
      ],
    },
    {
      heading: "5. Delivery issues",
      paragraphs: [
        "If your order is delayed beyond the displayed estimate, or if you experience any issue with the delivered access, please open a support request from Account → Help & support with your order number, or contact us via WhatsApp. We respond within " + `${P.acknowledgeHours}` + " hours.",
      ],
    },
  ],
};

const contact: Policy = {
  title: "Contact Us",
  summary: "How to reach us, our registered details, and who to write to if you have a complaint.",
  blocks: [
    {
      heading: "Merchant details",
      bullets: [
        "Business name: {name}",
        "Registered address: {address}",
        "GSTIN: {gstin}",
        "Nature of business: Digital game access service — resale of digital entertainment products",
        "Merchant category: Digital Goods / Software",
      ],
    },
    {
      heading: "Contact",
      bullets: [
        "Email: {email}",
        "WhatsApp: {phone}",
        "For an order-related issue, the fastest route is Account → Help & support, as it is automatically linked to your order.",
      ],
    },
    {
      heading: "Grievance Officer",
      paragraphs: [
        "In accordance with the Consumer Protection (E-Commerce) Rules, 2020 and the IT (Intermediary Guidelines) Rules, we have appointed a Grievance Officer: {officer}, reachable at {email}.",
        `We acknowledge all complaints within ${P.acknowledgeHours} hours and aim to resolve them within ${P.resolveDays} days.`,
      ],
    },
  ],
};

export const POLICIES: Record<string, Policy> = { terms, privacy, refund, shipping, contact };
