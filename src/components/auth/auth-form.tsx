"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  signInAction,
  signUpAction,
  type AuthActionState,
} from "@/app/auth/actions";

type AuthFormProps = {
  mode: "login" | "signup";
  nextPath?: string;
};

const initialState: AuthActionState = {};

export function AuthForm({ mode, nextPath = "/profile" }: AuthFormProps) {
  const isSignup = mode === "signup";
  const action = isSignup ? signUpAction : signInAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section>
      <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>

      <p>
        {isSignup
          ? "Sign up to start building your social profile."
          : "Sign in to view and manage your profile."}
      </p>

      <form action={formAction}>
        {!isSignup ? (
          <input type="hidden" name="next" value={nextPath} />
        ) : null}

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

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            {...(isSignup ? { minLength: 8 } : {})}
          />
        </div>

        {state.error ? <p role="alert">{state.error}</p> : null}
        {state.message ? <p role="status">{state.message}</p> : null}

        <button type="submit" disabled={pending}>
          {pending ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      {!isSignup ? (
        <p>
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>
      ) : null}

      <p>
        {isSignup ? "Already have an account? " : "New here? "}
        <Link href={isSignup ? "/login" : "/signup"}>
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}
