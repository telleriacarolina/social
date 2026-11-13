"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  requestPasswordResetAction,
  type AuthActionState,
} from "@/app/auth/actions";

const initialState: AuthActionState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <main>
      <h1>Reset your password</h1>
      <p>Enter your email address and we’ll send you a reset link if an account exists.</p>

      <form action={formAction}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        {state.error ? <p role="alert">{state.error}</p> : null}
        {state.message ? <p role="status">{state.message}</p> : null}

        <button type="submit" disabled={pending}>
          {pending ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p>
        <Link href="/login">Back to sign in</Link>
      </p>
    </main>
  );
}