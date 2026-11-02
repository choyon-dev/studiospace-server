const express = require('express');

const router = express.Router();

const cache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

router.get('/autocomplete', async (req, res) => {
  try {
    const rawQuery = (req.query.q || '').trim();
    if (!rawQuery || rawQuery.length < 2) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const cacheKey = rawQuery.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.status(200).json({ success: true, count: cached.data.length, data: cached.data });
    }

    const osmUrl = new URL('https://nominatim.openstreetmap.org/search');
    osmUrl.searchParams.set('format', 'json');
    osmUrl.searchParams.set('q', rawQuery);
    osmUrl.searchParams.set('addressdetails', '1');
    osmUrl.searchParams.set('limit', '6');

    const response = await fetch(osmUrl.toString(), {
      headers: {
        'User-Agent': 'StudioSpace-Platform/1.0 (contact: admin@studiospace.io)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenStreetMap Nominatim responded with status ${response.status}`);
    }

    const rawData = await response.json();

    const formatted = rawData.map((item) => {
      const addr = item.address || {};
      const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || '';
      const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || item.name;
      const state = addr.state || '';
      const country = addr.country || '';
      const postcode = addr.postcode || '';

      const summaryParts = [neighbourhood, city, state].filter(Boolean);
      const label = summaryParts.length > 0 ? summaryParts.join(', ') : item.display_name;

      return {
        label,
        displayName: item.display_name,
        city: city || 'Various',
        state,
        country,
        postcode,
        formatted: [item.name, city, state, country].filter(Boolean).join(', '),
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        osmPlaceId: String(item.place_id),
      };
    });

    if (cache.size > 500) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }

    cache.set(cacheKey, { timestamp: Date.now(), data: formatted });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to query OpenStreetMap Nominatim',
      error: error.message,
    });
  }
});

module.exports = router;
