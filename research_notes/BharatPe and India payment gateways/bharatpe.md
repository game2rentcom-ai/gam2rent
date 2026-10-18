# BharatPe: Payment Gateway API and E-commerce Integration Research

## Does BharatPe offer a payment gateway API or SDK for websites?

### Takeaway
BharatPe has historically been an offline merchant payments company, but its subsidiary Resilient Payments received RBI approval as an online Payment Aggregator in April 2025 and launched the BharatPeX brand, which explicitly advertises API, SDK, and Plugin integration for e-commerce and enterprises. However, no public documentation, SDK repository, or self-serve developer portal exists as of the research date.

### Cited Findings
- BharatPeX.com lists "Easy integration via API, SDK, or Plugin" as a feature — [BharatPeX official website](https://bharatpex.com)
- BharatPeX at GFF 2026 (September 11, 2026) announced a payment gateway with "single integration supporting over 100 payment options" including APIs, callbacks, and webhooks — [Inc42 GFF 2026 launches](https://inc42.com/?p=572224)
- BharatPeX CEO Sandeep Indurkar said at the October 2025 launch: "We don't stop at an API" — indicating an API does exist — [Digital Terminal](https://digitalterminal.in/amp/story/solutions/bharatpe-introduces-bharatpex-with-ai-assistant-for-seamless-upi-and-card-payments)
- The BharatPeX.AI assistant can generate sample code that teams can reuse, covering UPI Autopay and UPI Circle journeys — [Newsable/AsianetNews](https://newsable.asianetnews.com/business/bharatpe-launches-bharatpex-ai-powered-digital-payments-stack-articleshow-swke0ys)
- API Evangelist (a third-party directory, likely predating 2025 BharatPeX launch) reported BharatPe does not publish a public developer API, SDK, sandbox, or OpenAPI surface — [API Evangelist](https://providers.apievangelist.com/providers/bharatpe/)
- No public SDK package, API documentation portal, sandbox, or developer sign-up page was found on bharatpe.com or bharatpex.com — [bharatpe.com](https://bharatpe.com); [bharatpex.com](https://bharatpex.com)

### Inferences
- BharatPeX does offer an API for online payment integration, but access is through enterprise sales/onboarding, not a self-serve developer program.
- The "no public documentation" finding from API Evangelist likely reflects the state before April 2025; BharatPeX launched after RBI approval that month.
- Developers wanting to test BharatPeX would need to go through a sales contact rather than sign up online.

### Gaps
- No public API documentation URL, SDK package name, or sandbox endpoint was found. These may be shared only after enterprise onboarding.
- Unknown whether BharatPeX has a self-serve tier for small merchants or is strictly enterprise-only.

---

## Is BharatPe limited to offline/QR/UPI collect for physical merchants?

### Takeaway
BharatPe's main consumer-facing brand (bharatpe.com) remains focused on offline merchant products, but BharatPeX is explicitly the online payments arm, backed by RBI payment aggregator approval. The two brands co-exist.

### Cited Findings
- bharatpe.com lists its products as BharatPe QR, BharatPe Swipe (card POS), BharatPe One (all-in-one device), and BharatPe Speaker — all physical/offline products — [BharatPe business page](https://bharatpe.com/business)
- Business Standard (2019): BharatPe was "focused on offline shop owners" — [Business Standard](https://www.business-standard.com/article/companies/fintech-firm-bharatpe-focused-on-offline-shop-owners-raises-rs-350-crore-119082600693_1.html)
- BharatPe was founded to launch India's first UPI interoperable QR code (2018) and was a leader in UPI offline transactions, processing 8 crore+ UPI transactions per month — [The Quint](https://www.thequint.com/amp/story/brandstudio/partner-bharatpe-upi-tpap-launch)
- Resilient Payments (BharatPe subsidiary) received final RBI approval on April 8, 2025 to operate as an online Payment Aggregator under the BharatPeX brand — [Medianama](https://www.medianama.com/2025/04/223-bharatpe-rbi-payment-aggregator-approval-2025/); [Moneylife](https://www.moneylife.in/article/bharatpe-finally-gets-rbi-nod-for-online-payment-aggregator/69461.html); [Inc42](https://inc42.com/buzz/bharatpe-gets-rbi-approval-for-payment-aggregator-business)
- The RBI approval process began in January 2023 and concluded in April 2025 — [Medianama](https://www.medianama.com/2025/04/223-bharatpe-rbi-payment-aggregator-approval-2025/)

### Inferences
- Before April 2025, BharatPe was structurally limited to offline merchant QR/UPI due to lack of RBI online PA approval.
- With the 2025 RBI approval and BharatPeX launch, BharatPe is no longer restricted to offline use — but the main bharatpe.com brand still markets exclusively offline products.

### Gaps
- Unknown whether the offline and online products share merchant onboarding or are entirely separate programs.

---

## Does bharatpe.com have developer documentation or e-commerce integration guides?

### Takeaway
The main bharatpe.com website has no publicly visible developer documentation or e-commerce integration guides. There is a "Build with BharatPe" resource link on the site, but it contained no accessible documentation in research. BharatPeX.com mentions integration but links to no documentation.

### Cited Findings
- bharatpe.com's Resources menu lists a "Build with BharatPe" link (/build-with-bharatpe) and a "BharatPe Tech" external link (tech.bharatpe.com); neither contained developer documentation when fetched — [bharatpe.com](https://bharatpe.com)
- tech.bharatpe.com was found to be an invalid/non-resolving domain at time of research — Research attempt
- bharatpex.com states integration is "via API, SDK, or Plugin" but links to no documentation, sandbox, or developer portal — [bharatpex.com](https://bharatpex.com)
- A site:bharatpe.com search for "developer API integration" returned zero bharatpe.com pages — only third-party directories and Fiverr gigs — Research result
- No documentation URLs appeared in any news coverage, press releases, or third-party listings

### Inferences
- BharatPe has not published a public developer portal as of October 2026. Documentation is presumably shared after enterprise sales engagement.
- This contrasts sharply with competitors like Razorpay (docs.razorpay.com) and Cashfree (docs.cashfree.com) which have fully public documentation.

### Gaps
- The actual "Build with BharatPe" page content was not accessible via WebFetch; it may contain documentation behind a login or may be a static marketing page.
- tech.bharatpe.com may have been an internal blog (BharatPe Tech blog) rather than a developer portal; it was unavailable at research time.

---

## Are there BharatPe products that support online checkout?

### Takeaway
BharatPeX is the BharatPe product line for online checkout, with the full payment gateway launched at GFF 2026. Additionally, BharatPe launched a Merchant Plugin in January 2025 for in-app UPI payments. Payment Links are also available for social commerce/no-website use cases.

### Cited Findings
- **BharatPeX Payment Gateway** (GFF 2026 launch, September 11, 2026): 100+ payment methods, dynamic routing, PCI DSS Level 1, recurring payments, split payments, virtual accounts — [Passionate in Marketing](https://www.passionateinmarketing.com/bharatpex-launches-enterprise-payment-gateway-at-gff-2026-with-intelligent-routing-and-unified-payment-operations/index.php); [Inc42](https://inc42.com/?p=572224)
- **Payment Links**: BharatPeX.com lists payment links for collection via SMS, email, WhatsApp, or social media — [bharatpex.com](https://bharatpex.com)
- **Merchant Plugin** (January 2025): BharatPe, in collaboration with Unity Bank, introduced a Merchant Plugin for in-app UPI payments that keeps customers inside the merchant's own app rather than redirecting to a UPI app — [YourStory](https://yourstory.com/2025/01/bharatpes-merchant-plugin-simplifies-in-app-upi-payments) (article returned 403)
- **BharatPeX product list**: UPI, card, wallet integration; in-app payments via Merchant Plug-in, TPAP, and BHIM VEGA; payouts; BBPS — [bharatpex.com](https://bharatpex.com)
- BharatPeX supported payment methods at GFF 2026: Cards, UPI, Net Banking, IMPS/NEFT/RTGS, EMI (standard and no-cost), cardless EMI, Pay Later, discounts/cashback — [Passionate in Marketing](https://www.passionateinmarketing.com/bharatpex-launches-enterprise-payment-gateway-at-gff-2026-with-intelligent-routing-and-unified-payment-operations/index.php)
- BharatPeX integration model involves a dedicated Product, Tech, and Relationship team; the company claims this cuts integration effort to "about one-third of typical timelines" — [Digital Terminal](https://digitalterminal.in/amp/story/solutions/bharatpe-introduces-bharatpex-with-ai-assistant-for-seamless-upi-and-card-payments)

### Inferences
- BharatPeX is a full-featured online payment gateway competitive with Razorpay/Cashfree on payment method coverage, but its distribution model is enterprise/sales-led rather than self-serve.
- Payment Links provide a lightweight no-integration option suitable for social commerce or link-in-bio selling, though not a true checkout integration.

### Gaps
- No BharatPeX pricing page was found. Unknown whether there is a percentage-based MDR or flat fee structure.
- Unknown which e-commerce platforms (WooCommerce, Shopify, Magento) have ready-made BharatPeX plugins.

---

## What do developer communities say about BharatPe website integration?

### Takeaway
There is effectively no developer community discussion about integrating BharatPe on websites. No Reddit threads, Stack Overflow questions, or GitHub repositories were found. The only developer-adjacent mentions are an unsolved interview-prep question and promotional press coverage.

### Cited Findings
- A Prepfully interview-prep page poses a scenario about guiding a customer through BharatPe API custom payment integration, but has no community answers — [Prepfully](https://prepfully.com/answers/explain-api-integrations-bharatpe)
- No Reddit or Stack Overflow results appeared in multiple developer-focused searches for "BharatPe integration website"
- Third-party software directories (GetApp, SoftwareAdvice, Capterra) list "API" and "eCommerce integration" as BharatPe features, but these appear to be auto-populated categories with no documentation links — [GetApp](https://www.getapp.com/finance-accounting-software/a/bharatpe); [SoftwareAdvice](https://www.softwareadvice.com/product/483931-BharatPe/)
- Software Advice shows a 3.8/5 merchant rating with 9 reviews; one reviewer noted transactions getting stuck and slow support resolution (not developer-focused) — [SoftwareAdvice](https://www.softwareadvice.com/product/483931-BharatPe/)
- BharatPe does not appear in any of the major India payment gateway comparison guides for e-commerce (Razorpay, Cashfree, PayU, CCAvenue are the typical recommendations) — [Qikink blog](https://qikink.com/blog/best-payment-gateways-india/); [Decentro blog](https://decentro.tech/blog/razorpay-alternatives/)

### Inferences
- The complete absence of developer community discussion strongly suggests BharatPeX has had minimal developer adoption since its October 2025 launch, consistent with an enterprise-sales onboarding model rather than a public sign-up funnel.
- India payment gateway roundups not mentioning BharatPe for e-commerce also suggests low mindshare among the indie developer/SMB segment.

### Gaps
- No GitHub search was performed for BharatPe SDK repositories; this could reveal unofficial or community-built integrations.
- It is unclear if there are any BharatPeX design partners or pilot customers who have discussed integration publicly.

---

## Summary Verdict

BharatPe **can** be used for e-commerce website checkout via the BharatPeX brand, which received RBI online Payment Aggregator approval in April 2025 and launched a full payment gateway at GFF 2026. It supports cards, UPI, net banking, EMI, Pay Later, and more through a single integration using APIs, webhooks, and callbacks.

However, BharatPeX is **not suitable as a drop-in self-serve payment gateway** for most e-commerce websites because:
1. There is no public developer documentation, sandbox, or SDK repository.
2. Integration is through enterprise sales/onboarding with a dedicated team, not a self-sign-up portal.
3. There is no developer community adoption yet and no known ready-made plugins for WooCommerce or Shopify.
4. Pricing is not publicly listed.

For website checkout in India today, **Razorpay, Cashfree, or PayU remain the practical choices** for most developers and merchants. BharatPeX is positioned as an enterprise alternative and may become more accessible over time.
