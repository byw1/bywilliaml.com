"use client";

import { useState } from "react";

export function CancelButton({ id, token }: { id: string; token: string }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/bookings/${id}/cancel?token=${encodeURIComponent(token)}`,
        { method: "POST" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not cancel");
      }
      window.location.reload();
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 text-center">
      {confirming ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void cancel()}
            disabled={busy}
            className="flex-1 rounded-lg border border-red-400/50 py-2.5 text-sm text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
          >
            {busy ? "Cancelling…" : "Yes, cancel it"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="flex-1 rounded-lg border border-white/20 py-2.5 text-sm text-white/70 transition hover:border-white/50"
          >
            Keep it
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm text-white/40 underline transition hover:text-white/70"
        >
          Cancel this meeting
        </button>
      )}
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
