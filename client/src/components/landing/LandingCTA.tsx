import { Icon } from "../ui/Icon.js";

interface LandingCTAProps {
  onSignIn: () => void;
  signingIn: boolean;
}

/** Pine signage panel — the page's one loud destination. */
export default function LandingCTA({ onSignIn, signingIn }: LandingCTAProps) {
  return (
    <section className="lp-cta" aria-labelledby="cta-title">
      <div className="lp-shell lp-cta-grid">
        <div>
          <h2 id="cta-title" className="lp-cta-title">
            The next box is yours.
          </h2>
          <p className="lp-cta-body">
            Sign in with Google and the canvas opens on a blank sheet. Place an
            idea, wire the next box and run it. Joining a workshop? Use the seat
            code your facilitator shared.
          </p>
        </div>

        <div className="lp-cta-action">
          <button
            type="button"
            onClick={onSignIn}
            disabled={signingIn}
            aria-busy={signingIn}
            className="lp-btn lp-btn--signal lp-btn--lg"
          >
            {signingIn ? "Connecting…" : "Start a board"}
            {!signingIn && <Icon name="arrowRight" size={14} />}
          </button>
          <p className="lp-cta-fine">
            Sign in with Google — no install. Your first board is created for
            you.
          </p>
        </div>
      </div>
    </section>
  );
}
