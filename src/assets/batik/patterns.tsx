// Malaysian batik-inspired SVG patterns — visible, bold, Malaysia Airlines style
// Uses traditional motifs: bunga (flowers), pucuk rebung (bamboo shoots), clouds

export function BatikBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="batik-bg-main" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            {/* Central bunga (flower) */}
            <circle cx="60" cy="60" r="20" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.07" />
            <circle cx="60" cy="60" r="12" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.06" />
            <circle cx="60" cy="60" r="5" fill="currentColor" opacity="0.05" />
            {/* 8-petal flower */}
            <ellipse cx="60" cy="38" rx="5" ry="10" fill="currentColor" opacity="0.04" />
            <ellipse cx="60" cy="82" rx="5" ry="10" fill="currentColor" opacity="0.04" />
            <ellipse cx="38" cy="60" rx="10" ry="5" fill="currentColor" opacity="0.04" />
            <ellipse cx="82" cy="60" rx="10" ry="5" fill="currentColor" opacity="0.04" />
            <ellipse cx="44" cy="44" rx="7" ry="4" transform="rotate(-45 44 44)" fill="currentColor" opacity="0.03" />
            <ellipse cx="76" cy="44" rx="7" ry="4" transform="rotate(45 76 44)" fill="currentColor" opacity="0.03" />
            <ellipse cx="44" cy="76" rx="7" ry="4" transform="rotate(45 44 76)" fill="currentColor" opacity="0.03" />
            <ellipse cx="76" cy="76" rx="7" ry="4" transform="rotate(-45 76 76)" fill="currentColor" opacity="0.03" />
            {/* Pucuk rebung (bamboo shoot) corner motifs */}
            <path d="M0 0L15 0L0 15Z" fill="currentColor" opacity="0.05" />
            <path d="M120 0L105 0L120 15Z" fill="currentColor" opacity="0.05" />
            <path d="M0 120L15 120L0 105Z" fill="currentColor" opacity="0.05" />
            <path d="M120 120L105 120L120 105Z" fill="currentColor" opacity="0.05" />
            {/* Connecting swirl lines */}
            <path d="M15 0Q30 30 60 30" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.04" />
            <path d="M105 0Q90 30 60 30" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.04" />
            <path d="M0 15Q30 30 30 60" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.04" />
            <path d="M120 15Q90 30 90 60" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.04" />
            {/* Diamond dots between flowers */}
            <rect x="0" y="58" width="4" height="4" transform="rotate(45 2 60)" fill="currentColor" opacity="0.05" />
            <rect x="116" y="58" width="4" height="4" transform="rotate(45 118 60)" fill="currentColor" opacity="0.05" />
            <rect x="58" y="0" width="4" height="4" transform="rotate(45 60 2)" fill="currentColor" opacity="0.05" />
            <rect x="58" y="116" width="4" height="4" transform="rotate(45 60 118)" fill="currentColor" opacity="0.05" />
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#batik-bg-main)" />
      </svg>
    </div>
  )
}

export function BatikDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 py-2 ${className}`}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary-300/30 to-transparent" />
      <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="text-primary-400">
        <path d="M12 0L16 6L12 12L8 6Z" fill="currentColor" opacity="0.3" />
        <circle cx="4" cy="6" r="2" fill="currentColor" opacity="0.2" />
        <circle cx="20" cy="6" r="2" fill="currentColor" opacity="0.2" />
      </svg>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary-300/30 to-transparent" />
    </div>
  )
}

export function BatikHeroOverlay({ className = '' }: { className?: string }) {
  return (
    <svg className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="batik-hero-p" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          {/* Bold flower */}
          <circle cx="50" cy="50" r="22" stroke="white" strokeWidth="1" fill="none" opacity="0.12" />
          <circle cx="50" cy="50" r="14" stroke="white" strokeWidth="0.8" fill="none" opacity="0.1" />
          <circle cx="50" cy="50" r="6" fill="white" opacity="0.08" />
          {/* Petals */}
          <ellipse cx="50" cy="24" rx="6" ry="12" fill="white" opacity="0.06" />
          <ellipse cx="50" cy="76" rx="6" ry="12" fill="white" opacity="0.06" />
          <ellipse cx="24" cy="50" rx="12" ry="6" fill="white" opacity="0.06" />
          <ellipse cx="76" cy="50" rx="12" ry="6" fill="white" opacity="0.06" />
          {/* Diagonal petals */}
          <ellipse cx="32" cy="32" rx="8" ry="4" transform="rotate(-45 32 32)" fill="white" opacity="0.04" />
          <ellipse cx="68" cy="32" rx="8" ry="4" transform="rotate(45 68 32)" fill="white" opacity="0.04" />
          <ellipse cx="32" cy="68" rx="8" ry="4" transform="rotate(45 32 68)" fill="white" opacity="0.04" />
          <ellipse cx="68" cy="68" rx="8" ry="4" transform="rotate(-45 68 68)" fill="white" opacity="0.04" />
          {/* Corner triangles (pucuk rebung) */}
          <path d="M0 0L12 0L0 12Z" fill="white" opacity="0.06" />
          <path d="M100 0L88 0L100 12Z" fill="white" opacity="0.06" />
          <path d="M0 100L12 100L0 88Z" fill="white" opacity="0.06" />
          <path d="M100 100L88 100L100 88Z" fill="white" opacity="0.06" />
        </pattern>
      </defs>
      <rect width="600" height="300" fill="url(#batik-hero-p)" />
    </svg>
  )
}

export function BatikBorder({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Top border strip */}
      <svg className="absolute top-0 left-0 w-full h-3" viewBox="0 0 400 12" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="batik-strip" x="0" y="0" width="24" height="12" patternUnits="userSpaceOnUse">
            <path d="M12 0L18 6L12 12L6 6Z" fill="currentColor" opacity="0.15" />
            <circle cx="0" cy="6" r="2" fill="currentColor" opacity="0.1" />
            <circle cx="24" cy="6" r="2" fill="currentColor" opacity="0.1" />
          </pattern>
        </defs>
        <rect width="400" height="12" fill="url(#batik-strip)" />
      </svg>
    </div>
  )
}

export function BatikNavRing({ active = false }: { active?: boolean }) {
  return (
    <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" stroke={active ? 'rgba(255,255,255,0.2)' : 'rgba(0,144,209,0.15)'} strokeWidth="1" strokeDasharray="4 3" />
      {/* 4 cardinal dots */}
      <circle cx="32" cy="3" r="2.5" fill={active ? 'rgba(255,255,255,0.25)' : 'rgba(0,144,209,0.2)'} />
      <circle cx="32" cy="61" r="2.5" fill={active ? 'rgba(255,255,255,0.25)' : 'rgba(0,144,209,0.2)'} />
      <circle cx="3" cy="32" r="2.5" fill={active ? 'rgba(255,255,255,0.25)' : 'rgba(0,144,209,0.2)'} />
      <circle cx="61" cy="32" r="2.5" fill={active ? 'rgba(255,255,255,0.25)' : 'rgba(0,144,209,0.2)'} />
      {/* 4 diagonal dots */}
      <circle cx="11" cy="11" r="1.5" fill={active ? 'rgba(255,255,255,0.15)' : 'rgba(0,144,209,0.12)'} />
      <circle cx="53" cy="11" r="1.5" fill={active ? 'rgba(255,255,255,0.15)' : 'rgba(0,144,209,0.12)'} />
      <circle cx="11" cy="53" r="1.5" fill={active ? 'rgba(255,255,255,0.15)' : 'rgba(0,144,209,0.12)'} />
      <circle cx="53" cy="53" r="1.5" fill={active ? 'rgba(255,255,255,0.15)' : 'rgba(0,144,209,0.12)'} />
    </svg>
  )
}

export function BatikCardAccent({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute top-0 right-0 w-20 h-20 pointer-events-none overflow-hidden rounded-tr-2xl ${className}`}>
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-primary-500">
        <circle cx="80" cy="0" r="40" stroke="currentColor" strokeWidth="0.8" opacity="0.08" />
        <circle cx="80" cy="0" r="28" stroke="currentColor" strokeWidth="0.6" opacity="0.06" />
        <circle cx="80" cy="0" r="16" fill="currentColor" opacity="0.03" />
        <path d="M80 0L68 0L80 12Z" fill="currentColor" opacity="0.06" />
      </svg>
    </div>
  )
}
