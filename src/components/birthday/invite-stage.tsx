"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { StaticInvite } from "./static-invite";

// three, drei and rapier are a large bundle and every one of them touches
// browser APIs on import, so the scene is fetched only in the browser and only
// once the page has decided it wants motion.
const InviteLanyard = dynamic(() => import("./invite-lanyard"), {
  ssr: false,
  loading: () => <StaticInvite />,
});

/**
 * Falls back to the flat card if the scene throws — no WebGL context, a blocked
 * model, a driver that gives up. An invite that renders is worth more than one
 * that spins.
 */
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Invite scene failed to render", error);
  }

  render() {
    return this.state.failed ? <StaticInvite /> : this.props.children;
  }
}

export function InviteStage() {
  // Server-render the flat card so the invite is in the HTML, then upgrade.
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAnimated(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (!animated) return <StaticInvite />;

  return (
    <SceneBoundary>
      <InviteLanyard />
    </SceneBoundary>
  );
}
