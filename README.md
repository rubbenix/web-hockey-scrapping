Versión actual — descripción y uso

Resumen

- Esta versión lee y escribe los datos directamente en una Google Sheet. La app sirve la agenda y gestiona suscriptores mediante endpoints que usan las utilidades de `app/lib/`.
- No se requieren bases de datos ni carpetas `data/` locales: la Google Sheet es la fuente de verdad.

Qué contiene (implementación actual)

- `app/api/agenda/route.ts` — endpoint GET que devuelve la agenda leyendo la hoja (`app/lib/gsheet-partidos.ts`).
- `app/api/subscriptions/route.ts` — endpoint POST/DELETE/GET para añadir o quitar suscriptores; escribe/lee la hoja de Google.
- `app/lib/gsheet-partidos.ts`, `app/lib/gsheet-matches.js` — utilidades para leer/escribir la hoja (pestaña `partidos`) y la pestaña `emails`.
- `checkAgenda.js` — script que scrapea la web, compara con la hoja y puede actualizarla y enviar notificaciones.
- `.github/workflows/check-agenda.yml` — workflow que puede ejecutar `checkAgenda.js` periódicamente o bajo demanda.

Cómo funciona (flujo de datos)

1. Google Sheet (p. ej. pestañas `partidos` y `emails`).
2. La app Next.js (endpoints en `app/api/*`) consulta/actualiza la sheet mediante las utilidades en `app/lib/`.
3. `checkAgenda.js` puede obtener partidos desde el scraping, calcular diferencias y escribir la hoja; además envía emails a los suscriptores cuando hay cambios.
4. Una GitHub Action puede ejecutar `checkAgenda.js` automáticamente (cron) y/o commitear artefactos si se desea historial.

Variables de entorno necesarias

- `GS_CLIENT_EMAIL` — email del service account de Google.
- `GS_PRIVATE_KEY` — clave privada del service account (asegúrate de conservar los saltos de línea correctamente en GitHub Secrets).
- `GS_SPREADSHEET_ID` — ID de la Google Sheet.
- `SUBSCRIPTION_SECRET` — secret para generar/verificar tokens de unsubscribe.
- SMTP (para envío de correos): `SMTP_USER`/`SMTP_PASS` o `EMAIL_USER`/`EMAIL_PASS`. Opcionales: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `EMAIL_FROM`.

Uso local (rápido)

1. Crea un archivo `.env.local` con las variables anteriores.

2. Instala dependencias y ejecuta en desarrollo:

```bash
pnpm install
pnpm dev
```

3. Probar el script de comprobación y notificación manualmente:

```bash
node checkAgenda.js
```

Cómo suscribirse y darse de baja

- Suscribirse: desde la UI o POST a `/api/subscriptions` con JSON `{ "email": "tucorreo@ej.com" }`.
- Darse de baja: la app genera un token de baja; el endpoint de baja acepta GET con `?email=...&token=...` o DELETE a `/api/subscriptions` con `{ email, token }`.

Notas importantes

- No hay carpeta `data/` en la versión activa: los ficheros JSON locales no son usados como fuente de verdad.
- Los secrets de Google Sheets deben configurarse en GitHub Actions si usas el workflow automático (`GS_CLIENT_EMAIL`, `GS_PRIVATE_KEY`, `GS_SPREADSHEET_ID`, `SUBSCRIPTION_SECRET`, además de credenciales SMTP si quieres que la Action envíe correos).

Si quieres, puedo añadir un ejemplo de workflow (`.github/workflows/sync-sheet.yml`) y un `.env.local.example` con los nombres de las variables necesarias.

## Scraping FECAPA — cómo funciona y cómo adaptarlo a otro equipo

La repo incluye `checkAgenda.js`, un script que hace scraping de la web de FECAPA para extraer los partidos de un equipo concreto y sincronizarlos con la Google Sheet. A continuación se explica cómo funciona y qué modificar para usarlo con otro equipo.

### 1) Dónde está el código

- Script principal: `checkAgenda.js`.
- Utilidades de hoja: `app/lib/gsheet-matches.js` (lectura/escritura en la pestaña `partidos`).

### 2) Dependencias

- `node-fetch` para las peticiones HTTP.
- `cheerio` para parsear HTML.
- `nodemailer` para enviar emails (opcional).

Instálalas si no están presentes:

```bash
pnpm install node-fetch cheerio nodemailer
```

### 3) Parámetros a modificar para otro equipo

- `CLUB_ID`: id numérica del club (en la parte superior de `checkAgenda.js`).
- `TEAM_NAME`: nombre exacto del equipo tal como aparece en la web.
- `CATEGORIA`: categoría (opcional) para filtrar por competición.

Ejemplo:

```js
const CLUB_ID = "253";
const TEAM_NAME = "JESUS MARIA I JOSEP B";
const CATEGORIA = "BCN BENJAMÍ OR COPA BCN 2";
```

### 4) Cómo se parsea la página

- El script hace una petición POST a `https://server2.sidgad.es/fecapa/00_fecapa_agenda_1.php`.
- Busca filas con la clase `.fila_agenda` y extrae columnas (`td`) en posiciones fijas: categoría, fecha, hora, equipos, resultado y pista.
- Si la estructura de la página cambia (orden de columnas o selectores), actualiza los índices y selectores en `checkAgenda.js`.

### 5) Lógica de filtrado

- Se filtra por `club1`/`club2` (atributos de la fila) y por coincidencia con `TEAM_NAME` en `equipo_local` o `equipo_visitante`. Si defines `CATEGORIA`, también se compara.
- Para extraer todos los partidos de una categoría/quitar filtros, modifica/elimina el bloque de filtrado.

### 6) Sincronización y notificaciones

- El script compara los partidos nuevos con los antiguos leídos desde la hoja (`readMatchesFromSheet()`).
- Si hay cambios, escribe la nueva lista con `writeMatchesToSheet(nuevos)` y puede enviar notificaciones por email usando `nodemailer`.

### 7) Cómo probar con otro equipo

1. Actualiza `CLUB_ID`, `TEAM_NAME` y `CATEGORIA` en `checkAgenda.js`.
2. Ejecuta:

```bash
node checkAgenda.js
```

3. Revisa la consola y la Google Sheet para verificar los resultados.

### 8) Buenas prácticas

- Respeta los términos del sitio que scrapeas y evita solicitudes demasiado frecuentes.
- Usa cron razonables en GitHub Actions (p. ej. cada 30–60 minutos) o menos según necesidad.
- Añade retrasos/backoff si haces múltiples peticiones.
- Si existe una API oficial, preférela al scraping.

### 9) Automatización

- El workflow `.github/workflows/check-agenda.yml` puede ejecutar `node checkAgenda.js`. Asegúrate de añadir los secrets necesarios (`GS_CLIENT_EMAIL`, `GS_PRIVATE_KEY`, `GS_SPREADSHEET_ID`, `SUBSCRIPTION_SECRET`, `SMTP_*`) en los Secrets del repositorio.
