/**
 * The shape the RSVP action hands back to the form.
 *
 * Lives outside `actions.ts` because a `"use server"` module may only export
 * async functions — a plain constant beside the action throws at request time.
 */
export interface RsvpState {
  status: "idle" | "ok" | "error";
  message: string;
  /** Field name to focus and outline when validation fails. */
  field?: "name" | "phone" | "email" | "message";
}

export const RSVP_IDLE: RsvpState = { status: "idle", message: "" };
