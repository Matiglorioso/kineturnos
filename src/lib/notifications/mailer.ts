import { siteConfig } from "@/lib/site-config";
import type { EmailContent } from "./templates";

/**
 * Envío de correos con la API transaccional de Brevo.
 * Sin `BREVO_API_KEY` el envío queda deshabilitado (desarrollo, CI, previews):
 * la notificación se registra como omitida y no sale ningún correo.
 */

export type MailerConfig = {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  /** Si está definido, todos los correos van a esta casilla (pruebas). */
  testRecipient?: string;
};

export type SendResult =
  | { status: "enviada"; providerId?: string }
  | { status: "omitida"; error: string }
  | { status: "fallida"; error: string };

export const MAIL_DISABLED_ERROR =
  "Envío de correos deshabilitado: falta configurar BREVO_API_KEY y MAIL_FROM_EMAIL.";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export function getMailerConfig(
  env: Record<string, string | undefined> = process.env
): MailerConfig | null {
  const apiKey = env.BREVO_API_KEY?.trim();
  const fromEmail = env.MAIL_FROM_EMAIL?.trim();
  if (!apiKey || !fromEmail) return null;

  return {
    apiKey,
    fromEmail,
    fromName: env.MAIL_FROM_NAME?.trim() || siteConfig.clinicName,
    replyTo: env.MAIL_REPLY_TO?.trim() || undefined,
    testRecipient: env.MAIL_TEST_RECIPIENT?.trim() || undefined,
  };
}

export type SendEmailInput = EmailContent & { to: string; toName: string };

export async function sendEmail(
  input: SendEmailInput,
  config: MailerConfig | null = getMailerConfig(),
  fetchImpl: typeof fetch = fetch
): Promise<SendResult> {
  if (!config) return { status: "omitida", error: MAIL_DISABLED_ERROR };

  const redirected = config.testRecipient !== undefined;
  const to = redirected ? config.testRecipient! : input.to;
  const subject = redirected ? `[Prueba → ${input.to}] ${input.subject}` : input.subject;

  try {
    const response = await fetchImpl(BREVO_URL, {
      method: "POST",
      headers: {
        "api-key": config.apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: config.fromEmail, name: config.fromName },
        to: [{ email: to, name: input.toName }],
        ...(config.replyTo ? { replyTo: { email: config.replyTo } } : {}),
        subject,
        htmlContent: input.html,
        textContent: input.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const body = (await response.json().catch(() => null)) as {
      messageId?: string;
      message?: string;
    } | null;

    if (!response.ok) {
      return {
        status: "fallida",
        error: `Brevo respondió ${response.status}: ${body?.message ?? "sin detalle"}`,
      };
    }

    return { status: "enviada", providerId: body?.messageId };
  } catch (error) {
    return {
      status: "fallida",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
