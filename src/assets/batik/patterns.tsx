// Batik-inspired SVG patterns as React components
// Traditional Malaysian batik motifs simplified for UI decoration

export function BatikBackground({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.04">
      <pattern id="batik-bg" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        {/* Paisley-inspired motif */}
        <path d="M50 10c-15 0-25 15-25 30s10 30 25 30 25-15 25-30S65 10 50 10z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="50" cy="35" r="8" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="50" cy="35" r="3" fill="currentColor" />
        {/* Corner florals */}
        <circle cx="0" cy="0" r="12" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="100" cy="0" r="12" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="0" cy="100" r="12" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="100" cy="100" r="12" stroke="currentColor" strokeWidth="1" fill="none" />
        {/* Connecting lines */}
        <path d="M12 0h76M12 100h76M0 12v76M100 12v76" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
      </pattern>
      <rect width="200" height="200" fill="url(#batik-bg)" />
    </svg>
  )
}

export function BatikDivider({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="100%" height="12" viewBox="0 0 400 12" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 6h120" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      {/* Center diamond motif */}
      <path d="M140 6l10-5 10 5-10 5z" fill="currentColor" opacity="0.15" />
      <circle cx="160" cy="6" r="2" fill="currentColor" opacity="0.2" />
      <path d="M170 6l10-5 10 5-10 5z" fill="currentColor" opacity="0.15" />
      <circle cx="200" cy="6" r="3" fill="currentColor" opacity="0.1" />
      <path d="M210 6l10-5 10 5-10 5z" fill="currentColor" opacity="0.15" />
      <circle cx="240" cy="6" r="2" fill="currentColor" opacity="0.2" />
      <path d="M250 6l10-5 10 5-10 5z" fill="currentColor" opacity="0.15" />
      <path d="M280 6h120" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
    </svg>
  )
}

export function BatikCorner({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0c0 33.137 26.863 60 60 60" stroke="currentColor" strokeWidth="1" opacity="0.1" />
      <path d="M0 0c0 22.091 17.909 40 40 40" stroke="currentColor" strokeWidth="1" opacity="0.08" />
      <path d="M0 0c0 11.046 8.954 20 20 20" stroke="currentColor" strokeWidth="1" opacity="0.06" />
      {/* Small floral dots */}
      <circle cx="15" cy="15" r="2" fill="currentColor" opacity="0.1" />
      <circle cx="30" cy="25" r="1.5" fill="currentColor" opacity="0.08" />
      <circle cx="20" cy="35" r="1" fill="currentColor" opacity="0.06" />
    </svg>
  )
}

export function BatikHeroOverlay({ className = '' }: { className?: string }) {
  return (
    <svg className={`absolute inset-0 w-full h-full ${className}`} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="batik-hero" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          {/* Simplified batik flower */}
          <circle cx="40" cy="40" r="15" stroke="white" strokeWidth="0.5" opacity="0.08" />
          <circle cx="40" cy="40" r="8" stroke="white" strokeWidth="0.5" opacity="0.06" />
          <circle cx="40" cy="40" r="3" fill="white" opacity="0.05" />
          {/* Petals */}
          <ellipse cx="40" cy="20" rx="4" ry="8" stroke="white" strokeWidth="0.5" opacity="0.05" />
          <ellipse cx="40" cy="60" rx="4" ry="8" stroke="white" strokeWidth="0.5" opacity="0.05" />
          <ellipse cx="20" cy="40" rx="8" ry="4" stroke="white" strokeWidth="0.5" opacity="0.05" />
          <ellipse cx="60" cy="40" rx="8" ry="4" stroke="white" strokeWidth="0.5" opacity="0.05" />
          {/* Corner dots */}
          <circle cx="0" cy="0" r="2" fill="white" opacity="0.04" />
          <circle cx="80" cy="0" r="2" fill="white" opacity="0.04" />
          <circle cx="0" cy="80" r="2" fill="white" opacity="0.04" />
          <circle cx="80" cy="80" r="2" fill="white" opacity="0.04" />
        </pattern>
      </defs>
      <rect width="400" height="200" fill="url(#batik-hero)" />
    </svg>
  )
}

export function BatikNavRing({ className = '' }: { className?: string }) {
  return (
    <svg className={`absolute inset-0 w-full h-full ${className}`} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Decorative ring around center nav icon */}
      <circle cx="30" cy="30" r="29" stroke="currentColor" strokeWidth="0.5" opacity="0.15" strokeDasharray="3 3" />
      {/* Four corner petals */}
      <circle cx="30" cy="4" r="2" fill="currentColor" opacity="0.1" />
      <circle cx="30" cy="56" r="2" fill="currentColor" opacity="0.1" />
      <circle cx="4" cy="30" r="2" fill="currentColor" opacity="0.1" />
      <circle cx="56" cy="30" r="2" fill="currentColor" opacity="0.1" />
    </svg>
  )
}
