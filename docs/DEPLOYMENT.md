# Guía de despliegue y operación

## 1. Requisitos

- Docker Engine 24+ y Compose v2.
- 1 vCPU / 1 GB RAM mínimos; 2 vCPU / 2 GB recomendados.
- Dominio y certificado TLS si se expone a Internet.
- Puertos libres: `8080` (app), `4000` (API, enlazada a loopback).

La base de datos es **SQLite embebido en la API**. No hay un contenedor de base
de datos separado: el archivo vive en el volumen `backend_data` y se respalda
con el perfil `db-backup`.

## 2. Puesta en marcha

```bash
cp .env.example .env
# Ajusta APP_PORT, API_PORT, CORS_ORIGINS, SEED_ON_START y TZ

docker compose config --quiet  # valida sintaxis e interpolación
docker compose up -d --build
docker compose ps
curl -fsS http://localhost:8080/healthz
curl -fsS http://localhost:4000/api/v1/health
```

Primer arranque:

1. Docker crea los volúmenes `intranerd_backend_data` e
   `intranerd_backend_uploads`.
2. La API crea el esquema SQLite de forma idempotente.
3. Si `SEED_ON_START=true`, carga datos de demostración solo si la base está
   vacía.
4. Nginx espera al healthcheck de la API antes de arrancar.
5. El healthcheck del frontend consulta `/healthz`.

## 3. Variables críticas de producción

```dotenv
NODE_ENV=production
APP_PORT=8080
API_PORT=4000
TZ=America/Santiago
DATABASE_PATH=/app/data/intranerd.db
SEED_ON_START=false
MAX_UPLOAD_MB=10
CORS_ORIGINS=https://intranerd.tudominio.cl
RATE_LIMIT_MAX=300
INTRANERD_API_BASE=/api
```

- `SEED_ON_START=false` evita cargar datos de demostración en producción.
- `CORS_ORIGINS` debe incluir el origen exacto del frontend (sin barra final).
- Dentro de Docker no cambies `DATABASE_PATH` fuera de `/app/data`: el volumen
  está montado allí.
- La API no tiene autenticación; no publiques `API_PORT` fuera de loopback.

## 4. TLS y reverse proxy externo

Nginx del contenedor sirve HTTP en el puerto 80. Para producción, coloca un
proxy TLS (Caddy, Traefik o Nginx del host) delante:

```nginx
server {
    listen 443 ssl http2;
    server_name intranerd.tudominio.cl;

    ssl_certificate     /etc/letsencrypt/live/intranerd/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/intranerd/privkey.pem;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

No publiques el puerto `4000` fuera de `127.0.0.1` en producción. El Compose ya
lo enlaza a loopback.

## 5. Backups y restauración

El perfil `backup` usa la utilidad `sqlite3` para hacer una copia consistente
sin detener la API:

```bash
# Backup comprimido en ./backups/
docker compose --profile backup run --rm db-backup
```

Restauración (detén la API antes de reemplazar el archivo):

```bash
docker compose stop backend
docker run --rm -v intranerd_backend_data:/data -v "$PWD/backups":/backups \
  alpine:3.20 sh -c 'cp /backups/intranerd-YYYYMMDD-HHMMSS.db /data/intranerd.db'
docker compose start backend
```

Programa backups diarios con `cron` y prueba la restauración al menos una vez al
mes. El volumen `backend_data` no sustituye a un backup lógico.

## 6. Actualizaciones y rollback

```bash
git pull
docker compose build --pull
docker compose up -d
docker compose ps
```

- El esquema es idempotente (`CREATE TABLE IF NOT EXISTS`).
- Para cambios destructivos, crea una migración versionada y un backup previo.
- Rollback: `git checkout <tag-anterior>` y `docker compose up -d --build`.
- Las imágenes se pueden etiquetar y publicar en un registry para despliegues
  reproducibles.

## 7. Observabilidad

- **Logs:** `morgan` a stdout, recolectados por el driver `json-file` con
  rotación de 10 MB × 3. Para producción usa Loki/CloudWatch/ELK.
- **Healthchecks:** `/api/v1/health` (incluye una consulta a SQLite) y
  `/healthz`.
- **Métricas sugeridas:** latencia p95 por ruta, tasa de 4xx/5xx, tamaño de la
  base, uso de CPU/RAM y espacio del volumen.
- **Trazabilidad:** cada request devuelve `X-Request-Id`; reenvíalo desde el
  proxy externo para correlacionar logs.

## 8. Seguridad operativa

- No hay secretos de aplicación: la API no usa JWT ni contraseñas.
- Limita el acceso SSH y mantén Docker y las imágenes actualizadas.
- No ejecutes `docker compose down -v` en producción.
- Los contenedores usan `no-new-privileges`; la API corre como usuario no-root.
- Revisa dependencias con `npm audit` y reconstruye imágenes periódicamente.
- El CSP de Nginx permite solo recursos propios y data URLs para imágenes.
- Si expones la API, añade autenticación y autorización antes de hacerlo.

## 9. Checklist de salida a producción

- [ ] `.env` con `SEED_ON_START=false` y `CORS_ORIGINS` del dominio real.
- [ ] TLS terminado en un proxy externo y HSTS activo.
- [ ] Puerto `4000` accesible solo desde loopback.
- [ ] Backups automáticos verificados y restauración probada.
- [ ] Healthchecks en verde durante 24 h.
- [ ] Monitoreo de errores 5xx y latencia.
- [ ] Documento OpenAPI publicado para integraciones.
- [ ] Datos demo eliminados o base reiniciada.
