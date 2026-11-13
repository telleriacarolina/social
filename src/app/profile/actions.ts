"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  validateProfile,
  type ProfileInput,
} from "@/lib/validation/profile";

type SaveProfileResult =
  | { success: true }
  | { success: false; error: string };

export async function saveProfile(
  input: unknown,
): Promise<SaveProfileResult> {
  if (
    typeof input !== "object" ||
    input === null ||
    !("username" in input) ||
    !("displayName" in input) ||
    !("bio" in input) ||
    typeof input.username !== "string" ||
    typeof input.displayName !== "string" ||
    typeof input.bio !== "string"
  ) {
    return {
      success: false,
      error: "Please correct the profile fields and try again.",
    };
  }

  const profileInput: ProfileInput = {
    username: input.username,
    displayName: input.displayName,
    bio: input.bio,
  };

  const validation = validateProfile(profileInput);

  if (!validation.success) {
    return {
      success: false,
      error: "Please correct the profile fields and try again.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "Your session has expired. Please sign in again.",
    };
  }

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({
      username: validation.data.username || null,
      display_name: validation.data.displayName || null,
      bio: validation.data.bio || null,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "That username is already taken.",
      };
    }

    return {
      success: false,
      error: "We could not save your profile. Please try again.",
    };
  }

  if (!updatedProfile) {
    return {
      success: false,
      error: "Your profile could not be found. Please refresh and try again.",
    };
  }

  revalidatePath("/profile");

  return { success: true };
}
