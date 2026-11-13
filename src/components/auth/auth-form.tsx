"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  signInAction,
  signUpAction,
  type AuthActionState,
} from "@/app/auth/actions";

import styles from "./auth-form.module.css";

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
    <section className={styles.formCard}>
      <h1 className={styles.title}>
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>

      <p className={styles.description}>
        {isSignup
          ? "Sign up to start building your social profile."
          : "Sign in to view and manage your profile."}
      </p>

      <form action={formAction} className={styles.form}>
        {!isSignup && <input type="hidden" name="next" value={nextPath} />}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Email</label>
          <input className={styles.input} id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Password</label>
          <input
            className={styles.input}
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            {...(isSignup ? { minLength: 8 } : {})}
          />
        </div>

        {state.error && <p className={styles.error} role="alert">{state.error}</p>}
        {state.message && <p className={styles.message} role="status">{state.message}</p>}

        <button className={styles.submit} type="submit" disabled={pending}>
          {pending ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      {!isSignup && (
        <p className={styles.helper}>
          <Link className={styles.link} href="/forgot-password">Forgot your password?</Link>
        </p>
      )}

      <p className={styles.helper}>
        {isSignup ? "Already have an account? " : "New here? "}
        <Link className={styles.link} href={isSignup ? "/login" : "/signup"}>
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}