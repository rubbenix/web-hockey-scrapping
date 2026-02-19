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
      });
    }
  });

  if (partidos.length === 0) {
    throw new Error("No se encontraron partidos del equipo");
  }

  return partidos;
}

function detectarCambios(antiguos, nuevos) {
  const cambios = [];

  nuevos.forEach((nuevo) => {
    const antiguo = antiguos.find(
      (p) =>
        p.fecha === nuevo.fecha &&
        p.equipo_local === nuevo.equipo_local &&
        p.equipo_visitante === nuevo.equipo_visitante
    );

    if (!antiguo) {
      cambios.push(`Nuevo partido: ${nuevo.equipo_local} vs ${nuevo.equipo_visitante} (${nuevo.fecha} ${nuevo.hora})`);
      return;
    }

    if (antiguo.hora !== nuevo.hora) {
      cambios.push(
        `Cambio de hora:\n${nuevo.equipo_local} vs ${nuevo.equipo_visitante}\nAntes: ${antiguo.hora}\nAhora: ${nuevo.hora}`
      );
    }

    if (antiguo.resultado !== nuevo.resultado) {
      cambios.push(
        `Cambio de resultado:\n${nuevo.equipo_local} vs ${nuevo.equipo_visitante}\nAntes: ${antiguo.resultado}\nAhora: ${nuevo.resultado}`
      );
    }
  });

  return cambios;
}

async function enviarEmail(mensaje) {
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
    subject: "⚠ Cambio en partidos BENJAMÍ",
    text: mensaje,
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


    await enviarEmail(cambios.join("\n\n"));

    console.log("Email enviado.");
  } else {
    console.log("Sin cambios.");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});