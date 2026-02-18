const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const FILE_PATH = "./data/partidos.json";

// Asegurar carpeta
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

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const html = await response.text();

  if (!html || html.length < 100) {
    throw new Error("HTML inválido o vacío");
  }

  const $ = cheerio.load(html);

  const partidos = [];

  $(".fila_agenda").each((_, el) => {
    const tds = $(el).find("td");
    if (tds.length < 9) return;

    partidos.push({
      fecha: $(tds[1]).text().trim(),
      hora: $(tds[2]).text().trim(),
      local: $(tds[4]).text().trim(),
      visitante: $(tds[6]).text().trim(),
      resultado: $(tds[7]).text().trim(),
    });
  });

  if (partidos.length === 0) {
    throw new Error("No se encontraron partidos. Posible fallo de scraping.");
  }

  return partidos;
}

function detectarCambios(antiguos, nuevos) {
  const cambios = [];

  nuevos.forEach((nuevo) => {
    const antiguo = antiguos.find(
      (p) =>
        p.fecha === nuevo.fecha &&
        p.local === nuevo.local &&
        p.visitante === nuevo.visitante
    );

    if (!antiguo) {
      cambios.push(
        `Nuevo partido: ${nuevo.local} vs ${nuevo.visitante} (${nuevo.fecha} ${nuevo.hora})`
      );
      return;
    }

    if (antiguo.hora !== nuevo.hora) {
      cambios.push(
        `Cambio de hora:\n${nuevo.local} vs ${nuevo.visitante}\nAntes: ${antiguo.hora}\nAhora: ${nuevo.hora}`
      );
    }

    if (antiguo.resultado !== nuevo.resultado) {
      cambios.push(
        `Cambio de resultado:\n${nuevo.local} vs ${nuevo.visitante}\nAntes: ${antiguo.resultado}\nAhora: ${nuevo.resultado}`
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
    subject: "⚠ Cambio detectado en agenda FECAPA",
    text: mensaje,
  });
}

async function main() {
  console.log("Comprobando agenda...");

  let nuevos;

  try {
    nuevos = await getPartidos();
  } catch (error) {
    console.error("Error en scraping:", error.message);
    console.log("Abortando sin modificar JSON.");
    process.exit(1); // Importante para que GitHub marque fallo
  }

  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(nuevos, null, 2));
    console.log("Archivo inicial creado.");
    return;
  }

  const antiguos = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));

  const cambios = detectarCambios(antiguos, nuevos);

  if (cambios.length > 0) {
    console.log("Cambios detectados 🚨");

    fs.writeFileSync(FILE_PATH, JSON.stringify(nuevos, null, 2));

    await enviarEmail(cambios.join("\n\n"));

    console.log("Email enviado.");
  } else {
    console.log("Sin cambios.");
  }
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});