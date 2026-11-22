import "server-only";

import {
  isEmail,
  MailError,
  validateMailInput,
  type MailInput,
} from "./types";

export { MailError };
export type { MailInput };

/**
 * For trusted server-side callers only. Never expose this as an arbitrary-
 * recipient endpoint or pass unchecked request/form data directly to it.
 */
export async function sendResendEmail(input: MailInput): Promise<void> {
  const rawApiKey = process.env.RESEND_API_KEY;
  const apiKey = rawApiKey?.trim();
  const from = process.env.RESEND_FROM_EMAIL;

  if (
    !apiKey ||
    /[\r\n]/.test(rawApiKey ?? "") ||
    !isEmail(from)
  ) {
    throw new MailError(
      "configuration",
      "Email service is not configured correctly.",
    );
  }

  const isAllowedPreviewTestSender =
    from.toLowerCase() === "onboarding@resend.dev" &&
    process.env.RESEND_ALLOW_TEST_SENDER === "true" &&
    process.env.VERCEL_ENV === "preview";

  if (
    from.split("@")[1].toLowerCase() === "resend.dev" &&
    !isAllowedPreviewTestSender
  ) {
    throw new MailError(
      "configuration",
      "Email sender must use your verified domain.",
    );
  }

  validateMailInput(input);

  let response: Response;

  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
      cache: "no-store",
    });
  } catch {
    // Do not propagate transport errors: they may contain request credentials.
    throw new MailError("delivery", "Email delivery failed.");
  }

  if (!response.ok) {
    // Never include the provider body, headers, or request in an error or log.
    throw new MailError(
      "delivery",
      "Email delivery failed.",
      response.status,
    );
  }
}

// Backwards-compatible export for existing direct Resend callers.
export const sendEmail = sendResendEmail;
