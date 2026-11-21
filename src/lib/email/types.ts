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

// Accept one bare mailbox, not display names, lists, or header syntax.
export function isEmail(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 254) {
    return false;
  }

  const [local] = value.split("@");

  if (
    !local ||
    local.length > 64 ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..")
  ) {
    return false;
  }

  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(
    value,
  );
}

export function validateMailInput(input: MailInput): void {
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
    throw new MailError(
      "input",
      "Email recipient, subject, or text is invalid.",
    );
  }
}