import "server-only";

export type MailInput = {
  to: string;
  subject: string;
  text: string;
};

export class MailError extends Error {
  constructor(
    public readonly code: "configuration" | "input" | "delivery",
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "MailError";
  }
}

// Accept a single bare mailbox, not display names, lists, or header syntax.
function isEmail(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 254) return false;
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(value);
}

/**
 * For trusted server-side callers only. Never expose this as an arbitrary-
 * recipient endpoint or pass unchecked request/form data directly to it.
 */
export async function sendEmail(input: MailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey?.trim() || /[\r\n]/.test(apiKey) || !isEmail(from)) {
    throw new MailError("configuration", "Email service is not configured correctly.");
  }
  if (from.split("@")[1].toLowerCase() === "resend.dev") {
    throw new MailError("configuration", "Email sender must use your verified domain.");
  }
  if (
    !input ||
    !isEmail(input.to) ||
    typeof input.subject !== "string" ||
    !input.subject.trim() ||
    input.subject.length > 998 ||
    /[\r\n]/.test(input.subject) ||
    typeof input.text !== "string" ||
    !input.text.trim() ||
    input.text.length > 100_000
  ) {
    throw new MailError("input", "Email recipient, subject, or text is invalid.");
  }

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
    throw new MailError("delivery", "Email delivery failed.", response.status);
  }
}
