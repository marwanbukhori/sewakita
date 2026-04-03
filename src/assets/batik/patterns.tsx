// Indonesian batik patterns using real batik images
// Images: Batak geometric + Traditional floral, applied with blue tinting

/**
 * Geometric Batak batik — used as subtle page backgrounds
 */
export function BatikBackground({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: 'url(/batik/batak-geometric.png)',
        backgroundSize: '300px',
        backgroundRepeat: 'repeat',
        opacity: 0.04,
        filter: 'hue-rotate(180deg) saturate(2)',
        mixBlendMode: 'multiply',
      }}
    />
  )
}

/**
 * Floral batik overlay for hero/blue cards — white-ish on dark blue
 */
export function BatikHeroOverlay({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: 'url(/batik/floral-traditional.png)',
        backgroundSize: '400px',
        backgroundRepeat: 'repeat',
        opacity: 0.08,
        filter: 'brightness(3) contrast(0.8)',
        mixBlendMode: 'soft-light',
      }}
    />
  )
}

/**
 * Geometric batik strip — horizontal border decoration
 */
export function BatikBorder({ className = '', position = 'top' }: { className?: string; position?: 'top' | 'bottom' }) {
  return (
    <div
      className={`absolute ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 h-3 pointer-events-none overflow-hidden ${className}`}
      style={{
        backgroundImage: 'url(/batik/batak-geometric.png)',
        backgroundSize: '200px',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center',
        opacity: 0.15,
        filter: 'hue-rotate(180deg) saturate(3)',
      }}
    />
  )
}

/**
 * Floral batik corner accent for cards
 */
export function BatikCardAccent({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute top-0 right-0 w-28 h-28 pointer-events-none overflow-hidden rounded-tr-2xl ${className}`}
      style={{
        backgroundImage: 'url(/batik/floral-traditional.png)',
        backgroundSize: '250px',
        backgroundPosition: 'center',
        opacity: 0.06,
        filter: 'hue-rotate(180deg) saturate(2)',
        mixBlendMode: 'multiply',
      }}
    />
  )
}

/**
 * Batik divider — geometric strip between sections
 */
export function BatikDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`py-2 ${className}`}>
      <div
        className="h-4 w-full rounded-sm overflow-hidden"
        style={{
          backgroundImage: 'url(/batik/batak-geometric.png)',
          backgroundSize: '150px',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center',
          opacity: 0.12,
          filter: 'hue-rotate(180deg) saturate(3)',
        }}
      />
    </div>
  )
}

/**
 * Batik ring around center nav icon
 */
export function BatikNavRing({ active = false }: { active?: boolean }) {
  return (
    <div
      className="absolute -inset-2 rounded-full pointer-events-none overflow-hidden"
      style={{
        backgroundImage: 'url(/batik/floral-traditional.png)',
        backgroundSize: '120px',
        backgroundPosition: 'center',
        opacity: active ? 0.15 : 0.1,
        filter: active ? 'brightness(3)' : 'hue-rotate(180deg) saturate(2)',
        mixBlendMode: active ? 'soft-light' : 'multiply',
      }}
    />
  )
}
