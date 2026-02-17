import type { Partido } from "@/app/api/agenda/route";
import { listSubscribers, makeUnsubscribeToken } from "@/app/lib/subscriptions";
import { diffAgenda } from "@/app/lib/agenda-hash";
import { sendEmail } from "@/app/lib/mailer";

function formatPartido(p: Partido) {
  return `${p.fecha} ${p.hora} — ${p.equipo_local} vs ${p.equipo_visitante} (${p.pista})`;
}

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
  return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${bg};color:${fg};font-size:12px;line-height:18px;font-weight:600;">${escapeHtml(label)}</span>`;
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
  const safeCachedAt = escapeHtml(opts.cachedAt);

  const sumBadges = [
    badge(`+${added.length} afegits`, "#dcfce7", "#166534"),
    badge(`-${removed.length} eliminats`, "#fee2e2", "#991b1b"),
    badge(`~${changed.length} modificats`, "#ffedd5", "#9a3412"),
  ].join(" ");

  const preheader = `Canvis detectats: +${added.length}, -${removed.length}, ~${changed.length}.`;

  let html = `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:18px 20px;background:#0b4ea2;color:#ffffff;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
                <div style="font-size:14px;opacity:0.9;">Avís d'agenda</div>
                <div style="font-size:22px;font-weight:800;line-height:28px;">S'ha actualitzat l'agenda</div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 20px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;">
                <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                  ${sumBadges}
                </div>
                <div style="margin-top:10px;font-size:13px;color:#6b7280;">Darrera actualització: <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New;">${safeCachedAt}</span></div>
                <div style="margin-top:14px;">
                  <a href="${safeBaseUrl}/" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#0b4ea2;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">Veure l'agenda</a>
                </div>
              </td>
            </tr>`;

  function renderTable(title: string, toneBg: string, toneFg: string, items: Partido[]) {
    if (items.length === 0) return "";
    const rows = items.slice(0, maxItems).map((p) => {
      const when = `${escapeHtml(p.fecha)} <span style=\"color:#6b7280\">·</span> <span style=\"font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New;\">${escapeHtml(p.hora)}</span>`;
      const match = escapeHtml(formatPartidoShort(p));
      const where = escapeHtml(p.pista);
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:13px;">${when}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:13px;font-weight:700;">${match}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-size:13px;color:#374151;">${where}</td>
        </tr>`;
    }).join("");

    const more = items.length > maxItems
      ? `<div style="margin-top:8px;font-size:12px;color:#6b7280;">… y ${items.length - maxItems} más</div>`
      : "";

    return `
      <tr>
        <td style="padding:0 20px 18px 20px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
          <div style="margin-top:8px;padding:12px 14px;border-radius:12px;background:#f8fafc;border:1px solid #eef2f7;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:10px;height:10px;border-radius:999px;background:${toneBg};"></div>
              <div style="font-size:15px;font-weight:800;color:${toneFg};">${escapeHtml(title)} (${items.length})</div>
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:10px;border-collapse:collapse;">
              <tr>
                <th align="left" style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;font-weight:700;">Cuándo</th>
                <th align="left" style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;font-weight:700;">Partido</th>
                <th align="left" style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;font-weight:700;">Pista</th>
              </tr>
              ${rows}
            </table>
            ${more}
          </div>
        </td>
      </tr>`;
  }

  html += renderTable("Afegits", "#16a34a", "#166534", added);
  html += renderTable("Eliminats", "#dc2626", "#991b1b", removed);

  if (changed.length) {
    const items = changed.slice(0, maxItems).map(({ before, after }) => {
      const title = escapeHtml(formatPartidoShort(after));
      const sub = `${escapeHtml(after.fecha)} · ${escapeHtml(after.hora)} · ${escapeHtml(after.pista)}`;

      const diffs: string[] = [];
      if (before.fecha !== after.fecha) diffs.push(`<tr><td style="padding:6px 10px;color:#6b7280;font-size:12px;">Fecha</td><td style="padding:6px 10px;font-size:12px;"><span style="text-decoration:line-through;color:#9ca3af;">${escapeHtml(before.fecha)}</span></td><td style="padding:6px 10px;font-size:12px;font-weight:700;color:#111827;">${escapeHtml(after.fecha)}</td></tr>`);
      if (before.hora !== after.hora) diffs.push(`<tr><td style="padding:6px 10px;color:#6b7280;font-size:12px;">Hora</td><td style="padding:6px 10px;font-size:12px;"><span style="text-decoration:line-through;color:#9ca3af;">${escapeHtml(before.hora)}</span></td><td style="padding:6px 10px;font-size:12px;font-weight:700;color:#111827;">${escapeHtml(after.hora)}</td></tr>`);
      if (before.pista !== after.pista) diffs.push(`<tr><td style="padding:6px 10px;color:#6b7280;font-size:12px;">Pista</td><td style="padding:6px 10px;font-size:12px;"><span style="text-decoration:line-through;color:#9ca3af;">${escapeHtml(before.pista)}</span></td><td style="padding:6px 10px;font-size:12px;font-weight:700;color:#111827;">${escapeHtml(after.pista)}</td></tr>`);
      if (before.resultado !== after.resultado) diffs.push(`<tr><td style="padding:6px 10px;color:#6b7280;font-size:12px;">Resultado</td><td style="padding:6px 10px;font-size:12px;"><span style="text-decoration:line-through;color:#9ca3af;">${escapeHtml(before.resultado ?? "-")}</span></td><td style="padding:6px 10px;font-size:12px;font-weight:700;color:#111827;">${escapeHtml(after.resultado ?? "-")}</td></tr>`);

      const diffRows = diffs.join("");

      return `
        <div style="margin-top:12px;padding:12px 14px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;">
          <div style="font-weight:900;color:#9a3412;">${title}</div>
          <div style="margin-top:2px;font-size:12px;color:#6b7280;">${escapeHtml(sub)}</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:10px;border-collapse:collapse;background:#ffffff;border-radius:10px;overflow:hidden;">
            <tr>
              <th align="left" style="padding:8px 10px;background:#fff7ed;border-bottom:1px solid #fee6c7;color:#9a3412;font-size:12px;font-weight:800;">Campo</th>
              <th align="left" style="padding:8px 10px;background:#fff7ed;border-bottom:1px solid #fee6c7;color:#9a3412;font-size:12px;font-weight:800;">Antes</th>
              <th align="left" style="padding:8px 10px;background:#fff7ed;border-bottom:1px solid #fee6c7;color:#9a3412;font-size:12px;font-weight:800;">Ahora</th>
            </tr>
            ${diffRows}
          </table>
        </div>`;
    }).join("");

    const more = changed.length > maxItems
      ? `<div style="margin-top:10px;font-size:12px;color:#6b7280;">… y ${changed.length - maxItems} más</div>`
      : "";

    html += `
      <tr>
        <td style="padding:0 20px 18px 20px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
          <div style="padding:12px 14px;border-radius:12px;background:#f8fafc;border:1px solid #eef2f7;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:10px;height:10px;border-radius:999px;background:#f59e0b;"></div>
              <div style="font-size:15px;font-weight:800;color:#9a3412;">Modificats (${changed.length})</div>
            </div>
            ${items}
            ${more}
          </div>
        </td>
      </tr>`;
  }

  html += `
            <tr>
              <td style="padding:14px 20px;background:#f8fafc;border-top:1px solid #eef2f7;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#6b7280;font-size:12px;">
                <div>Has rebut aquest correu perquè estàs subscrit/a als avisos.</div>
                <div style="margin-top:8px;">L'enllaç de baixa és al final del correu.</div>
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
        `S'ha detectat un canvi a l'agenda (${opts.cachedAt}).\n` +
        `Resum: +${added.length} afegits, -${removed.length} eliminats, ~${changed.length} modificats.\n\n` +
        `Veure l'agenda: ${opts.baseUrl}/\n\n` +
        `Baixa: ${unsubUrl}`,
      html: html.replace(
        "L'enllaç de baixa és al final del correu.",
        `L'enllaç de baixa és aquí: <a href=\"${escapeHtml(unsubUrl)}\" style=\"color:#0b4ea2;\">donar-me de baixa</a>.`
      ),
    });
    sent++;
  }
  return { notified: sent, tokens };
}
