import { useState } from "react";
import { useAuth } from "../auth/context";
import { ok, useAction } from "../lib/api";
import { Button } from "../ui/Button";
import { Notice, TextAreaField } from "../ui/Form";
import { IconStar } from "../ui/icons";
import { Stars } from "../ui/Stars";

// A verified review: the database only accepts it from the customer the game was delivered to, once per
// item, and publishes it on the game's page under their first name.
export interface MyReview { order_item_id: string; rating: number; comment: string }

export function YourReview({ review }: { review: MyReview }) {
  return (
    <div className="mt-3 rounded-xl bg-bg-base p-3 text-sm print:hidden">
      <p className="flex items-center gap-2" aria-label={`Your rating: ${review.rating} out of 5`}>
        <Stars value={review.rating} />
        <span className="text-xs font-semibold text-text-muted">Your review is on the game’s page</span>
      </p>
      <p className="mt-1 text-text-muted">{review.comment}</p>
    </div>
  );
}

const REASONS: Record<string, string> = {
  not_reviewable: "You can review a game once it has been delivered to you.",
  already_reviewed: "You’ve already reviewed this game.",
  bad_comment: "Write a few words about it (up to 1,000 characters).",
};

export function ReviewForm({ itemId, onDone }: { itemId: string; onDone: () => void }) {
  const { client } = useAuth();
  const { busy, message, run } = useAction();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [problem, setProblem] = useState("");

  if (!open) return <div className="mt-3 print:hidden"><Button variant="ghost" onClick={() => setOpen(true)}>Leave a review</Button></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return setProblem("Tap the stars to rate it.");
    if (!comment.trim()) return setProblem("Write a few words about it.");
    setProblem("");
    const sent = await run(async () => {
      try {
        await ok((await client()).rpc("submit_review", { p_item: itemId, p_rating: rating, p_comment: comment.trim() }));
      } catch (e) {
        const raw = e instanceof Error ? e.message : "";
        const known = Object.keys(REASONS).find((k) => raw.includes(k));
        throw new Error(known ? REASONS[known] : "We couldn’t save your review right now. Please try again.");
      }
    }, "Thanks! Your review is on the game’s page.");
    if (sent) onDone();
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-3 rounded-xl border border-border-strong bg-bg-base p-3 print:hidden" noValidate aria-label="Review this game">
      {(problem || message) && <Notice tone={problem ? "error" : message!.tone}>{problem || message!.text}</Notice>}
      <div>
        <p className="mb-1 text-sm font-semibold text-text-primary">How was it?</p>
        <div role="radiogroup" aria-label="Rating" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} ${n === 1 ? "star" : "stars"}`} onClick={() => setRating(n)} className={`flex h-11 w-11 items-center justify-center rounded-lg transition-transform active:scale-90 ${n <= rating ? "text-rating-gold drop-shadow-[0_0_6px_rgb(255_197_61/0.5)]" : "text-white/25 hover:text-white/50"}`}>
              <IconStar className="h-7 w-7" />
            </button>
          ))}
        </div>
      </div>
      <TextAreaField label="Your review" hint="Only customers who received the game can review it." value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Post review"}</Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
