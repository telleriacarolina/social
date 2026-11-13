"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  message?: string;
};

function getFormValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function logAuthError(operation: string, error: unknown): void {
  const details =
    typeof error === "object" && error !== null
      ? (error as {
          name?: unknown;
          message?: unknown;
          code?: unknown;
          status?: unknown;
        })
      : {};

  let message =
    typeof details.message === "string" ? details.message : "Unknown error";

  for (const secret of [
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_JWT_SECRET,
  ]) {
    if (secret) message = message.split(secret).join("[REDACTED]");
  }

  message = message
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[REDACTED_TOKEN]",
    )
    .replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+\b/g, "[REDACTED_KEY]");

  console.error("[auth] action failed", {
    operation,
    name: typeof details.name === "string" ? details.name : "Error",
    message,
    code: typeof details.code === "string" ? details.code : undefined,
    status: typeof details.status === "number" ? details.status : undefined,
  });
}

function getSafeNextPath(value: string): string {
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\u0000-\u001f]/.test(value)
  ) {
    return value;
  }

  return "/profile";
}

function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!configuredUrl) {
    throw new Error("Application URL is not configured.");
  }

  const url = new URL(configuredUrl);

  if (
    url.protocol !== "https:" &&
    url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1"
  ) {
    throw new Error("Application URL must use HTTPS.");
  }

  return url.origin;
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getFormValue(formData, "email").trim().toLowerCase();
  const password = getFormValue(formData, "password");
  const nextPath = getSafeNextPath(getFormValue(formData, "next"));

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logAuthError("signIn", error);
      return {
        error: "Unable to sign in. Check your details and try again.",
      };
    }
  } catch (error) {
    logAuthError("signIn", error);
    return {
      error: "Sign-in is temporarily unavailable. Please try again.",
    };
  }

  redirect(nextPath);
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getFormValue(formData, "email").trim().toLowerCase();
  const password = getFormValue(formData, "password");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  if (password.length < 8) {
    return { error: "Your password must be at least 8 characters." };
  }

  let hasSession = false;

  try {
    const appUrl = getAppUrl();
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback?next=/profile`,
      },
    });

    if (error) {
      logAuthError("signUp", error);
      return {
        error: "Unable to create your account. Please try again.",
      };
    }
    hasSession = Boolean(data.session);
  } catch (error) {
    logAuthError("signUp", error);
    return {
      error: "Account creation is temporarily unavailable. Please try again.",
    };
  }

  if (hasSession) {
    redirect("/profile");
  }

  return {
    message:
      "Account request received. Check your email for the confirmation link.",
  };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getFormValue(formData, "email").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  try {
    const appUrl = getAppUrl();
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/auth/update-password`,
    });

    if (error) {
      return {
        error: "Unable to send the reset email. Please try again.",
      };
    }

    return {
      message:
        "If an account exists for that address, a password-reset email will be sent.",
    };
  } catch {
    return {
      error: "Password reset is temporarily unavailable. Please try again.",
    };
  }
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = getFormValue(formData, "password");
  const confirmation = getFormValue(formData, "confirmPassword");

  if (password.length < 8) {
    return { error: "Your password must be at least 8 characters." };
  }

  if (password !== confirmation) {
    return { error: "The passwords do not match." };
  }

  try {
    const supabase = await createClient();

    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims) {
      return {
        error: "Your reset session is invalid or expired. Request another link.",
      };
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return {
        error: "Unable to update your password. Please try again.",
      };
    }
  } catch {
    return {
      error: "Password update is temporarily unavailable. Please try again.",
    };
  }

  redirect("/account?password=updated");
}

export async function signOutAction(): Promise<void> {
  let signOutFailed = false;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    signOutFailed = Boolean(error);
  } catch {
    signOutFailed = true;
  }

  if (signOutFailed) {
    redirect("/account?signout=failed");
  }

  redirect("/");
}
