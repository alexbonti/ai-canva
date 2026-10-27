import { useState } from "react";
import { signInWithGoogle } from "../../lib/auth.js";
import "../../landing.css";
import LandingNav from "./LandingNav.js";
import LandingHero from "./LandingHero.js";
import LandingHowItWorks from "./LandingHowItWorks.js";
import LandingFeatures from "./LandingFeatures.js";
import LandingBoxes from "./LandingBoxes.js";
import LandingRoles from "./LandingRoles.js";
import LandingCTA from "./LandingCTA.js";
import LandingFooter from "./LandingFooter.js";

/**
 * Logged-out marketing page — "The Printed Line" (Persuade surface).
 *
 * The public contract stays a zero-prop component: App.tsx renders it as the
 * whole logged-out screen and owns the workshop join pill/modal around it.
 * Sign-in is the one action this page passes down.
 */
export default function LandingPage() {
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error("Sign-in failed:", e);
      setSigningIn(false);
    }
  };

  return (
    <div className="lp-page min-h-full w-full">
      <a className="lp-skip" href="#main">
        Skip to content
      </a>
      <LandingNav onSignIn={handleSignIn} signingIn={signingIn} />
      <main id="main" tabIndex={-1} className="lp-main">
        <LandingHero onSignIn={handleSignIn} signingIn={signingIn} />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingBoxes />
        <LandingRoles />
        <LandingCTA onSignIn={handleSignIn} signingIn={signingIn} />
      </main>
      <LandingFooter />
    </div>
  );
}
