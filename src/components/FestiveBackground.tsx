/** Subtle festive backdrop: gradients + Indian-geometric SVG pattern + floating diyas. Never intercepts clicks. */
export default function FestiveBackground({ density = 'normal' }: { density?: 'light' | 'normal' }) {
  const dots = density === 'light' ? 6 : 10;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* base gradients */}
      <div className="absolute inset-0 bg-[#0F172A]" />
      <div className="absolute -top-40 left-1/2 h-[34rem] w-[60rem] -translate-x-1/2 rounded-full bg-[#8B5CF6]/25 blur-[120px]" />
      <div className="absolute -bottom-48 -left-32 h-[28rem] w-[36rem] rounded-full bg-[#2563EB]/25 blur-[110px]" />
      <div className="absolute -bottom-40 -right-24 h-[26rem] w-[34rem] rounded-full bg-[#EC4899]/15 blur-[110px]" />
      <div className="absolute left-1/2 top-1/3 h-[20rem] w-[40rem] -translate-x-1/2 rounded-full bg-[#F97316]/10 blur-[100px]" />

      {/* Indian geometric band pattern (SVG, low opacity) */}
      <svg
        className="absolute inset-x-0 top-0 h-24 w-full opacity-[0.10]"
        preserveAspectRatio="xMidYMin slice"
        viewBox="0 0 1200 96"
      >
        <defs>
          <pattern id="band-pattern" width="60" height="48" patternUnits="userSpaceOnUse">
            <path d="M30 4 L52 24 L30 44 L8 24 Z" fill="none" stroke="#FACC15" strokeWidth="1.5" />
            <circle cx="30" cy="24" r="3.5" fill="#F97316" />
            <path d="M0 48 h60" stroke="#8B5CF6" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1200" height="96" fill="url(#band-pattern)" />
      </svg>
      <svg
        className="absolute inset-x-0 bottom-0 h-24 w-full rotate-180 opacity-[0.10]"
        preserveAspectRatio="xMidYMin slice"
        viewBox="0 0 1200 96"
      >
        <rect width="1200" height="96" fill="url(#band-pattern)" />
      </svg>

      {/* peacock-feather arcs */}
      <svg
        className="absolute -right-24 -top-24 h-96 w-96 opacity-[0.12]"
        viewBox="0 0 200 200"
      >
        {[20, 36, 52, 68, 84].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#06B6D4" strokeWidth="1.5" />
        ))}
        <circle cx="100" cy="100" r="8" fill="#FACC15" opacity="0.8" />
      </svg>
      <svg
        className="absolute -bottom-28 -left-28 h-[26rem] w-[26rem] opacity-[0.10]"
        viewBox="0 0 200 200"
      >
        {[20, 36, 52, 68, 84].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#EC4899" strokeWidth="1.5" />
        ))}
        <circle cx="100" cy="100" r="8" fill="#F97316" opacity="0.8" />
      </svg>

      {/* floating diya glows */}
      {Array.from({ length: dots }).map((_, i) => (
        <div
          key={i}
          className="anim-float-slow absolute rounded-full"
          style={{
            left: `${(i * 97) % 100}%`,
            top: `${12 + ((i * 53) % 76)}%`,
            width: 6 + ((i * 7) % 5) * 2,
            height: 6 + ((i * 7) % 5) * 2,
            background:
              i % 3 === 0 ? '#FACC15' : i % 3 === 1 ? '#F97316' : '#EC4899',
            opacity: 0.35,
            filter: 'blur(1px)',
            animationDelay: `${(i % 7) * 0.9}s`,
          }}
        />
      ))}
    </div>
  );
}
