"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitRsvp } from "@/app/birthday/actions";
import { RSVP_IDLE, type RsvpState } from "@/lib/birthday/rsvp-state";
import { EVENT } from "@/lib/birthday/event";
import { cn } from "@/lib/utils";

const FIELD =
  "w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition " +
  "placeholder:text-white/25 focus:border-white/60 focus:bg-white/[0.06]";

function fieldClass(state: RsvpState, name: RsvpState["field"]): string {
  return cn(FIELD, state.field === name ? "border-red-400/70" : "border-white/15");
}

const EMPTY = { name: "", phone: "", email: "", message: "", plusOne: "no" };

export function RsvpForm() {
  const [state, formAction, pending] = useActionState(submitRsvp, RSVP_IDLE);
  const [values, setValues] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const confirmed = state.status === "ok" && !editing;

  // Every field is controlled on purpose. React clears an uncontrolled form
  // once its action resolves, which on a rejected submit would wipe everything
  // the guest just typed.
  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  // Send focus to whichever field the server rejected, so a failed submit
  // doesn't leave a keyboard user hunting for the problem.
  useEffect(() => {
    if (state.status !== "error" || !state.field) return;
    formRef.current
      ?.querySelector<HTMLElement>(`[name="${state.field}"]`)
      ?.focus();
  }, [state]);

  // The same reset reaches the radios, and controlled radios don't recover on
  // their own: React only rewrites `checked` when the prop changes, and it
  // hasn't. Left alone, a rejected submit quietly turns the plus one back off
  // and the next attempt sends the wrong answer.
  useEffect(() => {
    const chosen = formRef.current?.querySelector<HTMLInputElement>(
      `input[name="plusOne"][value="${values.plusOne}"]`,
    );
    if (chosen && !chosen.checked) chosen.checked = true;
  }, [state, values.plusOne]);

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-[#f0b357]/40 bg-[#f0b357]/[0.06] p-8 text-center">
        <p className="text-3xl" aria-hidden>
          🎉
        </p>
        <p className="mt-4 text-xl font-medium">{state.message}</p>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/60">
          {EVENT.placeDetail} See you {EVENT.dayLabel}.
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-6 text-sm text-white/50 underline decoration-white/25 underline-offset-4 transition hover:text-white"
        >
          Change something
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => setEditing(false)}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rsvp-name" className="text-xs uppercase tracking-[0.18em] text-white/40">
            Name
          </label>
          <input
            id="rsvp-name"
            name="name"
            required
            maxLength={80}
            autoComplete="name"
            placeholder="Your name"
            value={values.name}
            onChange={(event) => set("name")(event.target.value)}
            className={cn("mt-2", fieldClass(state, "name"))}
          />
        </div>

        <div>
          <label htmlFor="rsvp-phone" className="text-xs uppercase tracking-[0.18em] text-white/40">
            Phone
          </label>
          <input
            id="rsvp-phone"
            name="phone"
            type="tel"
            required
            maxLength={32}
            autoComplete="tel"
            placeholder="(555) 010-1234"
            value={values.phone}
            onChange={(event) => set("phone")(event.target.value)}
            className={cn("mt-2", fieldClass(state, "phone"))}
          />
        </div>
      </div>

      <div>
        <label htmlFor="rsvp-email" className="text-xs uppercase tracking-[0.18em] text-white/40">
          Email
        </label>
        <input
          id="rsvp-email"
          name="email"
          type="email"
          required
          maxLength={160}
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(event) => set("email")(event.target.value)}
          className={cn("mt-2", fieldClass(state, "email"))}
        />
        <p className="mt-2 text-xs text-white/35">
          Only I see this. It&apos;s how the address reaches you.
        </p>
      </div>

      <fieldset>
        <legend className="text-xs uppercase tracking-[0.18em] text-white/40">
          Bringing anyone?
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-white/15 bg-white/[0.03] p-1">
          {[
            ["no", "Just me"],
            ["yes", "Plus one"],
          ].map(([value, label]) => (
            <label
              key={value}
              className="cursor-pointer rounded-lg py-2.5 text-center text-sm transition has-[:checked]:bg-white has-[:checked]:text-black hover:bg-white/10 has-[:checked]:hover:bg-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white/70"
            >
              <input
                type="radio"
                name="plusOne"
                value={value}
                checked={values.plusOne === value}
                onChange={() => set("plusOne")(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="rsvp-message" className="text-xs uppercase tracking-[0.18em] text-white/40">
          Leave a note
        </label>
        <textarea
          id="rsvp-message"
          name="message"
          rows={3}
          maxLength={500}
          placeholder="Anything you want on the wall."
          value={values.message}
          onChange={(event) => set("message")(event.target.value)}
          className={cn("mt-2 resize-none", fieldClass(state, "message"))}
        />
        <p className="mt-2 flex items-center justify-between text-xs text-white/35">
          <span>Notes show up publicly next to your name.</span>
          <span aria-hidden>{values.message.length}/500</span>
        </p>
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-white py-3.5 text-sm font-medium text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send RSVP"}
      </button>

      <p className="text-center text-xs text-white/30">
        RSVP by {EVENT.rsvpBy}.
      </p>
    </form>
  );
}
