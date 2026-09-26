// The frame for sign-in, sign-up and password screens: one centred card, a heading, and a footer link.
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-6 sm:py-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-text-muted">{subtitle}</p>}
      </div>
      <div className="panel hud flex flex-col gap-4 p-5 sm:p-6">{children}</div>
      {footer && <p className="text-center text-sm text-text-muted">{footer}</p>}
    </div>
  );
}
