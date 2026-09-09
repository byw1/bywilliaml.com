"use client";

import {
  Component,
  useEffect,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import dynamic from "next/dynamic";
import { StaticInvite } from "./static-invite";

// three, drei and rapier are a large bundle and every one of them touches
// browser APIs on import, so the scene is fetched only in the browser and only
// once the page has decided it wants motion.
const InviteLanyard = dynamic(() => import("./invite-lanyard"), {
  ssr: false,
  loading: () => <PinnedFallback />,
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
    return this.state.failed ? <PinnedFallback /> : this.props.children;
  }
}

export interface InviteStageProps {
  /** The page element the scene reads pointer events from. */
  eventSource: RefObject<HTMLElement | null>;
  /** Called as the badge is picked up and put down. */
  onHeldChange: (held: boolean) => void;
}

export function InviteStage({ eventSource, onHeldChange }: InviteStageProps) {
  // Server-render the flat card so the invite is in the HTML, then upgrade.
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAnimated(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (!animated) return <PinnedFallback />;

  return (
    <SceneBoundary>
      <InviteLanyard eventSource={eventSource} onHeldChange={onHeldChange} />
    </SceneBoundary>
  );
}

/**
 * The flat card, sitting roughly where the hanging one would.
 *
 * It shares the backdrop layer with the scene, so it has to land in the gap the
 * page leaves for the badge: high and centred while the layout is stacked, over
 * on the right once the copy moves left.
 */
function PinnedFallback() {
  return (
    <div className="absolute inset-x-0 top-0 flex justify-center px-6 pt-16 lg:justify-end lg:pr-[10vw] lg:pt-28">
      <StaticInvite />
    </div>
  );
}
