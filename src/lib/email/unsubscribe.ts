import crypto from "crypto";
import { env, serverEnv } from "@/lib/env";

/**
 * CAN-SPAM unsubscribe tokens + marketing footer.
 *
 * The token is a signed, NON-expiring capability that identifies the recipient's
 * email address (unsubscribe links must keep working indefinitely, so unlike the
 * voice stream token there is no exp). It carries the email so /api/unsubscribe
 * can suppress the address with no DB lookup and without exposing an enumerable
 * id. Format: base64url(email).base64url(hmac_sha256(email)).
 */

function secret(): string {
  const s = serverEnv.UNSUBSCRIBE_TOKEN_SECRET;
  if (!s) {
    throw new Error("UNSUBSCRIBE_TOKEN_SECRET (or CRON_SECRET fallback) is not configured");
  }
  return s;
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export function signUnsubscribeToken(email: string): string {
  const normalized = normalize(email);
  const emailPart = Buffer.from(normalized).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(normalized).digest("base64url");
  return `${emailPart}.${sig}`;
}

/** Verify a token and return the email it authorizes, or null if invalid. */
export function verifyUnsubscribeToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [emailPart, sig] = parts;
  let email: string;
  try {
    email = Buffer.from(emailPart, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!email) return null;

  const expected = crypto.createHmac("sha256", secret()).update(email).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  return email;
}

export function unsubscribeUrl(email: string): string {
  const token = signUnsubscribeToken(email);
  return `${env.APP_URL}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * List-Unsubscribe / List-Unsubscribe-Post headers (RFC 2369 + RFC 8058) for a
 * marketing message to `email`. The URL variant powers Gmail/Apple one-click; the
 * mailto is the fallback. List-Unsubscribe-Post makes it a true one-click POST.
 */
export function unsubscribeHeaders(email: string): Record<string, string> {
  const mailbox = serverEnv.UNSUBSCRIBE_MAILBOX;
  return {
    "List-Unsubscribe": `<mailto:${mailbox}?subject=unsubscribe>, <${unsubscribeUrl(email)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * CAN-SPAM-compliant footer appended to every marketing email: a working
 * unsubscribe link plus a valid physical postal address. `email` is the
 * recipient, so the unsubscribe link is personalized to them.
 */
export function marketingFooterHtml(email: string): string {
  const link = unsubscribeUrl(email);
  const address = serverEnv.COMPANY_POSTAL_ADDRESS;
  const company = serverEnv.COMPANY_NAME;
  return `
  <div style="max-width:600px;margin:16px auto 0;padding:16px 24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <p style="margin:0;font-size:11px;line-height:1.6;color:#9ca3af;text-align:center;">
      You are receiving this because you asked Callverted about recovering missed calls.
      <br>
      <a href="${link}" style="color:#6b7280;text-decoration:underline;">Unsubscribe from these emails</a>
    </p>
    <p style="margin:8px 0 0;font-size:11px;line-height:1.6;color:#9ca3af;text-align:center;">
      ${company} · ${address}
    </p>
  </div>`.trim();
}

/**
 * Inject the marketing footer into an HTML email. Inserts before </body> when
 * present, otherwise appends — either way email clients render it at the end.
 */
export function withMarketingFooter(html: string, email: string): string {
  const footer = marketingFooterHtml(email);
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footer}</body>`);
  }
  return `${html}${footer}`;
}
