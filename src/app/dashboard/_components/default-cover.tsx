/**
 * Genre-based gradient cover image — shown when no custom cover is uploaded.
 */

const GENRE_COVERS: Record<string, { from: string; to: string; accent: string }> = {
  "fantasy":          { from: "#3b1f6b", to: "#6d28d9", accent: "#fbbf24" },
  "dark-fantasy":     { from: "#0f0a1e", to: "#3b1f6b", accent: "#c084fc" },
  "urban-fantasy":    { from: "#134e4a", to: "#5b21b6", accent: "#34d399" },
  "scifi":            { from: "#0c1445", to: "#1e40af", accent: "#22d3ee" },
  "dystopian":        { from: "#1c1917", to: "#44403c", accent: "#f97316" },
  "thriller":         { from: "#0f0f0f", to: "#7f1d1d", accent: "#ef4444" },
  "suspense":         { from: "#1c1917", to: "#292524", accent: "#dc2626" },
  "mystery":          { from: "#1c1007", to: "#78350f", accent: "#f59e0b" },
  "crime":            { from: "#111827", to: "#374151", accent: "#eab308" },
  "horror":           { from: "#0a0a0a", to: "#1f0707", accent: "#991b1b" },
  "romance":          { from: "#4a0020", to: "#be185d", accent: "#fbcfe8" },
  "paranormal":       { from: "#2e1065", to: "#9d174d", accent: "#e879f9" },
  "literary":         { from: "#292524", to: "#57534e", accent: "#d6d3d1" },
  "historical":       { from: "#1c1007", to: "#92400e", accent: "#d97706" },
  "contemporary":     { from: "#0f172a", to: "#1e3a5f", accent: "#60a5fa" },
  "ya":               { from: "#2d1b69", to: "#be185d", accent: "#a78bfa" },
  "womens":           { from: "#4a1942", to: "#be185d", accent: "#f9a8d4" },
  "adventure":        { from: "#052e16", to: "#065f46", accent: "#34d399" },
  "magical-realism":  { from: "#2d1b69", to: "#831843", accent: "#c4b5fd" },
  "other":            { from: "#18181b", to: "#3f3f46", accent: "#a1a1aa" },
};

const DEFAULT_COVER = { from: "#1e1b4b", to: "#4c1d95", accent: "#818cf8" };

interface Props {
  genre?:  string | null;
  title:   string;
  className?: string;
}

export default function DefaultCover({ genre, title, className = "" }: Props) {
  const palette = (genre && GENRE_COVERS[genre]) ? GENRE_COVERS[genre] : DEFAULT_COVER;

  // Show up to 3 words of the title
  const words     = title.trim().split(/\s+/);
  const line1     = words.slice(0, 2).join(" ");
  const line2     = words.slice(2, 4).join(" ");

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none ${className}`}
      style={{ background: `linear-gradient(160deg, ${palette.from} 0%, ${palette.to} 100%)` }}
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            ${palette.accent} 0px,
            ${palette.accent} 1px,
            transparent 1px,
            transparent 12px
          )`,
        }}
      />

      {/* Accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: palette.accent, opacity: 0.8 }}
      />

      {/* Title text */}
      <div className="relative px-3 text-center">
        <p
          className="font-display font-semibold leading-tight text-white"
          style={{
            fontSize:    "clamp(10px, 3.5cqi, 15px)",
            textShadow: "0 1px 8px rgba(0,0,0,0.6)",
            letterSpacing: "-0.01em",
          }}
        >
          {line1}
        </p>
        {line2 && (
          <p
            className="font-display font-semibold leading-tight text-white mt-0.5"
            style={{
              fontSize:    "clamp(10px, 3.5cqi, 15px)",
              textShadow: "0 1px 8px rgba(0,0,0,0.6)",
            }}
          >
            {line2}
          </p>
        )}
      </div>

      {/* Bottom accent dot */}
      <div
        className="absolute bottom-3 w-1 h-1 rounded-full"
        style={{ background: palette.accent, opacity: 0.7 }}
      />
    </div>
  );
}
