export type ChartPaletteKey = "warm" | "emerald" | "purple" | "cool" | "accessible";

export interface ChartPalette {
  id: ChartPaletteKey;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  tertiary: string;
  lightShade: string;
  textHighlight: string;
  dotColors: [string, string, string];
  donutColors: string[];
  gradient: {
    start: string;
    end: string;
  };
}

export const CHART_PALETTES: Record<ChartPaletteKey, ChartPalette> = {
  warm: {
    id: "warm",
    name: "Royal Blue & Sunset Orange",
    description: "High contrast tech contrast: royal blue base with vivid sunset orange highlights.",
    primary: "#2563eb",
    secondary: "#f97316",
    tertiary: "#4f46e5",
    lightShade: "rgba(249, 115, 22, 0.16)",
    textHighlight: "#c2410c",
    dotColors: ["#2563eb", "#f97316", "#4f46e5"],
    donutColors: ["#2563eb", "#f97316", "#38bdf8", "#fbbf24", "#94a3b8"],
    gradient: {
      start: "#f97316",
      end: "#2563eb",
    },
  },
  emerald: {
    id: "emerald",
    name: "Emerald Forest & Golden Amber",
    description: "Natural & financial growth: deep lush emerald with warm golden amber peaks.",
    primary: "#059669",
    secondary: "#d97706",
    tertiary: "#10b981",
    lightShade: "rgba(5, 150, 105, 0.16)",
    textHighlight: "#047857",
    dotColors: ["#059669", "#d97706", "#10b981"],
    donutColors: ["#059669", "#d97706", "#34d399", "#f59e0b", "#065f46"],
    gradient: {
      start: "#d97706",
      end: "#059669",
    },
  },
  purple: {
    id: "purple",
    name: "Amethyst Violet & Neon Fuchsia",
    description: "Modern creative vibe: electric purple paired with punchy neon fuchsia.",
    primary: "#7c3aed",
    secondary: "#ec4899",
    tertiary: "#a855f7",
    lightShade: "rgba(236, 72, 153, 0.16)",
    textHighlight: "#be185d",
    dotColors: ["#7c3aed", "#ec4899", "#a855f7"],
    donutColors: ["#7c3aed", "#ec4899", "#c084fc", "#f43f5e", "#4338ca"],
    gradient: {
      start: "#ec4899",
      end: "#7c3aed",
    },
  },
  cool: {
    id: "cool",
    name: "Cyber Teal & Coral Crimson",
    description: "Bold data journalism: deep marine teal baseline with intense coral red accents.",
    primary: "#0d9488",
    secondary: "#e11d48",
    tertiary: "#06b6d4",
    lightShade: "rgba(225, 29, 72, 0.16)",
    textHighlight: "#be123c",
    dotColors: ["#0d9488", "#e11d48", "#06b6d4"],
    donutColors: ["#0d9488", "#e11d48", "#2dd4bf", "#fb7185", "#334155"],
    gradient: {
      start: "#e11d48",
      end: "#0d9488",
    },
  },
  // Alias for backward compatibility if user had "accessible" stored
  accessible: {
    id: "accessible",
    name: "Emerald Forest & Golden Amber",
    description: "Natural & financial growth: deep lush emerald with warm golden amber peaks.",
    primary: "#059669",
    secondary: "#d97706",
    tertiary: "#10b981",
    lightShade: "rgba(5, 150, 105, 0.16)",
    textHighlight: "#047857",
    dotColors: ["#059669", "#d97706", "#10b981"],
    donutColors: ["#059669", "#d97706", "#34d399", "#f59e0b", "#065f46"],
    gradient: {
      start: "#d97706",
      end: "#059669",
    },
  },
};

export const DEFAULT_CHART_PALETTE: ChartPaletteKey = "warm";
export const STORAGE_KEY_PALETTE = "datanarrator_chart_palette";
export const STORAGE_KEY_THEME = "datanarrator_theme_mode";

export function getStoredPalette(): ChartPaletteKey {
  if (typeof window === "undefined") return DEFAULT_CHART_PALETTE;
  const stored = localStorage.getItem(STORAGE_KEY_PALETTE) as ChartPaletteKey | null;
  if (stored && CHART_PALETTES[stored]) {
    return stored === "accessible" ? "emerald" : stored;
  }
  return DEFAULT_CHART_PALETTE;
}

export function saveStoredPalette(key: ChartPaletteKey): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_PALETTE, key);
  window.dispatchEvent(new Event("datanarrator_palette_changed"));
}
