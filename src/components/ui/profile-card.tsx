"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface ComponentProps {
  name?: string;
  role?: string;
  avatarSrc?: string;
  statusText?: string;
  statusColor?: string;
  className?: string;
}

export default function Component({
  name = "William Lee",
  role = "@bywilliaml",
  avatarSrc = "https://avatars.githubusercontent.com/byw1",
  statusText = "Available for work",
  statusColor = "bg-lime-500",
  className,
}: ComponentProps) {
  const timeText = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, "0");
    const hour12 = ((h + 11) % 12) + 1;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${hour12}:${m}${ampm}`;
  }, []);

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
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight">
                {name}
              </h3>
              <p className="text-sm text-neutral-400">{role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
