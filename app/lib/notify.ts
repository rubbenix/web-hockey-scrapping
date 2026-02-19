import type { Partido } from "@/app/api/agenda/route";
import { listSubscribers, makeUnsubscribeToken } from "@/app/lib/subscriptions";
import { diffAgenda } from "@/app/lib/agenda-hash";
import { sendEmail } from "@/app/lib/mailer";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPartidoShort(p: Partido) {
  return `${p.equipo_local} vs ${p.equipo_visitante}`;
}

function badge(label: string, bg: string, fg: string) {
  return `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${bg};color:${fg};font-size:12px;font-weight:700;">${escapeHtml(label)}</span>`;
}

function formatCachedAtDisplay(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export async function notifyAgendaChanged(opts: {
  baseUrl: string;
  before: Partido[];
  after: Partido[];
  cachedAt: string;
}) {
  const to = await listSubscribers();
  if (to.length === 0) return { notified: 0 };

  const { added, removed, changed } = diffAgenda(opts.before, opts.after);

  const subject = "Agenda actualitzada";
  const maxItems = 10;
  const safeBaseUrl = escapeHtml(opts.baseUrl);
  const cachedAtDisplay = formatCachedAtDisplay(opts.cachedAt);
  const safeCachedAt = escapeHtml(cachedAtDisplay);

  const sumBadges = [
    badge(`+${added.length} afegits`, "#dcfce7", "#166534"),
    badge(`-${removed.length} eliminats`, "#fee2e2", "#991b1b"),
    badge(`~${changed.length} modificats`, "#ffedd5", "#9a3412"),
  ].join(" ");

  const preheader = `Canvis detectats: +${added.length}, -${removed.length}, ~${changed.length}.`;

  function renderTable(title: string, toneBg: string, toneFg: string, items: Partido[]) {
    if (items.length === 0) return "";

    const rows = items.slice(0, maxItems).map((p) => `
      <tr>
        <td style="padding:14px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#374151;">
          ${escapeHtml(p.fecha)} · <strong>${escapeHtml(p.hora)}</strong>
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:700;color:#111827;">
          ${escapeHtml(formatPartidoShort(p))}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#6b7280;">
          ${escapeHtml(p.pista)}
        </td>
      </tr>
    `).join("");

    return `
      <tr>
        <td style="padding:0 28px 28px 28px;">
          <div style="margin-top:24px;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;background:#ffffff;">
            <div style="padding:14px 18px;background:${toneBg};color:${toneFg};font-weight:800;font-size:14px;">
              ${escapeHtml(title)} (${items.length})
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr style="background:#f8fafc;">
                <th align="left" style="padding:10px 12px;font-size:12px;color:#6b7280;">Data</th>
                <th align="left" style="padding:10px 12px;font-size:12px;color:#6b7280;">Partit</th>
                <th align="left" style="padding:10px 12px;font-size:12px;color:#6b7280;">Pista</th>
              </tr>
              ${rows}
            </table>
          </div>
        </td>
      </tr>
    `;
  }

  let html = `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
${escapeHtml(preheader)}
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 12px;background:#eef2f7;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

<tr>
<td style="padding:28px;background:linear-gradient(135deg,#0b4ea2,#2563eb);color:#ffffff;">
<div style="font-size:24px;font-weight:800;">
📊 Agenda actualitzada
</div>
<div style="margin-top:6px;font-size:14px;opacity:0.9;">
S'han detectat canvis en els partits del teu equip
</div>
</td>
</tr>

<tr>
<td style="padding:24px 28px 10px 28px;color:#111827;">
<div style="display:flex;flex-wrap:wrap;gap:8px;">
${sumBadges}
</div>

<div style="margin-top:14px;font-size:13px;color:#6b7280;">
Darrera actualització:
<strong style="color:#111827;">${safeCachedAt}</strong>
</div>

<div style="margin-top:22px;">
<a href="${safeBaseUrl}/"
style="display:inline-block;padding:14px 20px;border-radius:12px;background:#0b4ea2;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(11,78,162,0.3);">
Veure l'agenda completa →
</a>
</div>
</td>
</tr>
`;

  html += renderTable("Afegits", "#dcfce7", "#166534", added);
  html += renderTable("Eliminats", "#fee2e2", "#991b1b", removed);

  html += `
<tr>
<td style="padding:22px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
Reps aquest correu perquè estàs subscrit/a als avisos de l'agenda.
</td>
</tr>

</table>
</td>
</tr>
</table>

</body>
</html>`;

  let sent = 0;
  const tokens = Object.fromEntries(to.map((email) => [email, makeUnsubscribeToken(email)]));

  for (const email of to) {
    const token = tokens[email];
    const unsubUrl = `${opts.baseUrl}/api/subscriptions?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

    await sendEmail({
      to: [email],
      subject,
      text:
        `S'ha detectat un canvi a l'agenda (${cachedAtDisplay}).\n` +
        `Resum: +${added.length} afegits, -${removed.length} eliminats, ~${changed.length} modificats.\n\n` +
        `Veure l'agenda: ${opts.baseUrl}/\n\n` +
        `Baixa: ${unsubUrl}`,
      html: html.replace(
        "Reps aquest correu perquè estàs subscrit/a als avisos de l'agenda.",
        `Reps aquest correu perquè estàs subscrit/a als avisos de l'agenda.<br/><br/>
        <a href="${escapeHtml(unsubUrl)}" style="color:#0b4ea2;font-weight:600;text-decoration:none;">
        Donar-me de baixa
        </a>`
      ),
    });

    sent++;
  }

  return { notified: sent, tokens };
}