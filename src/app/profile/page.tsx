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

  if (profileError) {
    return (
      <main>
        <h1>Your profile</h1>
        <p role="alert">We could not load your profile. Please try again.</p>
        <form action={signOutAction}>
          <button type="submit">Sign out</button>
        </form>
      </main>
    );
  }

  return (
    <main>
      <h1>Your profile</h1>
      <p>{user.email}</p>
      <ProfileEditor
        initialValues={{
          username: profile?.username ?? "",
          displayName: profile?.display_name ?? "",
          bio: profile?.bio ?? "",
        }}
      />
      <form action={signOutAction}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
