# Indian Payment Gateways for Gaming / Digital Goods Merchants

> Context: Small online store selling digital gaming goods (game account access/credentials). Needs UPI + card support. India-specific. Researched October 2026.

---

## Do Cashfree, PayU, and EaseBuzz approve gaming or digital goods merchants?

### Takeaway
Cashfree explicitly prohibits gambling and money-game related businesses but permits non-money online gaming with a legal opinion and RNG certificate. PayU references a "Schedule B" banned-items list in its merchant agreement but the full list is not publicly accessible. EaseBuzz publicly states it supports digital goods merchants but no gaming-specific policy was found.

### Cited Findings

- Cashfree's help center lists "Gaming/gambling which includes lottery tickets, sports bets, memberships/enrolment in online gambling sites, and related content" as a prohibited category — if a business falls into this, the payment gateway account will not be activated. — [Cashfree Help Center - Unsupported Businesses](https://cashfree.com/help/69/there-any-specific-businesses-that-are-supported-cashfree)
- Cashfree's onboarding FAQ (fetched directly) lists "Gambling, lottery tickets, and online betting" as prohibited, but **online gaming** (non-money) is NOT prohibited; instead it appears as a line of business that requires "RNG certificate (if applicable) and legal opinion." — [Cashfree Onboarding FAQs](https://www.cashfree.com/docs/help/onboarding-related/onboarding-faqs)
- Cashfree prohibits "counterfeit, unauthorised, or copyrighted goods, including media and software" — selling third-party game account credentials could fall under this. — [Cashfree Onboarding FAQs](https://www.cashfree.com/docs/help/onboarding-related/onboarding-faqs)
- PayU's merchant QR GTC (Terms and Conditions) references a "Schedule B" list of banned items, stating it "is only for reference and may be updated from time to time." The agreement bars merchants from offering products "illegal or offensive or banned as per List of Banned Items." Clause 7.2.29 imposes liquidated damages (six months of Customer Charge) for dealing in banned/restricted items. The full Schedule B was not accessible in the fetched document. — [PayU Merchant QR GTCs](https://payu.in/bfl-payu-merchant-qr-gtcs/)
- A YourStory-hosted page describes EaseBuzz as allowing sellers to sell "physical products, digital goods, membership or services, and event tickets" — though this is a dated seller-facing page and not a formal policy document. — [YourStory on EaseBuzz](https://ts.yourstory.com/mystory/776ea34cb0-easebuzz-an-easy-way-to-sell-online-and-collect-payments)
- EaseBuzz is an RBI-authorised Payment Aggregator and supports 100+ payment options including UPI, cards, wallets, EMI and BNPL. — [EaseBuzz official page](https://campaign.easebuzz.in/best-payment-gateway/)

### Inferences
- Cashfree's distinction between "online gaming" (permitted with legal opinion + RNG certificate) and "gambling/lottery" (prohibited) is the most explicit policy found among the three. A game account marketplace likely falls closer to "digital goods" than "gambling" in Cashfree's framing — but it depends on how Cashfree's compliance team categorizes account-credential sales.
- PayU's use of a non-public Schedule B makes it hard to confirm eligibility without directly contacting their merchant onboarding team.
- EaseBuzz's willingness to accept digital goods broadly suggests a lower barrier to onboarding, but no official gaming policy page was found.

### Gaps
- PayU's full Schedule B list of banned merchants is not publicly available online — only accessible through the full merchant agreement or by contacting PayU directly.
- EaseBuzz's specific stance on gaming, game credentials, or virtual goods merchants was not found in any official document.
- None of the three gateways published an explicit policy on selling game account access or credentials as a digital good.

---

## Are there reports of these gateways rejecting gaming websites like Razorpay does?

### Takeaway
No community reports of Cashfree, PayU, or EaseBuzz specifically rejecting gaming merchants were found. However, the 2025 Online Gaming Act and related payment restrictions have led all major Indian gateways (including these three) to reduce or scrutinize RMG/gaming merchant exposure.

### Cited Findings

- Major payment gateways with exposure to the RMG (real-money gaming) industry, including **Razorpay, PayU, and Cashfree**, are expected to see pressure on their earnings following India's online money gaming ban. Smaller, gaming-focused payment players will be hit hardest. — [Sakshi Post / RMG ban impact](https://www.sakshipost.com/news/real-money-games-ban-affects-payment-gateways-may-face-rs-30000-crore-hit-transaction-volumes)
- Neon, a merchant-of-record platform for games, partnered with Razorpay (not the three gateways in question) to accept Indian player payments via UPI. Razorpay lists digital goods and digital services as eligible categories but does not explicitly name game merchants — one source advised confirming eligibility in writing. — [Neon + Razorpay partnership](https://www.neonpay.com/blog/expanding-dtc-payments-in-india-neon-partners-with-razorpay); [xflowpay comparison blog](https://www.xflowpay.com/blog/best-payfac-platforms-gaming)
- Paytm was fined in India over its link to online gambling — indicating that payment gateways processing gambling-adjacent transactions face regulatory enforcement risk. — [Sigma World on Paytm fine](https://sigma.world/news/paytm-fined-in-india-over-link-to-online-gambling/)
- MeitY held talks with banks and payment firms stating "offshore betting must be blocked" — the government's direction to payment intermediaries is to cut off online money gaming. — [Storyboard18](https://www.storyboard18.com/gaming-news/meity-holds-talks-with-banks-payment-firms-says-offshore-betting-must-be-blocked-79908.htm)

### Inferences
- The regulatory pressure is pushing all three gateways to tighten their gaming merchant policies. Even gateways that previously accepted gaming merchants may now apply higher scrutiny.
- The user's specific product (game account credentials, not real-money gaming) may not fall under the Act's prohibition — the Act targets wagering-based money games, not account marketplaces. However, the optics and high chargeback risk of account marketplaces make approval uncertain.

### Gaps
- No Reddit, IndiaHacks, or StartupIndia forum threads were found discussing specific rejection experiences with Cashfree, PayU, or EaseBuzz for gaming merchants.
- No direct comparison of approval rates across these three gateways for gaming businesses was found.

---

## What merchant categories do each support or explicitly exclude?

### Takeaway
Cashfree has the most publicly documented prohibited list. PayU's list is in a non-public Schedule B. EaseBuzz has no published prohibited-categories page.

### Cited Findings

**Cashfree — Confirmed Prohibited:**
- Gambling, lottery tickets, and online betting — [Cashfree Onboarding FAQs](https://www.cashfree.com/docs/help/onboarding-related/onboarding-faqs)
- Cryptocurrency exchanges and trading platforms
- Securities, stocks, bonds, wholesale currency
- Multi-level marketing, Ponzi schemes, matrix schemes
- Alcohol, tobacco, cigarettes
- Adult goods and services
- Drugs and prescription medication (without authorisation)
- Weapons, ammunition, armaments
- Counterfeit, unauthorised, or copyrighted goods (including media and software)
- Dropshipped merchandise
- Any product or service violating Indian or international laws
- Reward scheme terms also list: Lotteries, Slot Machines, Roulette, Bingo, Teen Patti, Andar Bahar, Satta Matka as prohibited under "Betting/Gambling" — [Cashfree Customer Reward Scheme T&Cs](https://www.cashfree.com/customer-reward-scheme-terms-and-conditions)

**Cashfree — Permitted with documentation:**
- Online gaming (non-money/non-gambling): requires RNG certificate (if applicable) and legal opinion — [Cashfree Onboarding FAQs](https://www.cashfree.com/docs/help/onboarding-related/onboarding-faqs)

**PayU — Confirmed structure but list not public:**
- "Schedule B" exists and is referenced in the merchant QR GTC; clause 7.2.5 bars offering products "banned as per List of Banned Items" — [PayU Merchant QR GTCs](https://payu.in/bfl-payu-merchant-qr-gtcs/)
- Violations trigger liquidated damages (6 months of Customer Charge) and potential account suspension/termination

**EaseBuzz — Confirmed supported (general):**
- Digital goods, physical products, memberships/services, event tickets — [YourStory/EaseBuzz](https://ts.yourstory.com/mystory/776ea34cb0-easebuzz-an-easy-way-to-sell-online-and-collect-payments)
- No public prohibited list found

### Inferences
- Cashfree's explicit "online gaming permitted with legal opinion" carve-out is the most favorable signal for a gaming-adjacent business among the three.
- EaseBuzz's inclusion of "digital goods" as a permitted category is encouraging, but without a prohibited list, there is uncertainty about edge cases like game credentials.

### Gaps
- PayU's Schedule B full list is not publicly available — must be requested from PayU's merchant onboarding team.
- EaseBuzz has no published prohibited-merchant policy page.

---

## Which is easiest/fastest to get approved for a small digital goods business?

### Takeaway
EaseBuzz is reportedly the most accessible for small digital goods merchants based on its stated support for digital goods and no published prohibited list. Cashfree is transparent about its categories and has a documented path for online gaming merchants with a legal opinion. PayU's process is less transparent for this category.

### Cited Findings

- Cashfree's activation prerequisites: live website or app with visible contact, privacy policy, refund policy, and terms pages; business must be registered in India; additional documents (RNG certificate, legal opinion) required for online gaming merchants — [Cashfree Onboarding FAQs](https://www.cashfree.com/docs/help/onboarding-related/onboarding-faqs)
- PayU obtained in-principle RBI approval to operate as a payment aggregator in November 2024 (after a period of suspended operations) — suggesting the onboarding process may have stabilised more recently — [Business Today on PayU RBI approval](https://www.businesstoday.in/amp/industry/banks/story/payu-gets-rbis-in-principle-nod-to-operate-as-payment-aggregator-after-a-year-long-wait-426648-2024-04-24)
- EaseBuzz is RBI-authorised and describes itself as targeting small and medium businesses with an easy integration. The mewayz.com documentation review describes it as suitable for a broad range of merchant categories — [EaseBuzz integration docs via Mewayz](https://mewayz.com/docs/easebuzz-payment-gateway-detailed-documentation)
- Instamojo (a separate gateway) was historically noted as the "best bet for digital goods and services" for small Indian merchants, with a flat 5% fee and biweekly payouts, though this data is from ~2015 — [The Rodinhoods forum](https://www.therodinhoods.com/?p=17272) (treat as outdated)

### Inferences
- For a small business trying to minimize onboarding friction, EaseBuzz appears most accessible based on available evidence — though this is partly because their policies are the least documented (which also means less certainty).
- Cashfree is the most transparent: a gaming merchant can see exactly what documentation is needed (legal opinion, RNG certificate) and plan accordingly.
- PayU's recent regulatory history (RBI returned its application in 2023, in-principle approval only in Nov 2024) suggests the safest approach is to apply to Cashfree or EaseBuzz first.

### Gaps
- No current side-by-side comparison of onboarding timelines for these three gateways was found for digital goods/gaming businesses.
- No user reviews specifically discussing EaseBuzz onboarding for gaming or digital goods were found.

---

## Are there other Indian payment gateways known to be friendly to gaming/digital goods?

### Takeaway
CCAvenue and Xsolla+Paytm are the closest alternatives with documented gaming/digital goods support. Instamojo is designed for digital goods but has outdated publicly available information. BillDesk is gaining importance as a mandatory verification provider for Google Play India merchants.

### Cited Findings

- **Xsolla + Paytm:** Xsolla, a game commerce platform, expanded into India via Paytm as merchant-of-record, specifically to help game developers sell to the Indian market via UPI-enabled methods — [01net.it on Xsolla India expansion](https://www.01net.it/xsolla-expands-into-india-with-paytm-payment-gateway-to-help-developers-sell-games-to-the-india-market). This is a merchant-of-record (MoR) model, not a direct payment gateway relationship.
- **CCAvenue:** Digital River's integration notes that CCAvenue "currently only accepts payments for digital products" within its platform — indicating CCAvenue has a path for digital goods merchants. One forum commenter called it "good for digital goods" and noted it accepts international cards — [Digital River docs on CCAvenue](https://docs.digitalriver.com/commerce-api/payments/supported-payment-methods/ccavenue); [Rodinhoods forum](https://www.therodinhoods.com/?p=17272)
- **Instamojo:** Historically designed for small digital goods sellers. Flat 5% fee, biweekly payouts, accepts USD and INR. Data is from ~2015 so policies may have changed — [Instamojo on Gumroad/Digital Deepak review](https://instamojo461.gumroad.com); [Digital Deepak Instamojo review](https://digitaldeepak.com/instamojo-payment-gateway-review-india/)
- **BillDesk:** Google Play now requires new merchants selling in India (as of January 1, 2026) to verify with BillDesk under the RBI's PA-CB (payment aggregator cross-border) framework. BillDesk is not a direct merchant gateway but is now a key compliance checkpoint — [Google Pay Merchant Center help](https://support.google.com/paymentscenter/answer/7421525?hl=en)
- **Neon (MoR) + Razorpay:** Neon, a merchant-of-record for game studios, partnered with Razorpay for India. This allows overseas game developers to receive INR payments without a local entity, at the cost of Neon's MoR markup — [Neon blog on India expansion](https://www.neonpay.com/blog/expanding-dtc-payments-in-india-neon-partners-with-razorpay)

### Inferences
- For a domestic India-registered business selling game-related digital goods, CCAvenue and EaseBuzz appear to be the most plausible alternatives to the three gateways in the main question.
- For an overseas seller targeting Indian customers, a merchant-of-record (Xsolla, Neon) may be the most practical route, avoiding the need for a local entity and local RBI compliance.
- The MoR route trades fees for compliance simplicity; Xsolla charges a percentage of transaction value (typically 5%+).

### Gaps
- No current CCAvenue merchant policy on game account credentials or account marketplace sales was found.
- BillDesk's merchant onboarding criteria for gaming businesses were not found.

---

## Critical Note on the Specific Business Model (Game Account Credentials)

Selling game account access/credentials is distinct from real-money gaming but carries its own risks:

1. **Publisher ToS violation risk:** Most game publishers (Steam, Riot, Activision, etc.) prohibit account sharing and selling in their Terms of Service. Payment gateways reviewing the business may classify this as facilitating ToS violations, which could lead to rejection or account termination.
2. **High chargeback risk:** Account marketplace sales have high chargeback rates (buyer disputes, account recovery by original owner). Gateways may require a rolling reserve or outright reject high-chargeback-risk merchants.
3. **Legal gray area in India:** The RBI's PA framework requires payment aggregators to conduct merchant due diligence. A business selling game credentials could be flagged under "counterfeit or unauthorised goods" if the gateway's compliance team treats the credentials as unlicensed resale.
4. **Recommendation:** Before applying to any gateway, prepare a clear merchant description that emphasizes the digital marketplace aspect (peer-to-peer/resale marketplace) and separates the business from gambling or RMG. A legal opinion from an Indian fintech lawyer may help with Cashfree's "legal opinion" requirement for online gaming merchants.

---

*Research conducted October 2026. Primary sources: Cashfree help center (direct fetch), PayU GTC (direct fetch), RBI/MeitY news reports. Secondary sources: vendor comparison blogs, forum discussions. PayU Schedule B and EaseBuzz's specific prohibited list were not accessible publicly and require direct contact with merchant support.*
