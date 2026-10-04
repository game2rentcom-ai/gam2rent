/** A home-page slide the owner sets up in Admin → Announcements (a new game, an offer). */
export interface Announcement {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  button?: { label: string; href: string };
  startsAt?: number; // ms; the database already hides slides outside their dates, this keeps a long-open tab honest
  endsAt?: number;
  countdownTo?: number;
}

export const isLive = (a: Announcement, now: number) => (a.startsAt === undefined || a.startsAt <= now) && (a.endsAt === undefined || a.endsAt > now);
