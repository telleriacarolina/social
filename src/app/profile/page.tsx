import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?next=/profile");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, display_name, bio")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="page-shell page-shell--wide">
      <section className="content-card">
        <h1 className="page-title">Your profile</h1>
        <p className="page-description">{user.email}</p>

        {profileError ? (
          <p className="notice notice--error" role="alert">
            We could not load your profile. Please try again.
          </p>
        ) : (
          <ProfileEditor
            initialValues={{
              username: profile?.username ?? "",
              displayName: profile?.display_name ?? "",
              bio: profile?.bio ?? "",
            }}
          />
        )}

        <form action={signOutAction} className="page-actions">
          <button className="button button--secondary" type="submit">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}