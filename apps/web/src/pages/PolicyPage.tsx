import { Link, useParams } from "react-router-dom";
import { POLICIES, POLICIES_UPDATED, type PolicyBlock } from "../data/policies";
import { useStore } from "../data/store";
import { usePageMeta } from "../lib/pageMeta";
import { formatPhone } from "../lib/phone";
import { NotFoundPage } from "./NotFoundPage";

// The legal pages. Their words live in data/policies.ts; the business details in them come from
// Admin → Settings, so they are always the ones the owner has saved.
type Details = Record<string, string | undefined>;

const FALLBACK: Details = { name: "this store", officer: "the store owner", email: "the address on our Contact us page" };

/** Fills {name}, {email}… in a line. With `only`, a line that mentions a detail we don't have is left out. */
function fill(text: string, details: Details, only = false): string | null {
  let missing = false;
  const filled = text.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = details[key] ?? (only ? undefined : FALLBACK[key]);
    if (value === undefined) missing = true;
    return value ?? "";
  });
  return only && missing ? null : filled;
}

function Block({ block, details, only }: { block: PolicyBlock; details: Details; only: boolean }) {
  const paragraphs = (block.paragraphs ?? []).map((t) => fill(t, details, only)).filter((t): t is string => t !== null);
  const bullets = (block.bullets ?? []).map((t) => fill(t, details, only)).filter((t): t is string => t !== null);
  const closing = (block.closing ?? []).map((t) => fill(t, details, only)).filter((t): t is string => t !== null);
  if (paragraphs.length + bullets.length + closing.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold text-text-primary">{block.heading}</h2>
      {paragraphs.map((t) => <p key={t} className="text-sm leading-relaxed text-text-muted">{t}</p>)}
      {bullets.length > 0 && <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-brand-400">{bullets.map((t) => <li key={t}>{t}</li>)}</ul>}
      {closing.map((t) => <p key={t} className="text-sm leading-relaxed text-text-muted">{t}</p>)}
    </section>
  );
}

export function PolicyPage() {
  const { slug = "" } = useParams();
  const { setting } = useStore();
  const policy = Object.hasOwn(POLICIES, slug) ? POLICIES[slug] : undefined; // not "constructor" and the like
  usePageMeta(policy ? policy.title : "Page not found", policy?.summary);
  if (!policy) return <NotFoundPage />;

  const phone = setting("contact_whatsapp");
  const details: Details = {
    name: setting("business_name"),
    address: setting("business_address"),
    gstin: setting("gstin"),
    email: setting("support_email"),
    officer: setting("grievance_officer"),
    phone: phone ? formatPhone(phone) : undefined,
  };
  // The contact page lists only what the owner has actually entered; the other pages read naturally without a detail.
  const only = slug === "contact";

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-4 sm:py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold text-text-primary">{policy.title}</h1>
        <p className="text-xs text-text-muted">Last updated {POLICIES_UPDATED}</p>
        <p className="text-sm leading-relaxed text-text-muted">{policy.summary}</p>
      </header>
      {policy.blocks.map((block) => <Block key={block.heading} block={block} details={details} only={only} />)}
      <nav aria-label="Other policies" className="flex flex-wrap gap-x-4 border-t border-border-subtle pt-4 text-sm">
        {Object.entries(POLICIES).filter(([key]) => key !== slug).map(([key, other]) => (
          <Link key={key} to={`/policies/${key}`} className="flex min-h-11 items-center font-semibold text-brand-400 hover:underline">{other.title}</Link>
        ))}
      </nav>
    </article>
  );
}
