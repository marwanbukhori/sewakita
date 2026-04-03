// Indonesian batik patterns using real images
// White-on-blue for hero cards, subtle tint for backgrounds

/**
 * Subtle page background — geometric batak at very low opacity
 */
export function BatikBackground({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: 'url(/batik/batak-geometric.png)',
        backgroundSize: '300px',
        backgroundRepeat: 'repeat',
        opacity: 0.03,
        filter: 'grayscale(1)',
        mixBlendMode: 'multiply',
      }}
    />
  )
}

/**
 * White batik overlay for blue/hero cards — clearly visible white pattern
 */
export function BatikHeroOverlay({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: 'url(/batik/floral-traditional.png)',
        backgroundSize: '350px',
        backgroundRepeat: 'repeat',
        opacity: 0.12,
        filter: 'brightness(10) grayscale(1)',
      }}
    />
  )
}

/**
 * White batik for bottom nav blue background
 */
export function BatikNavOverlay({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded-t-2xl ${className}`}
      style={{
        backgroundImage: 'url(/batik/batak-geometric.png)',
        backgroundSize: '200px',
        backgroundRepeat: 'repeat',
        opacity: 0.1,
        filter: 'brightness(10) grayscale(1)',
      }}
    />
  )
}

/**
 * Card corner accent — floral batik
 */
export function BatikCardAccent({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute top-0 right-0 w-24 h-24 pointer-events-none overflow-hidden rounded-tr-2xl ${className}`}
      style={{
        backgroundImage: 'url(/batik/floral-traditional.png)',
        backgroundSize: '200px',
        backgroundPosition: 'center',
        opacity: 0.05,
        filter: 'grayscale(1)',
        mixBlendMode: 'multiply',
      }}
    />
  )
}

/**
 * Batik divider strip
 */
export function BatikDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`py-2 ${className}`}>
      <div
        className="h-3 w-full overflow-hidden rounded-sm"
        style={{
          backgroundImage: 'url(/batik/batak-geometric.png)',
          backgroundSize: '150px',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center',
          opacity: 0.1,
          filter: 'grayscale(1)',
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  )
}

/**
 * Batik ring on center nav button
 */
export function BatikNavRing({ active = false }: { active?: boolean }) {
  return (
    <div
      className="absolute -inset-2 rounded-full pointer-events-none overflow-hidden"
      style={{
        backgroundImage: 'url(/batik/floral-traditional.png)',
        backgroundSize: '100px',
        backgroundPosition: 'center',
        opacity: active ? 0.15 : 0.08,
        filter: 'brightness(10) grayscale(1)',
      }}
    />
  )
}
