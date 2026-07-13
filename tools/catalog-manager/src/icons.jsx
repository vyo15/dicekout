function Icon({ children, className = "" }) {
  return <svg className={`nav-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

export function ProductsIcon() { return <Icon><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></Icon>; }
export function PlusIcon() { return <Icon><path d="M12 5v14M5 12h14"/></Icon>; }
export function DraftIcon() { return <Icon><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></Icon>; }
export function ReviewIcon() { return <Icon><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8.5 11l1.7 1.7 3.5-3.8"/></Icon>; }
export function LocalIcon() { return <Icon><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></Icon>; }
export function SearchIcon() { return <Icon><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></Icon>; }
export function BackIcon() { return <Icon><path d="m15 18-6-6 6-6"/></Icon>; }
