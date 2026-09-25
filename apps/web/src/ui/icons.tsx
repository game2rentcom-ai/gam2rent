// Small inline icon set (24×24, stroke = currentColor). Inline so there is no extra request and they
// inherit text colour. Decorative by default: put a text label or aria-label on the parent control.
type P = { className?: string };
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const IconHome = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>);
export const IconGrid = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>);
export const IconSearch = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>);
export const IconHeart = ({ className = "h-6 w-6", filled = false }: P & { filled?: boolean }) => (<svg {...base} className={className} fill={filled ? "currentColor" : "none"}><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.7-8 11-8 11z" /></svg>);
export const IconCart = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.4a1 1 0 001 .8h9.6a1 1 0 001-.8L21 7H6" /></svg>);
export const IconUser = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>);
export const IconChat = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" /></svg>);
export const IconMenu = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><path d="M4 6h16M4 12h16M4 18h16" /></svg>);
export const IconClose = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IconFilter = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><path d="M4 6h16M7 12h10M10 18h4" /></svg>);
export const IconChevron = ({ className = "h-5 w-5" }: P) => (<svg {...base} className={className}><path d="M9 6l6 6-6 6" /></svg>);
export const IconChevronDown = ({ className = "h-5 w-5" }: P) => (<svg {...base} className={className}><path d="M6 9l6 6 6-6" /></svg>);
export const IconBack = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><path d="M15 6l-6 6 6 6" /></svg>);
export const IconStar = ({ className = "h-4 w-4" }: P) => (<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4l7.2-.8z" /></svg>);
export const IconCheck = ({ className = "h-5 w-5" }: P) => (<svg {...base} className={className}><path d="M5 12l5 5 9-10" /></svg>);
export const IconShield = ({ className = "h-6 w-6" }: P) => (<svg {...base} className={className}><path d="M12 3l8 3v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>);
export const IconClock = ({ className = "h-5 w-5" }: P) => (<svg {...base} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const IconPlay = ({ className = "h-5 w-5" }: P) => (<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>);
