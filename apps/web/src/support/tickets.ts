// Support requests ("tickets"): what the database returns and the wording for each state, shared by the
// customer's screens and the owner's.
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory = "order_issue" | "payment_question" | "general_question" | "other";

export interface Ticket {
  id: string;
  user_id: string;
  order_id: string | null;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  reason: string | null;
  resolution: string | null;
  created_at: string;
  last_message_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_role: "customer" | "admin";
  message: string;
  created_at: string;
}

export const TICKET_STATUS: Record<TicketStatus, { label: string; tone: "neutral" | "brand" | "trust" | "warn" }> = {
  open: { label: "Open", tone: "warn" },
  in_progress: { label: "We’re on it", tone: "brand" },
  resolved: { label: "Resolved", tone: "trust" },
  closed: { label: "Closed", tone: "neutral" },
};

export const CATEGORIES: [TicketCategory, string][] = [
  ["order_issue", "Problem with an order"],
  ["payment_question", "Payment question"],
  ["general_question", "General question"],
  ["other", "Something else"],
];
export const categoryLabel = (c: TicketCategory) => CATEGORIES.find(([value]) => value === c)?.[1] ?? "Request";

export const RESOLUTIONS: [string, string][] = [["pending", "Still deciding"], ["replacement", "Replacement"], ["refund", "Refund"], ["rejected", "Not approved"]];
export const REASONS: [string, string][] = [["not_working", "Login not working"], ["reclaimed", "Account taken back"], ["banned", "Account banned"], ["other", "Something else"]];
export const RESOLUTION_TEXT: Record<string, string> = { replacement: "We’re sending a replacement.", refund: "A refund was agreed.", rejected: "We couldn’t approve this request — see our reply." };

/** The database's messages, turned into something a person can read. */
export function ticketProblem(raw: string): string {
  if (raw.includes("slow_down")) return "You’re sending messages quickly. Please try again in a little while.";
  if (raw.includes("ticket_closed")) return "This request is closed. Open a new one if you still need help.";
  if (raw.includes("too_many_open_tickets")) return "You already have 10 open requests. Please wait for a reply first.";
  if (raw.includes("not_your_order")) return "That order isn’t on your account.";
  return "We couldn’t send that right now. Please try again.";
}
