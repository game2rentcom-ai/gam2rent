import { Button } from "../ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="font-display text-7xl font-black text-gradient-brand sm:text-8xl">404</p>
      <h1 className="font-display text-xl font-bold text-text-primary sm:text-2xl">Page not found</h1>
      <p className="max-w-md text-sm text-text-muted">The page you’re looking for doesn’t exist or has moved. Let’s get you back to the games.</p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        <Button to="/">Go home</Button>
        <Button to="/browse" variant="secondary">Browse games</Button>
      </div>
    </div>
  );
}
