import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:     "var(--bg-base)",
          surface:  "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          hover:    "var(--bg-hover)",
        },
        border: {
          default: "var(--border-default)",
          strong:  "var(--border-strong)",
        },
        text: {
          primary:   "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted:     "var(--text-muted)",
        },
        accent: {
          default: "var(--accent-default)",
          hover:   "var(--accent-hover)",
          fg:      "var(--accent-fg)",
          soft:    "var(--accent-soft)",
        },
        severity: {
          high:   "var(--severity-high)",
          medium: "var(--severity-medium)",
          low:    "var(--severity-low)",
        },
        difficulty: {
          easy:   "var(--difficulty-easy)",
          medium: "var(--difficulty-medium)",
          hard:   "var(--difficulty-hard)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        error:   "var(--error)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "display-xl": ["3.25rem", { lineHeight: "1.1",  fontWeight: "800", letterSpacing: "-0.02em" }],
        "display-lg": ["2.5rem",  { lineHeight: "1.15", fontWeight: "700", letterSpacing: "-0.02em" }],
        "heading-xl": ["1.5rem",  { lineHeight: "1.3",  fontWeight: "700" }],
        "heading-lg": ["1.25rem", { lineHeight: "1.4",  fontWeight: "600" }],
        "heading-md": ["1rem",    { lineHeight: "1.4",  fontWeight: "600" }],
        "body-lg":    ["1.0625rem",{ lineHeight: "1.65",fontWeight: "400" }],
        "body-md":    ["0.9375rem",{ lineHeight: "1.6", fontWeight: "400" }],
        "body-sm":    ["0.8125rem",{ lineHeight: "1.55",fontWeight: "400" }],
        "label-lg":   ["0.875rem", { lineHeight: "1.4", fontWeight: "500" }],
        "label-md":   ["0.75rem",  { lineHeight: "1.4", fontWeight: "500" }],
        "code-md":    ["0.8125rem",{ lineHeight: "1.5", fontWeight: "400" }],
      },
      spacing: {
        "1": "0.25rem",
        "2": "0.5rem",
        "3": "0.75rem",
        "4": "1rem",
        "5": "1.25rem",
        "6": "1.5rem",
        "8": "2rem",
        "10": "2.5rem",
        "12": "3rem",
        "16": "4rem",
        "20": "5rem",
        "24": "6rem",
      },
      borderRadius: {
        sm:   "6px",
        md:   "8px",
        lg:   "12px",
        xl:   "16px",
        "2xl":"24px",
        full: "9999px",
      },
      backgroundImage: {
        "meridian-glow": "radial-gradient(60% 50% at 50% 0%, rgba(34,211,191,0.12) 0%, transparent 100%)",
        "meridian-line": "linear-gradient(90deg, transparent 0%, var(--accent-default) 50%, transparent 100%)",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "draw-line": "draw-line 1.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
