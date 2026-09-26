// The store's legal pages, written for how the store actually works. Business details ({name}, {address},
// {email}, {phone}, {officer}) are filled in from Admin → Settings when a page is shown, so nothing here needs
// editing when they change. The numbers people are promised live in ONE place, just below.

export const POLICIES_UPDATED = "26 September 2026";

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
  summary: "The rules for using this website and buying or renting from it. By creating an account or placing an order you agree to them.",
  blocks: [
    {
      heading: "1. Who we are",
      paragraphs: [
        "This website is run by {name} (“we”, “us”). Our address and contact details are on the Contact us page. We are an independent reseller of digital game access. We are not affiliated with, endorsed by or sponsored by Sony, Microsoft, Valve, Nintendo, Epic Games or any other platform or game publisher. All game names, logos and artwork belong to their owners and are shown only to identify the games.",
      ],
    },
    {
      heading: "2. What you are buying or renting",
      paragraphs: [
        "We provide access to a game through an account that already has the game (a login and password) or through a scan-to-play QR code. You are not buying a redeemable key, and you do not own the account: you get the right to use it for yourself, on the terms below.",
        "Each game page tells you before you pay whether you are buying or renting, which platform it is for, what you will receive (a login or a QR code), the price and the usual delivery time.",
        "Buying gives you access with no end date, covered by our replacement guarantee for the period in the Refund & Replacement Policy. Renting gives you access for the number of days shown on the plan, counted from the moment we deliver.",
      ],
    },
    {
      heading: "3. Platform rules and risk — please read",
      paragraphs: [
        "Platform holders (for example PlayStation, Xbox or Steam) have their own terms, and some of them do not allow accounts to be shared. Because of that, an account can occasionally be restricted, suspended or taken back by the platform or by its original owner, outside our control. This is the main risk of this kind of product, and it is why we offer the replacement guarantee.",
        "By ordering you confirm that you understand this. You are responsible for how you use the account after delivery.",
      ],
    },
    {
      heading: "4. Your account with us",
      bullets: [
        `You must be at least ${P.minAge} years old to place an order. A younger person may play only on an order placed by a parent or guardian, who is responsible for it.`,
        "Give us correct details, especially a WhatsApp number that works, because we use it to reach you about your order.",
        "Keep your password private. You are responsible for everything done through your account.",
        "One person, one account. Do not create accounts to get around limits, coupons or a suspension.",
      ],
    },
    {
      heading: "5. Prices and payment",
      paragraphs: [
        "Prices are in Indian rupees (INR) and are the prices shown at checkout. Online payments are taken by Razorpay, which handles your card, UPI or net-banking details under its own security rules — we never see or store them. An order is confirmed only when the payment succeeds.",
        `If you start an order and do not pay, it cancels itself after ${P.unpaidOrderMinutes} minutes. Coupon codes are single-use for each customer unless stated otherwise, cannot be exchanged for cash, and we may withdraw a code that is misused.`,
        "If money leaves your account but the order does not show as paid, do not pay again — contact us with the payment reference and we will sort it out. Failed payments are normally returned by your bank automatically.",
      ],
    },
    {
      heading: "6. Delivery",
      paragraphs: [
        "Delivery works as set out in the Delivery Times page: your login details appear on your order page once your order is delivered. Rented access ends automatically when the rental period ends, and the details are removed from your order page.",
      ],
    },
    {
      heading: "7. Using the login details",
      bullets: [
        "Use the account only for yourself. Do not share, sell or publish the login details, and do not let others use them.",
        "Do not change the account’s email, password, security or payment settings, and do not link your own payment methods to it, unless we tell you to.",
        "Do not use cheats, or break the platform’s or the game’s own rules — that can get the account banned, and a ban you cause is not covered by the guarantee.",
        "For a rental, stop using the account when the rental ends.",
      ],
    },
    {
      heading: "8. Reviews, comments and requests",
      paragraphs: [
        "Reviews can be written only by customers who received the game, and are shown with your first name. Comments and game requests are public and shown with your first name; who voted for a request is never shown.",
        "Be honest and respectful. Do not post anything unlawful, abusive, misleading or private about someone else, and do not post advertising. We may hide or delete content that breaks these rules, and may close accounts that keep doing it.",
      ],
    },
    {
      heading: "9. Things you must not do",
      bullets: [
        "Use the site for anything unlawful, or to cheat or defraud us or another customer.",
        "Try to get around our order, payment, coupon or security systems, or to reach data that is not yours.",
        "Dispute a payment with your bank for an order that was delivered, without first giving us the chance to fix the problem.",
      ],
    },
    {
      heading: "10. Our responsibility",
      paragraphs: [
        "We stand behind every order with the replacement guarantee. Beyond that, and as far as the law allows, we are not liable for indirect or consequential loss, for a platform’s decisions, or for problems caused by how the account was used after delivery. Our total liability for any order is limited to the amount you paid for it. Nothing here limits any right you have under Indian consumer law that cannot be limited.",
      ],
    },
    {
      heading: "11. Closing accounts",
      paragraphs: [
        "You may stop using the site at any time and ask us to close your account. We may suspend or close an account, and cancel an order with a refund, if these terms are broken or we suspect fraud.",
      ],
    },
    {
      heading: "12. Changes to these terms",
      paragraphs: [
        "We may update these terms. The date at the top shows when they last changed. If you keep using the site after a change, you accept the new terms; orders already placed stay on the terms they were placed under.",
      ],
    },
    {
      heading: "13. Law and complaints",
      paragraphs: [
        "These terms are governed by the laws of India. Courts at the place of our registered address, given on the Contact us page, have jurisdiction, without affecting any right you have to go to a consumer forum. For complaints, contact our Grievance Officer ({officer}) at {email}. We acknowledge a complaint within " + `${P.acknowledgeHours} hours and aim to resolve it within ${P.resolveDays} days.`,
      ],
    },
  ],
};

const privacy: Policy = {
  title: "Privacy Policy",
  summary: "What personal information we collect, why, who handles it, how long we keep it, and the choices you have. We follow India’s Digital Personal Data Protection Act, 2023 and the rules made under it as they apply to us.",
  blocks: [
    {
      heading: "1. Who is responsible",
      paragraphs: ["{name} runs this website and decides why and how your personal information is used. Contact details are on the Contact us page."],
    },
    {
      heading: "2. What we collect",
      bullets: [
        "Account details: your name, email address, password (kept only in scrambled form by our login provider), and your WhatsApp number.",
        "Your preferences: the platforms and kinds of game you say you like, your wishlist, and the contents of your cart.",
        "Orders: what you bought or rented, the price, any coupon used, the time, the delivery status, your name and number as they were when you ordered, and the payment reference from Razorpay.",
        "The login details we deliver to you — stored encrypted, and readable only by you. If we ever need to read them to fix a problem, that is recorded.",
        "Support conversations, reviews, comments and game requests you send us, and the votes you cast.",
        "Technical information that comes with any visit: your IP address, browser and device type, and the pages requested, kept in our hosting providers’ logs for security and troubleshooting.",
      ],
      closing: ["We do not receive or store your card, UPI or bank details — Razorpay collects those directly."],
    },
    {
      heading: "3. Why we use it",
      bullets: [
        "To take your order, take payment, deliver the game and give you a receipt.",
        "To contact you about your order or a support request — by email, on the site, or on WhatsApp.",
        "To show you suggestions based on what you saved, bought or said you like.",
        "To keep the store safe: preventing fraud, misuse and abuse, and keeping the records the law requires.",
        "To show your first name with a review, comment or request you choose to post.",
      ],
      closing: ["We ask for your agreement to the above when you create an account and place an order. You can withdraw it at any time (see “Your rights”), though we may then be unable to serve you."],
    },
    {
      heading: "4. Who handles it for us",
      bullets: [
        "Razorpay — takes your payment and handles refunds.",
        "Supabase — hosts our database, logins, file storage and the programs that run payments and delivery. Our project is hosted in " + `${P.dataRegion}` + ", so your information is stored and processed outside India.",
        "Vercel — hosts the website itself and keeps ordinary access logs.",
        "Resend — sends order emails, where switched on.",
        "WhatsApp (Meta) — when you message us or we message you.",
      ],
      closing: [
        "These providers use your information only to provide their service to us. We do not sell your personal information, and we do not share it for advertising.",
        "We may disclose information if the law, a court or a government authority requires it.",
      ],
    },
    {
      heading: "5. Cookies and similar storage",
      paragraphs: [
        "The site stores a small sign-in token in your browser so you stay logged in, and remembers if you dismissed the announcement banner. These are needed for the site to work. We do not currently use advertising or tracking cookies or third-party analytics. If we add any, we will update this page first and ask for your consent where the law requires it.",
      ],
    },
    {
      heading: "6. How long we keep it",
      bullets: [
        `Order and payment records: up to ${P.recordYears} years, because tax and accounting law requires it.`,
        `Support conversations: up to ${P.supportYears} years after they are closed.`,
        "Your account details: while your account is open, and for as long afterwards as we need them for the records above.",
        "Server logs: a short period set by our hosting providers.",
      ],
    },
    {
      heading: "7. Keeping it safe",
      paragraphs: [
        "The site uses HTTPS. Each customer can see only their own orders and messages, only the owner can open the admin area, delivered login details are encrypted, and payments are checked with Razorpay before an order is marked paid. No system is perfectly secure. If a breach affects your personal information we will tell you and the authorities as the law requires.",
      ],
    },
    {
      heading: "8. Your rights",
      paragraphs: ["You can ask us to:"],
      bullets: [
        "tell you what personal information of yours we hold and how it is used;",
        "correct or complete it (you can change your name and number yourself on the Account page);",
        "delete it — we will delete what we can, and keep only what the law makes us keep, which we then use for nothing else;",
        "stop using it for something you agreed to (withdraw consent);",
        "deal with a complaint about how we have handled it, and nominate someone to exercise these rights for you if you cannot.",
      ],
    },
    {
      heading: "9. Complaints",
      paragraphs: [
        "Write to our Grievance Officer ({officer}) at {email}. We acknowledge within " + `${P.acknowledgeHours} hours and aim to resolve within ${P.resolveDays} days. If you are not satisfied you may complain to the Data Protection Board of India.`,
      ],
    },
    {
      heading: "10. Children",
      paragraphs: [`The store is for people aged ${P.minAge} and over. We do not knowingly collect information from anyone younger. If you believe we have, tell us and we will delete it.`],
    },
    {
      heading: "11. Changes",
      paragraphs: ["If this policy changes in a way that matters, we will update the date at the top and, where the law requires, tell you directly."],
    },
  ],
};

const refund: Policy = {
  title: "Refund & Replacement Policy",
  summary: "When you can cancel, when we replace an account or refund you, how to ask, and how long it takes.",
  blocks: [
    {
      heading: "1. Before delivery",
      paragraphs: [
        "If you have paid but your order has not been delivered, you can cancel it for a full refund.",
        `If your order is still undelivered ${P.deliveryOuterHours} hours after payment, tell us and we will cancel it and refund you in full. An order you started but did not pay for cancels itself after ${P.unpaidOrderMinutes} minutes, and nothing is charged.`,
      ],
    },
    {
      heading: "2. After delivery — the replacement guarantee",
      paragraphs: [
        `Because the product is digital access, we do not refund because you changed your mind once it has been delivered. But every purchase is covered by our replacement guarantee for ${P.replacementDays} days from delivery, and every rental for the whole rental period. It applies if:`,
      ],
      bullets: [
        "The account is taken back by its original owner or the platform,",
        "it is banned or suspended for a reason that is not your fault,",
        "the login stops working, or it is not as described on the game page.",
      ],
    },
    {
      heading: "3. What we do about a problem",
      paragraphs: [
        "Once we have checked it, we replace it with a working account, or — if we cannot — refund you. If we cannot fix a problem that is covered, you will not be left without either.",
        "The guarantee does not cover problems you caused: changing the account’s details, sharing it, cheating or otherwise breaking the platform’s rules, or using it after a rental has ended.",
      ],
    },
    {
      heading: "4. Rentals",
      paragraphs: [
        "A rental is for the number of days you chose, counted from delivery. There is no refund for unused days of a rental that worked as described. If it stops working during the rental, we replace it for the rest of the period or refund the unused part.",
      ],
    },
    {
      heading: "5. How to ask",
      paragraphs: [
        "Open a request from Account → Help & support (best, because it is linked to your order), or message us on WhatsApp. Give your order number and describe what happened. We acknowledge within " + `${P.acknowledgeHours} hours and aim to sort it out within ${P.resolveDays} days.`,
      ],
    },
    {
      heading: "6. How refunds are paid",
      paragraphs: [
        `Refunds go back to the payment method you used, through Razorpay, and usually reach you in ${P.refundDays}. A refund cannot be made on a payment more than 6 months old. Razorpay’s own fee is not returned to us, so we do not deduct anything from your refund for it.`,
        "If an order was arranged with us directly instead of through the site, the same rules apply and we will refund the way you paid.",
      ],
    },
    {
      heading: "7. Coupons",
      paragraphs: ["If an order that used a coupon is refunded, the coupon is not restored unless the refund is because of our error."],
    },
  ],
};

const shipping: Policy = {
  title: "Delivery Times",
  summary: "How and when you receive what you buy. There is no physical shipping — everything is digital.",
  blocks: [
    {
      heading: "1. How delivery works",
      paragraphs: [
        "When your payment is confirmed we prepare your access. When it is ready, your order page shows it: either a login (ID and password) or a QR code to scan, depending on the game. You will also get an email, and we may message you on WhatsApp if we need anything.",
        "Open Account → My orders → your order → “Show my login details”. The details are shown only to you.",
      ],
    },
    {
      heading: "2. How long it takes",
      paragraphs: [
        "Each game page shows the usual delivery time for that game, for example “about 45 minutes”, and the same estimate is repeated in your cart. It is an honest estimate, not a guarantee to the minute: every account is prepared individually rather than sent from stock, so some orders take longer, especially outside our working hours.",
        `If your order is not delivered within ${P.deliveryOuterHours} hours of payment, you can cancel it for a full refund — see the Refund & Replacement Policy.`,
      ],
    },
    {
      heading: "3. What you receive",
      bullets: [
        "Login listings: an account ID and password for an account that has the game.",
        "QR listings: a code you scan to sign in, with no password needed.",
        "Each game page says which one applies before you pay.",
      ],
    },
    {
      heading: "4. Rentals",
      paragraphs: ["The rental period starts when we deliver, not when you pay. The order page shows the start and end dates. When it ends, the details are removed from your order page."],
    },
    {
      heading: "5. Delivery problems",
      paragraphs: ["If something is late or wrong, open a request from Account → Help & support or message us on WhatsApp with your order number."],
    },
  ],
};

const contact: Policy = {
  title: "Contact us",
  summary: "Who we are, how to reach us, and who to write to with a complaint.",
  blocks: [
    {
      heading: "Seller details",
      bullets: ["Business name: {name}", "Registered address: {address}", "GSTIN: {gstin}"],
    },
    {
      heading: "Reach us",
      bullets: ["Email: {email}", "WhatsApp: {phone}", "For an order, the fastest way is Account → Help & support, because it is linked to your order."],
    },
    {
      heading: "Grievance Officer",
      paragraphs: [
        "For complaints about an order, about the site, or about your personal information, write to our Grievance Officer: {officer}, at {email}. " + `We acknowledge within ${P.acknowledgeHours} hours and aim to resolve within ${P.resolveDays} days.`,
      ],
    },
  ],
};

export const POLICIES: Record<string, Policy> = { terms, privacy, refund, shipping, contact };
