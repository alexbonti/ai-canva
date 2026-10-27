const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#boxes", label: "Boxes" },
  { href: "#for-teams", label: "For teams" },
];

/** Quiet, ruled footer with a mono colophon. */
export default function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-shell">
        <div className="lp-footer-grid">
          <div>
            <div className="lp-footer-brand">
              <span className="lp-footer-mark" aria-hidden />
              <span className="lp-footer-word">AI Canva</span>
            </div>
            <p className="lp-footer-tag">
              A collaborative AI whiteboard. The board is the record.
            </p>
          </div>

          <nav className="lp-footer-nav" aria-label="Footer sections">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="lp-footer-meta">
            <span>© {new Date().getFullYear()} AI Canva</span>
            <span>React · Firebase · Ollama</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
