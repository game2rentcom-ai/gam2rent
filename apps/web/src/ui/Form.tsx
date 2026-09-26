import { useId, useState } from "react";
import { IconCheck } from "./icons";

// Form building blocks. Every field has a real <label>, errors are announced and tied to their input,
// and every control is at least 44 px tall. Text is 16 px so iPhones don't zoom in on focus.
export const inputClass = "field";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => React.ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-text-primary">{label}</label>
      {children({ id, describedBy: [hintId, errorId].filter(Boolean).join(" ") || undefined, invalid: Boolean(error) })}
      {hint && !error && <p id={hintId} className="text-xs text-text-muted">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-xs font-medium text-red-300">{error}</p>}
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className"> & { label: string; hint?: string; error?: string };

export function TextField({ label, hint, error, ...rest }: InputProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={inputClass} {...rest} />}
    </Field>
  );
}

export function PasswordField({ label, hint, error, ...rest }: InputProps) {
  const [shown, setShown] = useState(false);
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={`${inputClass} pr-16`} {...rest} type={shown ? "text" : "password"} />
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-pressed={shown}
            className="absolute right-0 top-0 flex h-11 min-w-14 items-center justify-center px-3 text-sm font-semibold text-text-muted hover:text-text-primary"
          >
            {shown ? "Hide" : "Show"}
          </button>
        </div>
      )}
    </Field>
  );
}

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> & { label: string; hint?: string; error?: string };
export function SelectField({ label, hint, error, children, ...rest }: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => <select id={id} aria-describedby={describedBy} aria-invalid={invalid} className={inputClass} {...rest}>{children}</select>}
    </Field>
  );
}

type AreaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> & { label: string; hint?: string; error?: string };
export function TextAreaField({ label, hint, error, ...rest }: AreaProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => <textarea id={id} aria-describedby={describedBy} aria-invalid={invalid} className={`${inputClass} min-h-28 py-2.5`} {...rest} />}
    </Field>
  );
}

/** A big, easy-to-tap checkbox or toggle row with its label. */
export function CheckboxField({ label, ...rest }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "children"> & { label: React.ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-sm text-text-primary">
      <input type="checkbox" className="check mt-0.5" {...rest} />
      <span className="pt-0.5">{label}</span>
    </label>
  );
}

export function Notice({ tone = "info", children, onRetry }: { tone?: "info" | "success" | "error"; children: React.ReactNode; onRetry?: () => void }) {
  const tones = {
    info: "border-border-strong border-l-accent-400 bg-bg-surface text-text-muted",
    success: "border-trust-300 border-l-trust-600 bg-trust-100 text-trust-600",
    error: "border-red-400/40 border-l-red-400 bg-red-400/10 text-red-200",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border border-l-4 px-4 py-3 text-sm ${tones[tone]}`}>
      {tone === "success" && <IconCheck className="mt-0.5 h-5 w-5 shrink-0" />}
      <div>
        {children}
        {onRetry && (
          <>
            {" "}
            <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center font-semibold underline">Try again</button>
          </>
        )}
      </div>
    </div>
  );
}
