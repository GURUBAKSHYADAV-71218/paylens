import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12172A",
          soft: "#454B5E",
          faint: "#8A8FA3",
        },
        paper: {
          DEFAULT: "#FAF9F5",
          raised: "#FFFFFF",
        },
        emerald: {
          DEFAULT: "#0E6E5C",
          light: "#E4F3EE",
          dark: "#0A5548",
        },
        amber: {
          DEFAULT: "#C98A2C",
          light: "#FBF1DE",
        },
        brick: {
          DEFAULT: "#B14328",
          light: "#F8E9E4",
        },
        line: "#E4E1D8",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,23,42,0.05), 0 12px 28px -14px rgba(18,23,42,0.18)",
        raised: "0 2px 4px rgba(18,23,42,0.06), 0 20px 40px -20px rgba(18,23,42,0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      backgroundImage: {
        "grain": "radial-gradient(circle at 1px 1px, rgba(18,23,42,0.05) 1px, transparent 0)",
      },
      keyframes: {
        "rise": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "grow-bar": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "rise": "rise 0.6s ease-out both",
        "grow-bar": "grow-bar 0.9s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
