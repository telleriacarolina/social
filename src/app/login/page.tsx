
import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";

import styles from "../auth-pages.module.css";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className={styles.page}>
      <Link
        href="/"
        className={styles.brand}
        aria-label="Social home"
      >
        social<span>.</span>
      </Link>

      <AuthForm mode="login" nextPath={params.next || "/account"} />

      {params.error === "auth" ? (
        <p className={styles.notice} role="alert">
          Your confirmation or password-reset link could not be verified.
          Please request a new link and try again.
        </p>
      ) : null}

      <Link href="/" className={styles.backLink}>
        Back to home
      </Link>
    </main>
  );
}
