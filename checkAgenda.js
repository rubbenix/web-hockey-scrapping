const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const FILE_PATH = "./app/data/ben.json";

const CLUB_ID = "253";
const TEAM_NAME = "JESUS MARIA I JOSEP B";
const CATEGORIA = "BCN BENJAMÍ OR COPA BCN 2";

// Crear carpeta si no existe
const dir = path.dirname(FILE_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

async function getPartidos() {
  const response = await fetch(
    "https://server2.sidgad.es/fecapa/00_fecapa_agenda_1.php",
    {
      method: "POST",
      headers: {
        Origin: "https://www.hoqueipatins.fecapa.cat",
        Referer: "https://www.hoqueipatins.fecapa.cat/",
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "cliente=fecapa&idm=1&id_temp=31",
    }
  );

  if (!response.ok) throw new Error("Error HTTP en scraping");

  const html = await response.text();
  const $ = cheerio.load(html);

  const partidos = [];

  $(".fila_agenda").each((_, el) => {
    const tds = $(el).find("td");
    if (tds.length < 9) return;

    const categoria = $(tds[0]).text().trim();
    const fecha = $(tds[1]).text().trim();
    const hora = $(tds[2]).text().trim();
    const equipo_local = $(tds[4]).text().trim();
    const equipo_visitante = $(tds[6]).text().trim();
    const resultadoRaw = $(tds[7]).text().trim();
    const resultado = resultadoRaw.includes("-") ? resultadoRaw : null;
    const pista = $(tds[8]).text().trim();
    const club1 = $(el).attr("club1");
    const club2 = $(el).attr("club2");

    // 🔥 FILTRADO SOLO TU EQUIPO
    if (
      (club1 === CLUB_ID || club2 === CLUB_ID) &&
      (equipo_local === TEAM_NAME || equipo_visitante === TEAM_NAME) &&
      categoria === CATEGORIA
    ) {
      partidos.push({
        categoria,
        fecha,
        hora,
        equipo_local,
        equipo_visitante,
        resultado,
        pista,
      });
    }
  });

  if (partidos.length === 0) {
    throw new Error("No se encontraron partidos del equipo");
  }

  return partidos;
}

function escapeHtml(input) {
  const s = String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function partidoKey(p) {
  return `${p.fecha}|${p.equipo_local}|${p.equipo_visitante}`;
}

function formatPartidoShort(p) {
  return `${p.equipo_local} vs ${p.equipo_visitante}`;
}

function detectarCambios(antiguos, nuevos) {
  const cambios = [];
  const antiguosMap = new Map(antiguos.map((p) => [partidoKey(p), p]));
  const nuevosMap = new Map(nuevos.map((p) => [partidoKey(p), p]));

  for (const nuevo of nuevos) {
    const k = partidoKey(nuevo);
    const antiguo = antiguosMap.get(k);

    if (!antiguo) {
      cambios.push({ type: "added", before: null, after: nuevo });
      continue;
    }

    if (antiguo.hora !== nuevo.hora) {
      cambios.push({ type: "hora", before: antiguo, after: nuevo });
    }

    if (antiguo.resultado !== nuevo.resultado) {
      cambios.push({ type: "resultado", before: antiguo, after: nuevo });
    }

    if (Object.prototype.hasOwnProperty.call(antiguo, "pista") && (antiguo.pista ?? "") !== (nuevo.pista ?? "")) {
      cambios.push({ type: "pista", before: antiguo, after: nuevo });
    }
  }

  for (const antiguo of antiguos) {
    const k = partidoKey(antiguo);
    if (!nuevosMap.has(k)) {
      cambios.push({ type: "removed", before: antiguo, after: null });
    }
  }

  return cambios;
}

function buildEmailContent({ cambios, cachedAt }) {
  const counts = {
    added: cambios.filter((c) => c.type === "added").length,
    removed: cambios.filter((c) => c.type === "removed").length,
    hora: cambios.filter((c) => c.type === "hora").length,
    resultado: cambios.filter((c) => c.type === "resultado").length,
    pista: cambios.filter((c) => c.type === "pista").length,
  };

  const subject = `📊 Agenda actualizada (+${counts.added} -${counts.removed} ⏱${counts.hora} 🏁${counts.resultado})`;
  const cachedAtDisplay = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(cachedAt));

  const lines = [];
  lines.push(`Cambios detectados (${cachedAtDisplay}):`);
  lines.push(`+${counts.added} añadidos, -${counts.removed} eliminados, ⏱${counts.hora} hora, 🏁${counts.resultado} resultado, 📍${counts.pista} pista.`);
  lines.push("");

  for (const c of cambios) {
    const p = c.after ?? c.before;
    const partido = formatPartidoShort(p);
    if (c.type === "added") lines.push(`+ Nuevo: ${partido} (${p.fecha} ${p.hora})`);
    else if (c.type === "removed") lines.push(`- Eliminado: ${partido} (${p.fecha} ${p.hora})`);
    else if (c.type === "hora") lines.push(`⏱ Hora: ${partido} (${p.fecha}) ${c.before.hora} → ${c.after.hora}`);
    else if (c.type === "resultado") lines.push(`🏁 Resultado: ${partido} (${p.fecha}) ${c.before.resultado ?? "—"} → ${c.after.resultado ?? "—"}`);
    else if (c.type === "pista") lines.push(`📍 Pista: ${partido} (${p.fecha}) ${c.before.pista ?? "—"} → ${c.after.pista ?? "—"}`);
  }

  const badge = (label, bg, fg) =>
    `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${bg};color:${fg};font-size:12px;font-weight:800;">${escapeHtml(label)}</span>`;
  const preheader = `Canvis detectats: +${counts.added}, -${counts.removed}, ⏱${counts.hora}, 🏁${counts.resultado}.`;

  const badgeRow = [
    badge(`+${counts.added} afegits`, "#dcfce7", "#166534"),
    badge(`-${counts.removed} eliminats`, "#fee2e2", "#991b1b"),
    badge(`⏱${counts.hora} hora`, "#e0f2fe", "#075985"),
    badge(`🏁${counts.resultado} resultat`, "#ede9fe", "#5b21b6"),
    badge(`📍${counts.pista} pista`, "#ffedd5", "#9a3412"),
  ].join(" ");

  const typeMeta = {
    added: { label: "Afegit", bg: "#dcfce7", fg: "#166534" },
    removed: { label: "Eliminat", bg: "#fee2e2", fg: "#991b1b" },
    hora: { label: "Hora", bg: "#e0f2fe", fg: "#075985" },
    resultado: { label: "Resultat", bg: "#ede9fe", fg: "#5b21b6" },
    pista: { label: "Pista", bg: "#ffedd5", fg: "#9a3412" },
  };

  const rows = cambios
    .map((c) => {
      const p = c.after ?? c.before;
      const meta = typeMeta[c.type] ?? { label: c.type, bg: "#f3f4f6", fg: "#111827" };
      const beforeVal = c.before
        ? c.type === "hora"
          ? c.before.hora
          : c.type === "resultado"
            ? c.before.resultado ?? "—"
            : c.type === "pista"
              ? c.before.pista ?? "—"
              : "—"
        : "—";
      const afterVal = c.after
        ? c.type === "hora"
          ? c.after.hora
          : c.type === "resultado"
            ? c.after.resultado ?? "—"
            : c.type === "pista"
              ? c.after.pista ?? "—"
              : "—"
        : "—";
      const pill = `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${meta.bg};color:${meta.fg};font-size:12px;font-weight:800;">${escapeHtml(meta.label)}</span>`;
      return `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #f1f5f9;vertical-align:top;">${pill}</td>
        <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#374151;vertical-align:top;white-space:nowrap;">${escapeHtml(p.fecha)}<br/><span style="color:#6b7280;font-size:12px;">${escapeHtml(p.hora ?? "")}</span></td>
        <td style="padding:12px;border-bottom:1px solid #f1f5f9;font-weight:800;color:#111827;vertical-align:top;">${escapeHtml(formatPartidoShort(p))}</td>
        <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#6b7280;vertical-align:top;">${escapeHtml(beforeVal)}</td>
        <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#111827;vertical-align:top;">${escapeHtml(afterVal)}</td>
        <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#6b7280;vertical-align:top;">${escapeHtml(p.pista ?? "—")}</td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef2f7;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 12px;background:#eef2f7;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:760px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding:28px;background:linear-gradient(135deg,#0b4ea2,#2563eb);color:#ffffff;">
                <div style="font-size:24px;font-weight:900;">📊 Agenda actualitzada</div>
                <div style="margin-top:6px;font-size:14px;opacity:0.95;">S'han detectat canvis en els partits del teu equip</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 10px 28px;color:#111827;">
                <div style="display:flex;flex-wrap:wrap;gap:8px;">${badgeRow}</div>
                <div style="margin-top:14px;font-size:13px;color:#6b7280;">Darrera actualització: <strong style="color:#111827;">${escapeHtml(cachedAtDisplay)}</strong></div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px 28px;">
                <div style="margin-top:14px;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <tr style="background:#f8fafc;">
                      <th align="left" style="padding:12px;font-size:12px;color:#6b7280;">Tipus</th>
                      <th align="left" style="padding:12px;font-size:12px;color:#6b7280;">Data</th>
                      <th align="left" style="padding:12px;font-size:12px;color:#6b7280;">Partit</th>
                      <th align="left" style="padding:12px;font-size:12px;color:#6b7280;">Abans</th>
                      <th align="left" style="padding:12px;font-size:12px;color:#6b7280;">Ara</th>
                      <th align="left" style="padding:12px;font-size:12px;color:#6b7280;">Pista</th>
                    </tr>
                    ${rows}
                  </table>
                </div>
                <div style="margin-top:18px;">
                  <a href="${escapeHtml("https://www.hoqueipatins.fecapa.cat/")}" style="display:inline-block;padding:12px 16px;border-radius:12px;background:#0b4ea2;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;box-shadow:0 4px 14px rgba(11,78,162,0.3);">Veure l'agenda →</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
                Reps aquest correu perquè tens configurat l'avís de canvis de l'agenda.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text: lines.join("\n"), html };
}

async function enviarEmail({ subject, text, html }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject,
    text,
    html,
  });
}

async function main() {
  console.log("Comprobando partidos del equipo...");

  const nuevos = await getPartidos();

  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(
      FILE_PATH,
      JSON.stringify(
        {
          partidos: nuevos,
          cachedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log("Archivo inicial creado.");
    return;
  }

  const raw = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
  const antiguos = Array.isArray(raw) ? raw : raw.partidos || [];
  const cambios = detectarCambios(antiguos, nuevos);

  if (cambios.length > 0) {
    console.log("Cambios detectados 🚨");

    fs.writeFileSync(
      FILE_PATH,
      JSON.stringify(
        {
          partidos: nuevos,
          cachedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );


    const content = buildEmailContent({ cambios, cachedAt: new Date().toISOString() });
    await enviarEmail(content);

    console.log("Email enviado.");
  } else {
    console.log("Sin cambios.");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});