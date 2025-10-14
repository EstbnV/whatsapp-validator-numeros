const express = require("express");
const fs = require("fs");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
require("dotenv").config();

const app = express();

// -------------------------
// CONFIGURACIÓN DE SEGURIDAD
// -------------------------
const API_KEY = process.env.API_KEY || "TU_API_KEY_SECRETA";

// Middleware para validar API Key
app.use((req, res, next) => {
  const key = req.get("x-api-key");
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// -------------------------
// CONFIGURACIÓN DE WHATSAPP
// -------------------------
// LocalAuth guarda automáticamente la sesión en disco (./.wwebjs_auth)
// Así nunca tendrás que escanear el QR de nuevo
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--disable-gpu']
  }
  
});

// Generar QR si no hay sesión
client.on("qr", (qr) => {
  console.log("📲 Escanea este QR con WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ Cliente de WhatsApp listo.");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Error de autenticación", msg);
});

client.initialize();

// -------------------------
// ENDPOINT PARA VALIDAR NÚMERO
// -------------------------
app.get("/check-number", async (req, res) => {
  const number = req.query.number;
  if (!number) return res.status(400).json({ error: "Falta parámetro ?number=" });

  
  try {
    const result = await client.getNumberId(number);
    if (result) {
      res.json({ onWhatsApp: true, wa_id: result._serialized });
    } else {
      res.json({ onWhatsApp: false });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

// -------------------------
// PUERTO DINÁMICO (Render)
// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
