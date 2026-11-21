import "server-only";

import { MailError, type MailInput } from "./types";
import { sendResendEmail } from "./resend";
import { sendSesEmail } from "./ses";

export { MailError };
export type { MailInput };

export async function sendEmail(input: MailInput): Promise<void> {
  const provider = (process.env.EMAIL_PROVIDER || "resend")
    .trim()
    .toLowerCase();

  switch (provider) {
    case "resend":
      await sendResendEmail(input);
      return;

    case "ses":
      await sendSesEmail(input);
      return;

    default:
      throw new MailError(
        "configuration",
        "Email provider is not configured correctly.",
      );
  }
}