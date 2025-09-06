// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // สร้าง custom font family
        pixel: ["var(--font-press-start-2p)", "monospace"],
      },
      colors: {
        // สร้าง custom color palette
        "pixel-bg": "#202020",
        "pixel-border": "#888888",
        "pixel-text": "#DDDDDD",
        "pixel-user": "#3a86ff",
        "pixel-bot": "#4f545c",
        "pixel-send": "#34a853",
        "pixel-send-hover": "#2c8f45",
      },
      boxShadow: {
        // สร้าง custom shadow แบบคมๆ ไม่มี blur
        sharp: "4px 4px 0px 0px rgba(0,0,0,0.75)",
      },
    },
  },
  plugins: [],
};
export default config;