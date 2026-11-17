"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  requestPasswordResetAction,
  type AuthActionState,
} from "@/app/auth/actions";
import pageStyles from "@/app/auth-pages.module.css";
import formStyles from "@/components/auth/auth-form.module.css";

const initialState: AuthActionState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <main className={pageStyles.page}>
      <Link href="/login" className={pageStyles.brand}>
        Social<span>.</span>
      </Link>

      <section className={formStyles.formCard}>
        <h1 className={formStyles.title}>Reset your password</h1>

        <p className={formStyles.description}>
          Enter your email address and we’ll send you a reset link if an
          account exists.
        </p>

        <form action={formAction} className={formStyles.form}>
          <div className={formStyles.field}>
            <label htmlFor="email" className={formStyles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={formStyles.input}
            />
          </div>

          {state.error ? (
            <p className={formStyles.error} role="alert">
              {state.error}
            </p>
          ) : null}

          {state.message ? (
            <p className={formStyles.message} role="status">
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={formStyles.submit}
          >
            {pending ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className={formStyles.helper}>
          Remember your password?{" "}
          <Link href="/login" className={formStyles.link}>
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
