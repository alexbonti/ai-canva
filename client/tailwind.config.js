/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ---- "The Printed Line" tokens (see DESIGN.md) -------------------
        canvas: "#F4EFE4",
        paper: {
          DEFAULT: "#F4EFE4",
          raised: "#FBF7EC",
        },
        card: "#FFFDF7",
        ink: {
          DEFAULT: "#16211C",
          soft: "#3D4A42",
          muted: "#66736A",
        },
        rule: {
          DEFAULT: "#DCD4C1",
          strong: "#C8BEA8",
        },
        pine: {
          DEFAULT: "#123229",
          deep: "#0B221C",
          line: "#1B4436",
        },
        cream: "#F2EDE1",
        signal: {
          DEFAULT: "#F2B300",
          ink: "#2A2100",
          deep: "#E0A600",
        },
        line: {
          input: "#B57A00",
          sdlc: "#9C3A31",
          worker: "#2A5A94",
          companion: "#BF543C",
          collab: "#3B7557",
          custom: "#6A5A93",
        },
        state: {
          run: "#1F6FEB",
          error: "#B33A2B",
          stale: "#9A6A00",
          ok: "#2E7D4F",
        },

        // Semantic error surfaces (warm wash + hairline), so panels never
        // hand-roll the same three hexes again.
        "error-wash": "#FBEFEC",
        "error-wash-hover": "#F7E3DF",
        "error-line": "#E2B4A4",

        // ---- Warm neutral remap ------------------------------------------
        // Existing screens use `slate` for text/rules/quiet surfaces. Remapping
        // the scale turns every untouched screen warm without a class sweep.
        slate: {
          50: "#FAF6EC",
          100: "#F2ECDF",
          200: "#DCD4C1",
          300: "#C6BCA6",
          400: "#8C958B",
          500: "#66736A",
          600: "#4F5B52",
          700: "#3D4A42",
          800: "#26332C",
          900: "#16211C",
          950: "#0D1512",
        },
        // `indigo` is the legacy primary/accent; it now resolves to pine.
        indigo: {
          50: "#EFF3EA",
          100: "#E1E8DB",
          200: "#C3D1BC",
          300: "#9DB49B",
          400: "#5F7F68",
          500: "#2F5F49",
          600: "#1D4A38",
          700: "#123229",
          800: "#0C2420",
          900: "#081A16",
          950: "#05110E",
        },
        // Status hues used by older panels resolve to the state palette.
        amber: {
          50: "#FBF3DF",
          100: "#F6E6BF",
          200: "#EDD08A",
          300: "#E0B44F",
          400: "#CE9A22",
          500: "#9A6A00",
          600: "#855C00",
          700: "#6E4B00",
          800: "#4F3600",
          900: "#332300",
          950: "#221700",
        },
      },
      fontFamily: {
        sans: ["Archivo", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        xs: "3px",
        sm: "5px",
        md: "8px",
        lg: "12px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 1px rgba(22,33,28,.05), 0 6px 16px -8px rgba(22,33,28,.18)",
        float: "0 8px 28px -12px rgba(22,33,28,.35), 0 1px 2px rgba(22,33,28,.12)",
        signal: "0 0 0 2px #F2B300, 0 0 0 4px rgba(242,179,0,.22)",
      },
      transitionTimingFunction: {
        paper: "cubic-bezier(0.16, 1, 0.3, 1)",
        standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
