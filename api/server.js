const express = require("express");

const app = express();
const PORT = 3000;

const INSTANCE_NAME = process.env.INSTANCE_NAME || "API-DESCONOCIDA";
const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const mysql = require('mysql2/promise');

const dbPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5
});
const OPEN_METEO_TIMEZONE = "America/Tegucigalpa";

const CITIES = {
  tegucigalpa: {
    name: "Tegucigalpa",
    latitude: 14.0818,
    longitude: -87.2068
  },
  "san-pedro-sula": {
    name: "San Pedro Sula",
    latitude: 15.5042,
    longitude: -88.025
  }
};

async function getCurrentTemperature(cityConfig) {
  const params = new URLSearchParams({
    latitude: String(cityConfig.latitude),
    longitude: String(cityConfig.longitude),
    current: "temperature_2m",
    timezone: OPEN_METEO_TIMEZONE
  });

  const response = await fetch(`${OPEN_METEO_BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Open-Meteo respondio con status ${response.status}`);
  }

  const payload = await response.json();
  const currentData = payload.current;

  if (!currentData || typeof currentData.temperature_2m !== "number") {
    throw new Error("Open-Meteo no devolvio temperature_2m en current");
  }

  return {
    temperature: currentData.temperature_2m,
    readAt: currentData.time,
    unit: payload.current_units?.temperature_2m || "C",
    providerLatitude: payload.latitude,
    providerLongitude: payload.longitude,
    timezone: payload.timezone || OPEN_METEO_TIMEZONE,
    raw: payload
  };
}

async function saveReadingToDB(opts) {
  const readAtValue = normalizeToMySqlDateTime(opts.readAt);
  const providerTimestampValue = normalizeToMySqlDateTime(opts.provider_timestamp);

  const sql = `INSERT INTO temperature_readings
    (endpoint, city, requested_latitude, requested_longitude, latitude, longitude, temperature, unit, read_at, timezone, source, api_instance, provider_timestamp, raw_payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [
    opts.endpoint,
    opts.city,
    opts.requestedLatitude,
    opts.requestedLongitude,
    opts.latitude,
    opts.longitude,
    opts.temperature,
    opts.unit,
    readAtValue,
    opts.timezone,
    opts.source,
    opts.api_instance,
    providerTimestampValue,
    JSON.stringify(opts.raw_payload || null)
  ];

  const [result] = await dbPool.execute(sql, params);
  return result.insertId;
}

function normalizeToMySqlDateTime(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 19).replace("T", " ");
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const withoutTimezone = text.replace("T", " ").replace(/Z$/, "");
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(withoutTimezone)) {
    return `${withoutTimezone}:00`;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(withoutTimezone)) {
    return withoutTimezone.split(".")[0];
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 19).replace("T", " ");
}

app.get("/", (req, res) => {
  res.json({
    message: "Respuesta desde la API",
    instance: INSTANCE_NAME,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    instance: INSTANCE_NAME,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/weather/current", async (req, res) => {
  const cityKey = String(req.query.city || "").trim().toLowerCase();
  const cityConfig = CITIES[cityKey];

  if (!cityConfig) {
    res.status(400).json({
      error: "Ciudad invalida. Usa tegucigalpa o san-pedro-sula",
      instance: INSTANCE_NAME,
      supportedCities: Object.keys(CITIES),
      examples: [
        "?city=tegucigalpa",
        "?city=san-pedro-sula"
      ]
    });
    return;
  }

  try {
    const weather = await getCurrentTemperature(cityConfig);
      // attempt to persist reading
      let insertId = null;
      try {
        insertId = await saveReadingToDB({
          endpoint: '/api/weather/current',
          city: cityConfig.name,
          requestedLatitude: cityConfig.latitude,
          requestedLongitude: cityConfig.longitude,
          latitude: weather.providerLatitude,
          longitude: weather.providerLongitude,
          temperature: weather.temperature,
          unit: weather.unit,
          readAt: weather.readAt,
          timezone: weather.timezone,
          source: 'Open-Meteo',
          api_instance: INSTANCE_NAME,
          provider_timestamp: new Date(),
          raw_payload: weather.raw
        });
      } catch (dbErr) {
        console.error('DB insert error:', dbErr.message || dbErr);
      }

      res.json({
        endpoint: "/api/weather/current",
        city: cityConfig.name,
        requestedLatitude: cityConfig.latitude,
        requestedLongitude: cityConfig.longitude,
        latitude: weather.providerLatitude,
        longitude: weather.providerLongitude,
        temperature: weather.temperature,
        unit: weather.unit,
        readAt: weather.readAt,
        timezone: weather.timezone,
        source: "Open-Meteo",
        instance: INSTANCE_NAME,
        persisted_id: insertId,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    res.status(502).json({
      error: "No se pudo obtener la temperatura desde Open-Meteo",
      details: error.message,
      city: cityConfig.name,
      source: "Open-Meteo",
      instance: INSTANCE_NAME,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`${INSTANCE_NAME} corriendo en puerto ${PORT}`);
});