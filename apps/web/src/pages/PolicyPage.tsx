import { useParams } from "react-router-dom";

const TITLES: Record<string, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  refund: "Refund & Replacement Policy",
  shipping: "Delivery Times",
};

// Deliberately NOT drafting real legal copy here — Terms/Privacy/Refund/Shipping text needs to
// be written for real (and must accurately state the actual delivery window, per the Razorpay
// research notes) before payments go live. This route exists now so the footer links work and
// the layout doesn't need rework later, not to stand in as the actual policy.
export function PolicyPage() {
  const { slug } = useParams();
  const title = (slug && TITLES[slug]) ?? "Policy";

  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <h1 className="font-display text-xl font-bold text-text-primary">{title}</h1>
      <p className="mt-3 text-sm text-text-muted">
        This policy is being finalised and will be published here before launch.
      </p>
    </div>
  );
}
