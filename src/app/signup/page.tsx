import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <main>
      <AuthForm mode="signup" />
      <p>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}
