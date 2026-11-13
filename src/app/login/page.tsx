import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;

  return (
    <main>
      <AuthForm mode="login" nextPath={params.next || "/account"} />

      {params.error === "auth" ? (
        <p role="alert">
          Your confirmation or password-reset link could not be verified.
          Please request a new link and try again.
        </p>
      ) : null}

      <p>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}