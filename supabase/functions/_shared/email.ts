// Shared by payment-webhook (receipt) and order-email (shipped, unpaid reminder).
// Brevo (free, can send from a verified Gmail address) or Resend (needs your own domain).
// Secrets: EMAIL_FROM ("Ada Atelier <you@gmail.com>") plus BREVO_API_KEY or RESEND_API_KEY.

export const env = (k: string) => Deno.env.get(k) ?? "";
export const site = () => env("SITE_URL").replace(/\/$/, "");

/** false until a sender and a provider key are set; callers then skip the email quietly */
export const emailReady = () => !!env("EMAIL_FROM") && (!!env("BREVO_API_KEY") || !!env("RESEND_API_KEY"));

export const money = (n: number) => `$${Number(n).toFixed(2)}`;

/** "₦514,000" or "$331.00" */
export function paidLabel(amount: number, currency: string) {
  if (currency === "USD") return money(amount);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-US")}`;
  }
}

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const trackUrl = (id: string, token: string) => `${site()}/track/${id}?t=${token}`;

/** The branded email: wordmark, heading, a paragraph, one button, then anything else. */
export function layout(p: { heading: string; intro: string; button: { label: string; url: string }; body?: string; footer: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f4f2ee;font-family:Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;padding:40px 32px">
        <tr><td style="font-family:Georgia,serif;font-size:13px;letter-spacing:6px;color:#151515">ADA ATELIER</td></tr>
        <tr><td style="padding-top:36px;font-family:Georgia,serif;font-size:34px;line-height:1.1;color:#151515">${p.heading}</td></tr>
        <tr><td style="padding-top:14px;font-size:14px;line-height:1.6;color:#55514b">${p.intro}</td></tr>
        <tr><td style="padding-top:28px">
          <a href="${p.button.url}" style="display:inline-block;background:#151515;color:#ffffff;text-decoration:none;font-size:12px;letter-spacing:2px;padding:16px 28px">${p.button.label.toUpperCase()}</a>
        </td></tr>
        ${p.body ? `<tr><td style="padding-top:36px">${p.body}</td></tr>` : ""}
        <tr><td style="padding-top:32px;font-size:12px;line-height:1.6;color:#8a857d">${p.footer}</td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

export async function sendEmail(m: { to: string; name: string; subject: string; html: string }) {
  const from = env("EMAIL_FROM");
  // "Ada Atelier <you@gmail.com>" -> name + address
  const match = /^(.*)<(.+)>$/.exec(from.trim());
  const sender = { name: (match?.[1] ?? "Ada Atelier").trim(), email: (match?.[2] ?? from).trim() };

  const res = env("BREVO_API_KEY")
    ? await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": env("BREVO_API_KEY"), "Content-Type": "application/json" },
        body: JSON.stringify({
          sender,
          replyTo: sender,
          to: [{ email: m.to, name: m.name }],
          subject: m.subject,
          htmlContent: m.html,
        }),
      })
    : await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, reply_to: sender.email, to: [m.to], subject: m.subject, html: m.html }),
      });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}
