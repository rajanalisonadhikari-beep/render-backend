const express = require('express');
const router = express.Router();
const ContentBlock = require('../models/ContentBlock');

// CORS: allow your Netlify domain to call this API.
// Replace with your real Netlify + custom domain(s).
const ALLOWED_ORIGINS = [
  'https://adhikari-rajan.com.np',
  'https://www.adhikari-rajan.com.np',
  // add your *.netlify.app preview URL too if you use one
];

router.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  next();
});

// GET /api/content/:pageSlug -> { blockKey: value, ... }  (published/live content only)
router.get('/content/:pageSlug', async (req, res) => {
  try {
    const blocks = await ContentBlock.find({ pageSlug: req.params.pageSlug });
    const out = {};
    blocks.forEach((b) => {
      out[b.blockKey] = { type: b.type, value: b.value };
    });
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load content' });
  }
});

// GET /api/content/:pageSlug/preview -> draft content (used only by the admin live preview iframe)
router.get('/content/:pageSlug/preview', async (req, res) => {
  try {
    const blocks = await ContentBlock.find({ pageSlug: req.params.pageSlug });
    const out = {};
    blocks.forEach((b) => {
      out[b.blockKey] = { type: b.type, value: b.draftValue || b.value };
    });
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load preview content' });
  }
});

module.exports = router;
