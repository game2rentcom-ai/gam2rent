import { Component, type ErrorInfo, type ReactNode } from "react";

// Without this, one rendering mistake anywhere blanks the whole page. It also catches a page whose code
// couldn't be downloaded (the phone lost signal, or a new version of the site went live while the tab was
// open). `resetKey` — the current route — clears the message when the visitor navigates elsewhere.
interface Props { children: ReactNode; resetKey?: string; whole?: boolean }
interface State { failed: boolean; key?: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, key: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.key ? { failed: false, key: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("A page failed to display", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className={`mx-auto flex max-w-md flex-col items-center gap-3 px-4 text-center ${this.props.whole ? "min-h-dvh justify-center" : "py-20"}`}>
        <h1 className="font-display text-2xl font-bold text-text-primary">Something went wrong</h1>
        <p className="text-sm text-text-muted">This page didn’t load properly. Reloading usually fixes it — if it keeps happening, message us and we’ll sort it out.</p>
        <button type="button" onClick={() => window.location.reload()} className="cut inline-flex min-h-11 items-center justify-center rounded-sm px-5 font-display text-sm font-bold tracking-wide btn-primary">Reload the page</button>
      </div>
    );
  }
}
