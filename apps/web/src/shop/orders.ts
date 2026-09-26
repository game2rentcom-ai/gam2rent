// The shapes of an order as the database returns it, and the plain-language wording for its status —
// shared by the customer's order screens and the owner's.

export type OrderStatus = "pending_payment" | "paid" | "in_progress" | "delivered" | "cancelled" | "refunded";

export interface Order {
  id: string;
  user_id: string;
  receipt_no: string | null;
  status: OrderStatus;
  payment_source: "razorpay" | "manual" | "free";
  subtotal: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  game_id: string;
  title: string;
  platform: string;
  kind: "buy" | "rent";
  plan_label: string | null;
  rental_days: number | null;
  unit_price: number;
  credential_type: "id_password" | "qr_code" | null;
  eta_minutes: number | null;
  delivery_status: "pending" | "delivered";
  delivered_at: string | null;
  rental_starts_at: string | null;
  rental_ends_at: string | null;
  rental_returned_at: string | null;
}

export const STATUS_LABEL: Record<OrderStatus, { label: string; tone: "neutral" | "brand" | "trust" | "warn" }> = {
  pending_payment: { label: "Waiting for payment", tone: "warn" },
  paid: { label: "Paid", tone: "brand" },
  in_progress: { label: "Being prepared", tone: "brand" },
  delivered: { label: "Delivered", tone: "trust" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export const shortId = (id: string) => id.slice(0, 8).toUpperCase();
export const orderName = (o: Pick<Order, "receipt_no" | "id">) => o.receipt_no ?? `#${shortId(o.id)}`;
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
export const formatDateTime = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
