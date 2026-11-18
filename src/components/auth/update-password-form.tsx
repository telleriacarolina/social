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
    <section className="content-card">
      <h1 className="page-title">Choose a new password</h1>

      <p className="page-description">
        Your new password must be at least 8 characters.
      </p>

      <form action={formAction} className="form-stack">
        <div className="form-field">
          <label className="form-label" htmlFor="password">
            New password
          </label>
          <input
            className="form-control"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            className="form-control"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {state.error ? (
          <p className="notice notice--error" role="alert">
            {state.error}
          </p>
        ) : null}

        {state.message ? (
          <p className="notice notice--success" role="status">
            {state.message}
          </p>
        ) : null}

        <button
          className="button button--primary"
          type="submit"
          disabled={pending}
        >
          {pending ? "Updating..." : "Update password"}
        </button>
      </form>

      <p className="page-description">
        <Link className="link" href="/login">
          Back to sign in
        </Link>
      </p>
    </section>
  );
}