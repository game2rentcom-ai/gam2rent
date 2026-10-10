import { lazy, Suspense } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Loading } from "./kit";

// The owner's control panel. Everything the storefront shows — games, descriptions, photos, prices,
// rental plans, settings — is edited here and stored in the database.
const page = <T extends Record<string, React.ComponentType>>(load: () => Promise<T>, name: keyof T) => lazy(() => load().then((m) => ({ default: m[name] })));
const DashboardPage = page(() => import("./pages/DashboardPage"), "DashboardPage");
const AdminOrdersPage = page(() => import("./pages/AdminOrdersPage"), "AdminOrdersPage");
const AdminOrderPage = page(() => import("./pages/AdminOrderPage"), "AdminOrderPage");
const CouponsPage = page(() => import("./pages/CouponsPage"), "CouponsPage");
const AdminSupportPage = page(() => import("./pages/AdminSupportPage"), "AdminSupportPage");
const AdminTicketPage = page(() => import("./pages/AdminTicketPage"), "AdminTicketPage");
const AdminCommentsPage = page(() => import("./pages/AdminCommentsPage"), "AdminCommentsPage");
const AdminRequestsPage = page(() => import("./pages/AdminRequestsPage"), "AdminRequestsPage");
const GamesPage = page(() => import("./pages/GamesPage"), "GamesPage");
const GameEditPage = page(() => import("./pages/GameEditPage"), "GameEditPage");
const PricingPage = page(() => import("./pages/PricingPage"), "PricingPage");
const AnnouncementsPage = page(() => import("./pages/AnnouncementsPage"), "AnnouncementsPage");
const ReviewsPage = page(() => import("./pages/ReviewsPage"), "ReviewsPage");
const SettingsPage = page(() => import("./pages/SettingsPage"), "SettingsPage");
const AuditPage = page(() => import("./pages/AuditPage"), "AuditPage");
const TeamPage = page(() => import("./pages/TeamPage"), "TeamPage");

const TABS = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/support", label: "Support" },
  { to: "/admin/games", label: "Games" },
  { to: "/admin/pricing", label: "Pricing" },
  { to: "/admin/coupons", label: "Coupons" },
  { to: "/admin/announcements", label: "Announcements" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/comments", label: "Comments" },
  { to: "/admin/requests", label: "Requests" },
  { to: "/admin/team", label: "Team" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/audit", label: "History" },
];

export function AdminApp() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = TABS.find((t) => (t.end ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/")))?.to ?? TABS[0]!.to;

  return (
    <div className="flex flex-col gap-6">
      {/* Mobile: select dropdown */}
      <div className="md:hidden">
        <select
          value={activeTab}
          onChange={(e) => navigate(e.target.value)}
          aria-label="Admin section"
          className="field w-full font-display font-bold"
        >
          {TABS.map((t) => (
            <option key={t.to} value={t.to}>{t.label}</option>
          ))}
        </select>
      </div>
      {/* Desktop: horizontal tab bar */}
      <nav aria-label="Admin" className="no-scrollbar -mx-4 hidden gap-1 overflow-x-auto border-b border-border-strong px-4 md:flex sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex min-h-11 shrink-0 items-center border-b-2 px-4 font-display text-sm font-bold tracking-wide transition-colors ${isActive ? "border-accent-400 text-text-primary" : "border-transparent text-text-muted hover:text-text-primary"}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="support" element={<AdminSupportPage />} />
          <Route path="support/:id" element={<AdminTicketPage />} />
          <Route path="comments" element={<AdminCommentsPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="games/new" element={<GameEditPage />} />
          <Route path="games/:id" element={<GameEditPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="*" element={<DashboardPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}
