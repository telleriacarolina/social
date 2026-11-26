import "server-only";

import {
  SESv2Client,
  SendEmailCommand,
} from "@aws-sdk/client-sesv2";

import {
  isEmail,
  MailError,
  validateMailInput,
  type MailInput,
} from "./types";

export { MailError };
export type { MailInput };

let client: SESv2Client | undefined;
let clientRegion: string | undefined;

function getSesClient(): SESv2Client {
  const region = process.env.AWS_REGION?.trim();

  if (!region || /[\r\n]/.test(region)) {
    throw new MailError(
      "configuration",
      "Email service is not configured correctly.",
    );
  }

  if (!client || clientRegion !== region) {
    client = new SESv2Client({
      region,
      maxAttempts: 1,
    });
    clientRegion = region;
  }

  return client;
}

/**
 * Trusted server-side SES transport.
 *
 * Credentials are resolved by the AWS SDK's default credential provider
 * chain. Do not pass credentials from form data or client requests.
 */
export async function sendSesEmail(input: MailInput): Promise<void> {
  const from = process.env.SES_FROM_EMAIL;

  if (!isEmail(from)) {
    throw new MailError(
      "configuration",
      "Email service is not configured correctly.",
    );
  }

  validateMailInput(input);

  try {
    const sesClient = getSesClient();

    await sesClient.send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: {
          ToAddresses: [input.to],
        },
        Content: {
          Simple: {
            Subject: {
              Data: input.subject,
              Charset: "UTF-8",
            },
            Body: {
              Text: {
                Data: input.text,
                Charset: "UTF-8",
              },
            },
          },
        },
      }),
      {
        abortSignal: AbortSignal.timeout(10_000),
      },
    );
  } catch (error) {
    if (error instanceof MailError && error.code === "configuration") {
      throw error;
    }

    // Do not propagate AWS SDK errors, request details, or credentials.
    throw new MailError("delivery", "Email delivery failed.");
  }
}
