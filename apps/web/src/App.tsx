import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams, useNavigationType } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAdmin, RequireAuth } from "./auth/guards";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { DataProvider } from "./data/DataProvider";
import { usePageMeta } from "./lib/pageMeta";
import { ShopProvider } from "./shop/ShopProvider";

// Every page is its own chunk: a visitor downloads only the page they open. Native scrolling, no
// animation library, no background effects — the app is quick on a mid-range phone. The account and
// admin screens (and the Supabase client behind them) are only fetched by people who use them.
const page = <T extends Record<string, React.ComponentType>>(load: () => Promise<T>, name: keyof T) => lazy(() => load().then((m) => ({ default: m[name] })));

const HomePage = page(() => import("./pages/HomePage"), "HomePage");
const BrowsePage = page(() => import("./pages/BrowsePage"), "BrowsePage");
const GameDetailPage = page(() => import("./pages/GameDetailPage"), "GameDetailPage");
const PolicyPage = page(() => import("./pages/PolicyPage"), "PolicyPage");
const NotFoundPage = page(() => import("./pages/NotFoundPage"), "NotFoundPage");
const LoginPage = page(() => import("./auth/LoginPage"), "LoginPage");
const SignupPage = page(() => import("./auth/SignupPage"), "SignupPage");
const ForgotPasswordPage = page(() => import("./auth/ForgotPasswordPage"), "ForgotPasswordPage");
const ResetPasswordPage = page(() => import("./auth/ResetPasswordPage"), "ResetPasswordPage");
const WelcomePage = page(() => import("./auth/WelcomePage"), "WelcomePage");
const AccountPage = page(() => import("./account/AccountPage"), "AccountPage");
const OrdersPage = page(() => import("./account/OrdersPage"), "OrdersPage");
const OrderPage = page(() => import("./account/OrderPage"), "OrderPage");
const WishlistPage = page(() => import("./account/WishlistPage"), "WishlistPage");
const CartPage = page(() => import("./shop/CartPage"), "CartPage");
const SupportPage = page(() => import("./account/SupportPage"), "SupportPage");
const TicketPage = page(() => import("./account/TicketPage"), "TicketPage");
const RequestsPage = page(() => import("./community/RequestsPage"), "RequestsPage");
const AdminApp = page(() => import("./admin/AdminApp"), "AdminApp");
const LearnPage = page(() => import("./pages/LearnPage"), "LearnPage");

function PageFallback() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-52 shimmer rounded-lg" />
      <div className="no-scrollbar flex gap-3 overflow-x-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex w-36 shrink-0 flex-col gap-2 sm:w-44">
            <div className="shimmer rounded-lg" style={{ aspectRatio: "2/3" }} />
            <div className="h-4 shimmer rounded" />
            <div className="h-3 w-3/4 shimmer rounded" />
          </div>
        ))}
      </div>
      <div className="h-56 shimmer rounded-2xl" />
    </div>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const type = useNavigationType();
  return (
    <div key={type === "POP" ? undefined : pathname} className="page-enter">
      {children}
    </div>
  );
}

// Old links used /game/:id; keep them working.
function LegacyGameRedirect() {
  const { id } = useParams();
  return <Navigate to={`/games/${id}`} replace />;
}

// The tab title for pages that don't need any data to name themselves; the game and policy pages set their own.
const TITLES: Record<string, string> = {
  "/browse": "Browse games", "/login": "Log in", "/signup": "Create an account", "/forgot": "Reset your password",
  "/reset": "Choose a new password", "/welcome": "Welcome", "/account": "My account", "/account/orders": "My orders",
  "/account/wishlist": "My wishlist", "/account/support": "Support", "/cart": "Your cart", "/requests": "Game requests",
};

function RouteMeta() {
  const { pathname } = useLocation();
  const own = pathname.startsWith("/games/") || pathname.startsWith("/policies/");
  usePageMeta(
    own ? null
    : pathname === "/" ? undefined
    : pathname.startsWith("/account/orders/") ? "Order"
    : pathname.startsWith("/account/support/") ? "Support ticket"
    : pathname.startsWith("/admin") ? "Admin"
    : TITLES[pathname] ?? "Page not found",
  );
  return null;
}

// A failure inside one page shows a message there and keeps the header and menu; going to another page clears it.
function GuardedRoutes({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary resetKey={useLocation().pathname}>{children}</ErrorBoundary>;
}

// The main app shell: header, footer, page transitions. Standalone routes (e.g. /learn) bypass this.
function AppShell() {
  return (
    <Layout>
      <GuardedRoutes>
        <PageTransition>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </GuardedRoutes>
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary whole>
      <DataProvider>
        <AuthProvider>
          <ShopProvider>
            <BrowserRouter>
              <RouteMeta />
              <Routes>
                {/* Standalone pages — no gaming header/footer */}
                <Route path="/learn" element={<Suspense fallback={null}><LearnPage /></Suspense>} />

                {/* Main store — wrapped in the gaming Layout shell */}
                <Route element={<AppShell />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/browse" element={<BrowsePage />} />
                  <Route path="/games/:id" element={<GameDetailPage />} />
                  <Route path="/game/:id" element={<LegacyGameRedirect />} />
                  <Route path="/policies/:slug" element={<PolicyPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot" element={<ForgotPasswordPage />} />
                  <Route path="/reset" element={<ResetPasswordPage />} />
                  <Route path="/welcome" element={<WelcomePage />} />
                  <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
                  <Route path="/account/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
                  <Route path="/account/orders/:id" element={<RequireAuth><OrderPage /></RequireAuth>} />
                  <Route path="/account/wishlist" element={<RequireAuth><WishlistPage /></RequireAuth>} />
                  <Route path="/account/support" element={<RequireAuth><SupportPage /></RequireAuth>} />
                  <Route path="/account/support/:id" element={<RequireAuth><TicketPage /></RequireAuth>} />
                  <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
                  <Route path="/requests" element={<RequestsPage />} />
                  <Route path="/admin/*" element={<RequireAdmin><AdminApp /></RequireAdmin>} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ShopProvider>
        </AuthProvider>
      </DataProvider>
    </ErrorBoundary>
  );
}
