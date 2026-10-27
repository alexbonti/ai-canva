import { Icon } from "../ui/Icon.js";

interface LandingNavProps {
  onSignIn: () => void;
  signingIn: boolean;
}

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#boxes", label: "Boxes" },
  { href: "#for-teams", label: "For teams" },
];

/** Pine signage bar — the same roundel and small-caps language as the app. */
export default function LandingNav({ onSignIn, signingIn }: LandingNavProps) {
  return (
    <header className="lp-nav">
      <div className="lp-shell lp-nav-inner">
        <a href="#top" className="lp-brand" aria-label="AI Canva — top of page">
          <span className="logo-roundel" aria-hidden />
          <span className="logo-word">AI Canva</span>
        </a>

        <nav className="lp-nav-links" aria-label="Page sections">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="lp-nav-link">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="lp-nav-actions">
          <button
            type="button"
            onClick={onSignIn}
            disabled={signingIn}
            className="lp-btn lp-btn--ghost-cream"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={onSignIn}
            disabled={signingIn}
            aria-busy={signingIn}
            className="lp-btn lp-btn--signal lp-nav-cta"
          >
            {signingIn ? "Connecting…" : "Start a board"}
            {!signingIn && <Icon name="arrowRight" size={13} />}
          </button>
        </div>
      </div>
    </header>
  );
}
