# Weather Sensors

Proyecto para ingestión, almacenamiento y análisis de datos de sensores meteorológicos.

## Estructura del repositorio
- `api/`: servicio Node.js (API) con `server.js`.
- `migrations/`: scripts SQL de inicialización (`init.sql`).
- `nginx/`: configuración de Nginx (`nginx.conf`).
- `notebooks/`: análisis exploratorio en `weather_analysis.ipynb`.
- `scripts/`: utilidades para carga de datos (`load_data.py`, `load_data_remote.py`).
- `docker-compose.yml`: orquesta servicios para desarrollo/producción.

## Requisitos
- Docker y Docker Compose
- Node.js (solo para desarrollo local si no usa Docker)

## Arranque rápido (con Docker)
1. Levantar servicios:

```powershell
docker compose up -d
```

2. Ver logs del API:

```powershell
docker compose logs -f api
```

## API
El servidor principal está en `api/server.js`. Consultar ese archivo para los endpoints expuestos y variables de entorno.

## Migraciones / Base de datos
Ejecutar el SQL en `migrations/init.sql` para inicializar la base de datos si trabaja fuera de Docker.

## Scripts de carga de datos
- `scripts/load_data.py`: carga de datos local.
- `scripts/load_data_remote.py`: carga remota utilizando túnel de ngrok.

## Notebook
El notebook `notebooks/weather_analysis.ipynb` contiene análisis y gráficos de las ciudades.