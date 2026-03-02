Integración GitHub Action — actualizar meta!A1 y invalidar cache

Recomendación para minimizar ventanas de inconsistencia entre instancias:

1) Cuando la Action detecte cambios y escriba en la hoja de Google Sheets, además debe escribir la marca de tiempo en la hoja `meta!A1` (ISO string). `app/lib/gsheet-partidos.ts` ya lee esa celda y `agenda-cache` la respeta como `cachedAt`.

Ejemplo (Node) para usar en la Action — actualizar `meta!A1`:

```js
// node update-meta.js
import { google } from 'googleapis';

async function updateMeta(spreadsheetId, clientEmail, privateKey) {
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const now = new Date().toISOString();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'meta!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [[now]] },
  });
}

// Llama a updateMeta con env vars desde la Action
```

2) Después de actualizar la hoja, invocar el endpoint de invalidación (si lo tienes configurado) para limpiar la caché de la instancia que reciba la petición:

```bash
curl -fsS -X POST "$BASE_URL/api/agenda/invalidate" -H "x-invalidate-token: ${{ secrets.AGENDA_INVALIDATE_SECRET }}"
```

3) Snippet de paso en GitHub Action (ejemplo):

```yaml
- name: Update sheet meta
  env:
    GS_SPREADSHEET_ID: ${{ secrets.GS_SPREADSHEET_ID }}
    GS_CLIENT_EMAIL: ${{ secrets.GS_CLIENT_EMAIL }}
    GS_PRIVATE_KEY: ${{ secrets.GS_PRIVATE_KEY }}
  run: |
    node update-meta.js

- name: Invalidate cache (site)
  env:
    BASE_URL: https://tu-dominio.vercel.app
    AGENDA_INVALIDATE_SECRET: ${{ secrets.AGENDA_INVALIDATE_SECRET }}
  run: |
    curl -fsS -X POST "$BASE_URL/api/agenda/invalidate" -H "x-invalidate-token: $AGENDA_INVALIDATE_SECRET"
```

Notas:
- Asegura que la Action tenga los secretos adecuados: `GS_*` para Google y `AGENDA_INVALIDATE_SECRET` para llamar al endpoint.
- En entornos serverless con múltiples instancias, la llamada `invalidate` limpiará la instancia que reciba la petición; la actualización de `meta!A1` hace que cualquier instancia que vuelva a leer el sheet use la nueva marca de tiempo.
- Alternativa robusta: usar un cache compartido (Redis) o redeploy tras cambios si necesitas consistencia absoluta.
