import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

type AccountPageProps = {
  searchParams: Promise<{ password?: string; signout?: string }>;
};

export default async function AccountPage({
  searchParams,
}: AccountPageProps) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login?next=/account");
  }

  const params = await searchParams;

  return (
    <main>
      <h1>Your account</h1>
      <p>You are signed in successfully.</p>

      {params.password === "updated" ? (
        <p role="status">Your password has been updated.</p>
      ) : null}

      {params.signout === "failed" ? (
        <p role="alert">We could not sign you out. Please try again.</p>
      ) : null}

      <form action={signOutAction}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
