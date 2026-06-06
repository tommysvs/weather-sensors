const express = require("express");

const app = express();
const PORT = 3000;

const INSTANCE_NAME = process.env.INSTANCE_NAME || "API-DESCONOCIDA";

app.use(express.json());

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

app.get("/api/orders", async (req, res) => {
  const delayMs = Math.floor(Math.random() * 900) + 100;

  await sleep(delayMs);

  res.json({
    endpoint: "/api/orders",
    instance: INSTANCE_NAME,
    delayMs,
    data: [
      {
        id: 1,
        customer: "Ana Lopez",
        total: 450
      },
      {
        id: 2,
        customer: "Carlos Perez",
        total: 1200
      },
      {
        id: 3,
        customer: "Maria Hernandez",
        total: 875
      }
    ]
  });
});

app.get("/api/heavy-report", async (req, res) => {
  const delayMs = 3000;

  await sleep(delayMs);

  res.json({
    endpoint: "/api/heavy-report",
    message: "Reporte pesado generado correctamente",
    instance: INSTANCE_NAME,
    delayMs,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`${INSTANCE_NAME} corriendo en puerto ${PORT}`);
});