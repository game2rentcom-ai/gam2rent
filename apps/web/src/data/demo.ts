import type { Listing, RentalOffer, Review } from "../types/listing";

// ILLUSTRATIVE DEMO DATA — not real inventory, prices, or customer reviews.
//
// This exists only so the site can be previewed with a realistic-looking storefront before the
// real database is connected. It is used ONLY when `VITE_DEMO_DATA=true`, or automatically during
// local `npm run dev` (see data/DataProvider.tsx). A production build with neither demo mode nor
// a configured database shows honest empty states instead — never these numbers. When demo data
// is active in a built deployment, a visible "demo data" banner is shown (components/Layout.tsx),
// so nobody can mistake these prices or reviews for real ones.
//
// The prices were never the founder's real prices, and the reviews were never written by real
// customers. Do not copy anything from here into real data.
export const demoListings: Listing[] = [
  { catalogId: "gta-5", platform: "ps4", price: 499, credentialType: "id_password", isAvailable: true, isFeatured: true, deliveryEtaMinutes: 45 },
  { catalogId: "spider-man-2", platform: "ps5", price: 599, credentialType: "id_password", isAvailable: true, isFeatured: true, deliveryEtaMinutes: 30 },
  { catalogId: "black-myth-wukong", platform: "pc", price: 1499, credentialType: "qr_code", isAvailable: true, isFeatured: true, deliveryEtaMinutes: 60 },
  { catalogId: "elden-ring", platform: "pc", price: 899, credentialType: "qr_code", isAvailable: true, isFeatured: false, deliveryEtaMinutes: 60 },
  { catalogId: "god-of-war", platform: "ps4", price: 799, credentialType: "id_password", isAvailable: true, isFeatured: false, deliveryEtaMinutes: 40 },
  { catalogId: "cyberpunk-2077", platform: "cloud", price: 349, credentialType: "qr_code", isAvailable: true, isFeatured: true, deliveryEtaMinutes: 20 },
  { catalogId: "ea-sports-fc", platform: "ps4", price: 649, credentialType: "id_password", isAvailable: false, isFeatured: false, deliveryEtaMinutes: 45 },
  { catalogId: "red-dead-redemption-2", platform: "pc", price: 999, credentialType: "id_password", isAvailable: true, isFeatured: false, deliveryEtaMinutes: 50 },
];

// Illustrative rental plans, shown for every game in demo mode only. Real rental prices are entered
// by the owner in the admin panel; they exist nowhere else.
export const demoRentalPlans: RentalOffer[] = [
  { planId: "demo-1", label: "1 day", days: 1, isPopular: false, price: 79 },
  { planId: "demo-3", label: "3 days", days: 3, isPopular: true, tag: "Weekend", price: 199 },
  { planId: "demo-7", label: "7 days", days: 7, isPopular: false, price: 399 },
];

export const demoReviews: Review[] = [
  { id: "demo-1", gameId: "gta-5", rating: 5, comment: "Fast delivery, everything worked great." },
  { id: "demo-2", gameId: "gta-5", rating: 4, comment: "All good, took about 40 minutes." },
  { id: "demo-3", gameId: "spider-man-2", rating: 5, comment: "Loved it, no issues at all." },
  { id: "demo-4", gameId: "elden-ring", rating: 5, comment: "Exactly as described." },
  { id: "demo-5", gameId: "elden-ring", rating: 5, comment: "Delivered within the hour, smooth." },
  { id: "demo-6", gameId: "elden-ring", rating: 3, comment: "Good but took a bit longer than expected." },
  { id: "demo-7", gameId: "god-of-war", rating: 4, comment: "Great game, clean setup." },
  { id: "demo-8", gameId: "ea-sports-fc", rating: 5, comment: "Perfect, will come back for more." },
];
