const express = require("express");

const app = express();
const PORT = 3000;

const INSTANCE_NAME = process.env.INSTANCE_NAME || "API-DESCONOCIDA";
const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
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
    timezone: payload.timezone || OPEN_METEO_TIMEZONE
  };
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