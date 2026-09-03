"use client";

import React from "react";
import { cn } from "@/lib/utils";

// width: card width in px; thickness: page-block depth in px.
const sizeMap = {
  sm: { width: 150, thickness: 24 },
  default: { width: 196, thickness: 34 },
  lg: { width: 300, thickness: 46 },
};

interface PerspectiveBookProps {
  size?: "sm" | "default" | "lg";
  className?: string;
  children: React.ReactNode;
  textured?: boolean;
}

/**
 * A hardcover built from real faces in one preserve-3d context: front and
 * back covers sandwiching a slightly inset page block, whose fore edge and
 * top edge are striated "paper" planes. Rests in a 3/4 pose so the depth
 * reads before any interaction; hover deepens the turn, lifts the book off
 * its ambient shadow, and sweeps a sheen across the cover.
 */
export function PerspectiveBook({
  size = "default",
  className = "",
  children,
  textured = false,
}: PerspectiveBookProps) {
  const { width, thickness } = sizeMap[size];
  const pages = thickness - 6; // covers overhang the page block
  const radius = "6px 4px 4px 6px";
  const defaultColorClasses = "bg-[#1f1f1f] text-white";
  const cover = className || defaultColorClasses;
  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <div className="group relative w-min h-min" style={{ perspective: "1200px" }}>
      {/* Ambient occlusion — tightens and fades as the book lifts. */}
      <div
        aria-hidden="true"
        className="absolute left-[4%] right-[4%] -bottom-2.5 h-4 rounded-[50%] bg-black/60 blur-md transition-all duration-500 group-hover:opacity-60 group-hover:scale-x-90"
        style={{ transitionTimingFunction: ease }}
      />

      <div
        className="relative will-change-transform transition-transform duration-500 [transform-style:preserve-3d] [transform:rotateY(-18deg)] group-hover:[transform:rotateY(-30deg)_translateY(-6px)_scale(1.04)] motion-reduce:transition-none"
        style={{
          width: `${width}px`,
          aspectRatio: "49 / 60",
          borderRadius: radius,
          transitionTimingFunction: ease,
        }}
      >
        {/* Back cover */}
        <div
          className={cn("absolute inset-0 overflow-hidden", cover)}
          style={{ transform: `translateZ(${-thickness / 2}px)`, borderRadius: radius }}
        >
          <div className="absolute inset-0 bg-black/45" />
        </div>

        {/* Page block — fore edge (right face) */}
        <div
          aria-hidden="true"
          className="absolute left-0"
          style={{
            top: "3px",
            bottom: "3px",
            width: `${pages}px`,
            transform: `translateX(${width - 3 - pages / 2}px) rotateY(90deg)`,
            background: [
              "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.28) 100%)",
              "linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0) 24%, rgba(0,0,0,0) 76%, rgba(0,0,0,0.14))",
              "repeating-linear-gradient(90deg, #f6f1e6 0px, #f6f1e6 1px, #e6dfcd 1px, #e6dfcd 2px)",
            ].join(", "),
          }}
        />

        {/* Page block — top edge */}
        <div
          aria-hidden="true"
          className="absolute top-0"
          style={{
            left: "3px",
            right: "3px",
            height: `${pages}px`,
            transform: `translateY(${3 - pages / 2}px) rotateX(90deg)`,
            background: [
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 100%)",
              "repeating-linear-gradient(180deg, #f6f1e6 0px, #f6f1e6 1px, #eae3d2 1px, #eae3d2 2px)",
            ].join(", "),
          }}
        />

        {/* Front cover */}
        <div
          className={cn(
            "absolute inset-0 overflow-hidden flex flex-col p-[12%]",
            "after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:rounded-[inherit] after:border after:border-solid after:border-white/[0.07]",
            "after:shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_-1px_0_1px_rgba(255,255,255,0.05),inset_0_-1px_1px_rgba(0,0,0,0.25)]",
            cover,
          )}
          style={{ transform: `translateZ(${thickness / 2}px)`, borderRadius: radius }}
        >
          {/* Hinge groove where the board bends at the spine */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-[5%] w-[4.5%] pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.30), rgba(255,255,255,0.06) 55%, rgba(0,0,0,0.05) 80%, transparent)",
            }}
          />
          {/* Sheen swept across on hover (rules in globals.css) */}
          <div aria-hidden="true" className="book-sheen absolute inset-0 pointer-events-none rounded-[inherit]" />
          <div className="pl-1 h-full relative">{children}</div>
          {textured && (
            <div
              className="absolute inset-0 mix-blend-hard-light rotate-180 opacity-50 brightness-110 bg-no-repeat bg-cover pointer-events-none"
              style={{ borderRadius: radius }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function BookTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1 className={`font-bold select-none mt-3 mb-1 text-balance ${className}`}>
      {children}
    </h1>
  );
}

export function BookDescription({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`opacity-80 select-none text-xs/relaxed ${className}`}>
      {children}
    </p>
  );
}

export default PerspectiveBook;
