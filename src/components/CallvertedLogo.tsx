interface Props {
  className?: string;
  /** Unique per instance — SVG gradient ids must not collide when the mark
   * is rendered more than once on the same page (nav + footer). */
  gradientId?: string;
}

/** Callverted brand mark: a call arc + signal bars in the brand blue on a
 * white rounded tile. Shared between the marketing site and the dashboard
 * nav so both use the same source of truth for the logo. */
export function CallvertedLogo({ className = "", gradientId = "cvLogoGrad" }: Props) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Callverted">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="40" fill="white" />
      <path
        d="M145 100C145 124.853 124.853 145 100 145C75.1472 145 55 124.853 55 100C55 75.1472 75.1472 55 100 55"
        stroke={`url(#${gradientId})`}
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="92" y="85" width="16" height="30" rx="8" fill={`url(#${gradientId})`} />
      <rect x="118" y="92" width="16" height="16" rx="8" fill={`url(#${gradientId})`} opacity="0.8" />
      <rect x="66" y="92" width="16" height="16" rx="8" fill={`url(#${gradientId})`} opacity="0.6" />
    </svg>
  );
}
