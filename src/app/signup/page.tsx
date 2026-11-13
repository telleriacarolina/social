
import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";

import styles from "../auth-pages.module.css";

export default function SignupPage() {
  return (
    <main className={styles.page}>
      <Link
        href="/"
        className={styles.brand}
        aria-label="Social home"
      >
        social<span>.</span>
      </Link>

      <AuthForm mode="signup" />

      <Link href="/" className={styles.backLink}>
        Back to home
      </Link>
    </main>
  );
}
