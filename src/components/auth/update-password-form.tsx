"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updatePasswordAction, type AuthActionState } from "@/app/auth/actions";

const initialState: AuthActionState = {};

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  return (
    <section>
      <h1>Choose a new password</h1>
      <p>Your new password must be at least 8 characters.</p>

      <form action={formAction}>
        <div>
          <label htmlFor="password">New password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {state.error ? <p role="alert">{state.error}</p> : null}
        {state.message ? <p role="status">{state.message}</p> : null}

        <button type="submit" disabled={pending}>
          {pending ? "Updating..." : "Update password"}
        </button>
      </form>

      <p>
        <Link href="/login">Back to sign in</Link>
      </p>
    </section>
  );
}
