const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let dataSensor = [];
let waktuMakanTerakhir = null;

// Route dari ESP32
app.post("/kirim-sensor", (req, res) => {
    const {
        temperature,
        ph,
        turbidity,
        feed_level,
        distance,
        waktu_makan,
        fuzzy_rules,
        fuzzyRules,
        waterpump,
        heater
    } = req.body;
    const waktu = new Date().toISOString();
    const rawFuzzyRules = fuzzy_rules ?? fuzzyRules;

    let normalizedFuzzyRules = [];
    if (Array.isArray(rawFuzzyRules)) {
        normalizedFuzzyRules = rawFuzzyRules;
    } else if (typeof rawFuzzyRules === "string") {
        normalizedFuzzyRules = rawFuzzyRules
            .split(",")
            .map((rule) => rule.trim())
            .filter(Boolean);
    }

    // Simpan data ke array
    dataSensor.push({
        suhu: temperature,
        ph,
        kekeruhan: turbidity,
        feed_level,
        jarak: distance,
        waktu,
        waktu_makan: waktu_makan || null,
        fuzzy_rules: normalizedFuzzyRules,
        waterpump: waterpump || "OFF",
        heater: heater || "OFF"
    });

    // Simpan waktu makan terakhir jika ada
    if (waktu_makan) {
        waktuMakanTerakhir = waktu_makan;
    }

    res.json({ status: "ok", data: req.body });
});

// Route untuk frontend
app.get("/data-sensor", (req, res) => {
    res.json(dataSensor);
});

// Route untuk waktu makan terakhir
app.get("/hasil-terakhir", (req, res) => {
    res.json({ waktu_makan: waktuMakanTerakhir || "Belum ada" });
});

// Server jalan
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
