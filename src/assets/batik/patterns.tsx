// Indonesian-style batik SVG patterns
// Inspired by: Kawung, Parang, Mega Mendung, and Truntum motifs
// Applied in blue color scheme for SewaKita

/**
 * Kawung-style repeating pattern — classic oval/diamond grid
 * Used as page backgrounds and card decorations
 */
export function BatikBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg className="w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="kawung" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            {/* Kawung center — 4 overlapping ovals */}
            <ellipse cx="30" cy="30" rx="12" ry="18" fill="currentColor" />
            <ellipse cx="30" cy="30" rx="18" ry="12" fill="currentColor" />
            <ellipse cx="30" cy="30" rx="12" ry="18" fill="#F7FAFC" />
            <ellipse cx="30" cy="30" rx="18" ry="12" fill="#F7FAFC" />
            <ellipse cx="30" cy="30" rx="10" ry="16" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <ellipse cx="30" cy="30" rx="16" ry="10" stroke="currentColor" strokeWidth="1.2" fill="none" />
            {/* Center dot cluster */}
            <circle cx="30" cy="30" r="4" fill="currentColor" />
            <circle cx="30" cy="30" r="2" fill="#F7FAFC" />
            {/* Corner kawung (shared with adjacent tiles) */}
            <ellipse cx="0" cy="0" rx="8" ry="12" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <ellipse cx="0" cy="0" rx="12" ry="8" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <ellipse cx="60" cy="0" rx="8" ry="12" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <ellipse cx="60" cy="0" rx="12" ry="8" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <ellipse cx="0" cy="60" rx="8" ry="12" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <ellipse cx="0" cy="60" rx="12" ry="8" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <ellipse cx="60" cy="60" rx="8" ry="12" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <ellipse cx="60" cy="60" rx="12" ry="8" stroke="currentColor" strokeWidth="0.8" fill="none" />
            {/* Tiny dots (titik batik) fill */}
            <circle cx="10" cy="10" r="1" fill="currentColor" />
            <circle cx="50" cy="10" r="1" fill="currentColor" />
            <circle cx="10" cy="50" r="1" fill="currentColor" />
            <circle cx="50" cy="50" r="1" fill="currentColor" />
            <circle cx="30" cy="8" r="0.8" fill="currentColor" />
            <circle cx="30" cy="52" r="0.8" fill="currentColor" />
            <circle cx="8" cy="30" r="0.8" fill="currentColor" />
            <circle cx="52" cy="30" r="0.8" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#kawung)" />
      </svg>
    </div>
  )
}

/**
 * Hero overlay — Mega Mendung (cloud swirl) style for gradient cards
 * White on transparent, visible on blue/dark backgrounds
 */
export function BatikHeroOverlay({ className = '' }: { className?: string }) {
  return (
    <svg className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="mega-mendung" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          {/* Mega Mendung — layered cloud/wave shapes */}
          <path d="M60 20 Q80 10 90 25 Q100 40 85 50 Q95 60 80 70 Q65 80 50 70 Q35 80 25 65 Q10 55 20 45 Q5 35 20 25 Q35 10 60 20Z"
            stroke="white" strokeWidth="1" fill="none" opacity="0.12" />
          <path d="M60 30 Q75 22 82 32 Q90 42 80 48 Q88 55 76 62 Q65 70 55 62 Q42 70 35 60 Q22 52 30 44 Q20 38 30 30 Q42 22 60 30Z"
            stroke="white" strokeWidth="0.8" fill="none" opacity="0.10" />
          <path d="M60 40 Q70 35 75 42 Q80 48 74 52 Q78 56 70 60 Q63 64 57 60 Q50 64 45 58 Q38 52 42 48 Q36 44 42 40 Q50 35 60 40Z"
            stroke="white" strokeWidth="0.6" fill="white" opacity="0.04" />
          {/* Center dot */}
          <circle cx="60" cy="50" r="3" fill="white" opacity="0.08" />
          {/* Kawung accents in corners */}
          <ellipse cx="0" cy="0" rx="10" ry="15" stroke="white" strokeWidth="0.6" fill="none" opacity="0.06" />
          <ellipse cx="0" cy="0" rx="15" ry="10" stroke="white" strokeWidth="0.6" fill="none" opacity="0.06" />
          <ellipse cx="120" cy="120" rx="10" ry="15" stroke="white" strokeWidth="0.6" fill="none" opacity="0.06" />
          <ellipse cx="120" cy="120" rx="15" ry="10" stroke="white" strokeWidth="0.6" fill="none" opacity="0.06" />
          {/* Titik (dots) scatter */}
          <circle cx="15" cy="90" r="1.2" fill="white" opacity="0.06" />
          <circle cx="105" cy="90" r="1.2" fill="white" opacity="0.06" />
          <circle cx="15" cy="30" r="1" fill="white" opacity="0.05" />
          <circle cx="105" cy="30" r="1" fill="white" opacity="0.05" />
          <circle cx="40" cy="100" r="1" fill="white" opacity="0.04" />
          <circle cx="80" cy="100" r="1" fill="white" opacity="0.04" />
          <circle cx="60" cy="10" r="1" fill="white" opacity="0.04" />
        </pattern>
      </defs>
      <rect width="600" height="300" fill="url(#mega-mendung)" />
    </svg>
  )
}

/**
 * Parang-style diagonal border strip
 * Used as decorative borders on cards
 */
export function BatikBorder({ className = '', position = 'top' }: { className?: string; position?: 'top' | 'bottom' }) {
  return (
    <div className={`absolute ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 h-2 overflow-hidden pointer-events-none ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 400 8" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`parang-${position}`} x="0" y="0" width="16" height="8" patternUnits="userSpaceOnUse">
            {/* Parang — diagonal s-curve knife edge */}
            <path d="M0 8 Q4 4 8 4 Q12 4 16 0" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2" />
            <path d="M0 8 Q4 6 8 6 Q12 6 16 0" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.1" />
            <circle cx="8" cy="4" r="1" fill="currentColor" opacity="0.15" />
          </pattern>
        </defs>
        <rect width="400" height="8" fill={`url(#parang-${position})`} />
      </svg>
    </div>
  )
}

/**
 * Truntum-style dot scatter divider
 */
export function BatikDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 py-3 ${className}`}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
      <svg width="40" height="16" viewBox="0 0 40 16" className="text-primary-500 shrink-0">
        {/* Truntum star/flower */}
        <circle cx="20" cy="8" r="3" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.3" />
        <circle cx="20" cy="8" r="1.5" fill="currentColor" opacity="0.25" />
        {/* Petals */}
        <circle cx="20" cy="3" r="1" fill="currentColor" opacity="0.2" />
        <circle cx="20" cy="13" r="1" fill="currentColor" opacity="0.2" />
        <circle cx="15" cy="8" r="1" fill="currentColor" opacity="0.2" />
        <circle cx="25" cy="8" r="1" fill="currentColor" opacity="0.2" />
        {/* Side dots */}
        <circle cx="6" cy="8" r="1.5" fill="currentColor" opacity="0.15" />
        <circle cx="34" cy="8" r="1.5" fill="currentColor" opacity="0.15" />
        <circle cx="2" cy="8" r="0.8" fill="currentColor" opacity="0.1" />
        <circle cx="38" cy="8" r="0.8" fill="currentColor" opacity="0.1" />
      </svg>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
    </div>
  )
}

/**
 * Batik ring around center nav icon — Kawung mini
 */
export function BatikNavRing({ active = false }: { active?: boolean }) {
  const c = active ? 'rgba(255,255,255,' : 'rgba(0,144,209,'
  return (
    <svg className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)]" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer dashed ring */}
      <circle cx="34" cy="34" r="32" stroke={`${c}0.18)`} strokeWidth="1" strokeDasharray="5 3" />
      {/* 4 Kawung ovals at cardinal points */}
      <ellipse cx="34" cy="4" rx="4" ry="6" stroke={`${c}0.2)`} strokeWidth="0.8" fill={`${c}0.06)`} />
      <ellipse cx="34" cy="64" rx="4" ry="6" stroke={`${c}0.2)`} strokeWidth="0.8" fill={`${c}0.06)`} />
      <ellipse cx="4" cy="34" rx="6" ry="4" stroke={`${c}0.2)`} strokeWidth="0.8" fill={`${c}0.06)`} />
      <ellipse cx="64" cy="34" rx="6" ry="4" stroke={`${c}0.2)`} strokeWidth="0.8" fill={`${c}0.06)`} />
      {/* 4 dots at diagonals */}
      <circle cx="12" cy="12" r="2" fill={`${c}0.12)`} />
      <circle cx="56" cy="12" r="2" fill={`${c}0.12)`} />
      <circle cx="12" cy="56" r="2" fill={`${c}0.12)`} />
      <circle cx="56" cy="56" r="2" fill={`${c}0.12)`} />
    </svg>
  )
}

/**
 * Card corner accent — Kawung quarter for top-right
 */
export function BatikCardAccent({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute top-0 right-0 w-24 h-24 pointer-events-none overflow-hidden rounded-tr-2xl ${className}`}>
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-primary-500">
        {/* Quarter kawung radiating from corner */}
        <ellipse cx="96" cy="0" rx="20" ry="30" stroke="currentColor" strokeWidth="1" opacity="0.08" />
        <ellipse cx="96" cy="0" rx="30" ry="20" stroke="currentColor" strokeWidth="1" opacity="0.08" />
        <ellipse cx="96" cy="0" rx="14" ry="22" stroke="currentColor" strokeWidth="0.6" opacity="0.06" />
        <ellipse cx="96" cy="0" rx="22" ry="14" stroke="currentColor" strokeWidth="0.6" opacity="0.06" />
        {/* Inner arcs */}
        <path d="M96 0 Q76 20 70 40" stroke="currentColor" strokeWidth="0.5" opacity="0.06" />
        <path d="M96 0 Q80 10 60 15" stroke="currentColor" strokeWidth="0.5" opacity="0.06" />
        {/* Titik dots */}
        <circle cx="80" cy="16" r="1.5" fill="currentColor" opacity="0.08" />
        <circle cx="72" cy="28" r="1.2" fill="currentColor" opacity="0.06" />
        <circle cx="85" cy="8" r="1" fill="currentColor" opacity="0.06" />
        <circle cx="65" cy="10" r="1" fill="currentColor" opacity="0.05" />
        <circle cx="78" cy="35" r="0.8" fill="currentColor" opacity="0.04" />
      </svg>
    </div>
  )
}
