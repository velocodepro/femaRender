const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow all origins

app.get('/', (req, res) => {
  res.send('FEMA Proxy API is running');
});

app.get('/fema', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing lat or lng' });
  }

  const femaUrl = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&f=json`;

  try {
    const response = await fetch(femaUrl);
    const text = await response.text();

    if (text.startsWith('<!DOCTYPE') || text.includes('<html')) {
      console.warn("⚠️ FEMA returned HTML instead of JSON.");
      return res.status(502).json({
        error: "FEMA blocked this request or returned HTML",
        preview: text.slice(0, 200)
      });
    }

    const json = JSON.parse(text);
    return res.status(200).json(json);
  } catch (err) {
    console.error("Fetch failed:", err);
    return res.status(500).json({ error: "Fetch failed", detail: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
