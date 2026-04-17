"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Copy } from "lucide-react";

interface ComponentProps {
  name?: string;
  role?: string;
  email?: string;
  avatarSrc?: string;
  statusText?: string;
  statusColor?: string;
  verified?: boolean;
  className?: string;
}

export default function Component({
  name = "William Lee",
  role = "@bywilliaml",
  email = "william@bywilliaml.com",
  avatarSrc = "https://avatars.githubusercontent.com/byw1",
  statusText = "Available for work",
  statusColor = "bg-lime-500",
  verified = true,
  className,
}: ComponentProps) {
  const [copied, setCopied] = useState(false);

  const timeText = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, "0");
    const hour12 = ((h + 11) % 12) + 1;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${hour12}:${m}${ampm}`;
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("relative w-full", className)}
    >
      <Card className="relative z-10 mx-auto w-full overflow-visible rounded-[24px] border-0 bg-[radial-gradient(120%_120%_at_30%_10%,#1a1a1a_0%,#0f0f10_60%,#0b0b0c_100%)] text-white shadow-2xl">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <span className={cn("inline-block h-2 w-2 rounded-full animate-pulse", statusColor)} />
              <span className="select-none">{statusText}</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-80">
              <Clock className="h-3.5 w-3.5" />
              <span className="tabular-nums">{timeText}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10">
              <Image
                src={avatarSrc}
                alt={`${name} avatar`}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-lg font-semibold tracking-tight">
                  {name}
                </h3>
                {verified && (
                  <svg
                    viewBox="0 0 22 22"
                    aria-label="Verified"
                    className="h-5 w-5 shrink-0"
                  >
                    <path
                      fill="#1D9BF0"
                      d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                    />
                  </svg>
                )}
              </div>
              <p className="text-sm text-neutral-400">{role}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleCopy}
            className="mt-4 h-11 w-full justify-center gap-2 rounded-xl bg-white/10 text-white hover:bg-white/15"
          >
            <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy Email"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
