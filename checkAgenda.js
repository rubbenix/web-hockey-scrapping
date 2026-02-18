import fs from "fs";
import nodemailer from "nodemailer";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const FILE_PATH = "./data/partidos.json";

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

  const html = await response.text();
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

  return partidos;
}

async function main() {
  const nuevos = await getPartidos();

  const antiguos = JSON.parse(
    fs.readFileSync(FILE_PATH, "utf8")
  );

  if (JSON.stringify(nuevos) !== JSON.stringify(antiguos)) {
    console.log("Cambios detectados 🚨");

    fs.writeFileSync(FILE_PATH, JSON.stringify(nuevos, null, 2));

    await enviarEmail();

    process.exit(1); // importante para que GH detecte cambio
  }

  console.log("Sin cambios");
}

async function enviarEmail() {
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
    subject: "Cambio detectado en agenda",
    text: "Se ha detectado un cambio en los partidos.",
  });
}

main();
