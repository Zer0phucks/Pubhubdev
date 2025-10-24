interface PubHubLogoProps {
  className?: string;
  showText?: boolean;
}

export function PubHubLogo({ className = "", showText = true }: PubHubLogoProps) {
  if (!showText) {
    // Icon-only version for favicon
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#14b8a6', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect
          x="10"
          y="25"
          width="80"
          height="50"
          rx="8"
          fill="url(#logoGradient)"
        />
        <text
          x="50"
          y="63"
          fontFamily="Arial, sans-serif"
          fontSize="36"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          Ph
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 200 60"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#14b8a6', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* "Pub" text in gradient */}
      <text
        x="10"
        y="42"
        fontFamily="Arial, sans-serif"
        fontSize="40"
        fontWeight="bold"
        fill="url(#hubGradient)"
        letterSpacing="-1"
      >
        Pub
      </text>
      
      {/* Rounded rectangle background for "hub" */}
      <rect
        x="84"
        y="4"
        width="90"
        height="46"
        rx="8"
        fill="url(#hubGradient)"
      />
      
      {/* "hub" text in white on gradient background (lowercase) */}
      <text
        x="129"
        y="39"
        fontFamily="Arial, sans-serif"
        fontSize="40"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
        letterSpacing="-1"
      >
        hub
      </text>
    </svg>
  );
}
