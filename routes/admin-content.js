const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ContentBlock = require('../models/ContentBlock');

// Matches the requireAuth pattern already used in routes/admin.js
// (checks req.session.user, redirects to /admin/login if not present)
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/admin/login');
}

// ---- Image upload setup ----
// Render's disk is wiped on every deploy, so local storage only works
// until your next push. For anything permanent, swap this for Cloudinary
// (free tier is plenty) — see the CLOUDINARY_SWAP note at the bottom of
// this file for the 10-line change.
// Reuses the SAME uploads folder your existing routes/admin.js already
// writes to (path.join(__dirname, '../../uploads') from inside /routes,
// which matches server.js's existing static route for '/uploads').
// This keeps all your images in one place instead of splitting into two.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// The known pages on your site — add to this list any time you add a new .html page
const PAGES = [
  { slug: 'index', label: 'Home' },
  { slug: 'about', label: 'About' },
  { slug: 'blog', label: 'Blog' },
  { slug: 'barber', label: 'Barber' },
  { slug: 'trekking', label: 'Trekking' },
  { slug: 'payment', label: 'Payment' },
];

// GET /admin/content -> list of pages
router.get('/content', requireLogin, (req, res) => {
  res.render('admin/content-pages', { pages: PAGES });
});

// GET /admin/content/:pageSlug -> list + edit all blocks for one page, with live preview
router.get('/content/:pageSlug', requireLogin, async (req, res) => {
  const blocks = await ContentBlock.find({ pageSlug: req.params.pageSlug }).sort('order');
  res.render('admin/content-editor', {
    pageSlug: req.params.pageSlug,
    blocks,
  });
});

// POST /admin/content/:pageSlug/block -> create a new editable block on a page
router.post('/content/:pageSlug/block', requireLogin, async (req, res) => {
  const { blockKey, label, type } = req.body;
  try {
    await ContentBlock.create({
      pageSlug: req.params.pageSlug,
      blockKey,
      label,
      type,
      value: '',
      draftValue: '',
      order: Date.now(),
    });
    res.redirect(`/admin/content/${req.params.pageSlug}`);
  } catch (err) {
    res.status(400).send('Could not create block: ' + err.message);
  }
});

// POST /admin/content/block/:id/draft -> save a draft without publishing (used for live preview)
router.post('/content/block/:id/draft', requireLogin, async (req, res) => {
  await ContentBlock.findByIdAndUpdate(req.params.id, { draftValue: req.body.value });
  res.json({ ok: true });
});

// POST /admin/content/block/:id/publish -> push draft live
router.post('/content/block/:id/publish', requireLogin, async (req, res) => {
  const block = await ContentBlock.findById(req.params.id);
  if (!block) return res.status(404).json({ ok: false });
  block.value = block.draftValue;
  block.updatedAt = new Date();
  await block.save();
  res.json({ ok: true, value: block.value });
});

// POST /admin/content/block/:id/image -> upload an image and set it as the draft value
router.post('/content/block/:id/image', requireLogin, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });
  const url = '/uploads/' + req.file.filename;
  await ContentBlock.findByIdAndUpdate(req.params.id, { draftValue: url });
  res.json({ ok: true, url });
});

// DELETE /admin/content/block/:id
router.post('/content/block/:id/delete', requireLogin, async (req, res) => {
  await ContentBlock.findByIdAndDelete(req.params.id);
  res.redirect('back');
});

// GET /admin/content/:pageSlug/preview-frame -> fetches your real live HTML page
// from Netlify and swaps the loader script to draft/preview mode, so the
// iframe on the right shows exactly what the public page will look like.
router.get('/content/:pageSlug/preview-frame', requireLogin, async (req, res) => {
  // Set this to your real Netlify site URL
  const FRONTEND_BASE = process.env.FRONTEND_BASE_URL || 'https://adhikari-rajan.com.np';
  try {
    const response = await fetch(`${FRONTEND_BASE}/${req.params.pageSlug}.html`);
    let html = await response.text();
    // cms-loader.js normally reads data-cms-page from <body>. We force it to
    // preview mode by adding data-cms-preview="true", which the loader checks
    // to call the /preview endpoint instead of the live one.
    html = html.replace('<body', '<body data-cms-preview="true"');
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(502).send('Could not load live page for preview: ' + err.message);
  }
});

module.exports = router;

/*
CLOUDINARY_SWAP (recommended before going live, so images survive redeploys):

npm install cloudinary multer-storage-cloudinary

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({ cloudinary, params: { folder: 'site-content' } });
// then use `upload = multer({ storage })` as above, and req.file.path is the URL instead of req.file.filename
*/
