const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const BlogPost = require('../models/BlogPost');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  })
});

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/admin/login');
}

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  res.render('admin/login', { flash: req.session.flash || null });
});

router.post('/login', async (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  if (!username || !password) {
    req.session.flash = { type: 'error', message: 'Username and password are required.' };
    return res.redirect('/admin/login');
  }

  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUsername || !expectedHash) {
    req.session.flash = { type: 'error', message: 'Admin credentials are not configured.' };
    return res.redirect('/admin/login');
  }

  if (username !== expectedUsername) {
    req.session.flash = { type: 'error', message: 'Invalid credentials.' };
    return res.redirect('/admin/login');
  }

  const valid = await bcrypt.compare(password, expectedHash);
  if (!valid) {
    req.session.flash = { type: 'error', message: 'Invalid credentials.' };
    return res.redirect('/admin/login');
  }

  req.session.user = { username: expectedUsername };
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.use(requireAuth);

router.get('/', async (req, res) => {
  const posts = await BlogPost.find().sort({ publishedAt: -1 }).limit(5);
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(8);
  res.render('admin/dashboard', { posts, messages, flash: req.session.flash || null });
});

router.get('/posts', async (req, res) => {
  const posts = await BlogPost.find().sort({ publishedAt: -1 });
  res.render('admin/posts', { posts, flash: req.session.flash || null });
});

router.get('/posts/new', (req, res) => {
  res.render('admin/post-form', { post: null, action: '/admin/posts', flash: req.session.flash || null });
});

router.post('/posts', upload.single('coverImage'), async (req, res) => {
  const title = (req.body.title || '').trim();
  const slugInput = slugify(req.body.slug || title);
  const excerpt = (req.body.excerpt || '').trim();
  const body = (req.body.body || '').trim();
  const coverImage = req.file ? `/uploads/${req.file.filename}` : '';

  let slug = slugInput || `post-${Date.now()}`;
  const existing = await BlogPost.findOne({ slug });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  await BlogPost.create({ title, slug, excerpt, body, coverImage });
  req.session.flash = { type: 'success', message: 'Blog post created.' };
  res.redirect('/admin/posts');
});

router.get('/posts/:id/edit', async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) return res.redirect('/admin/posts');
  res.render('admin/post-form', { post, action: `/admin/posts/${post._id}`, flash: req.session.flash || null });
});

router.post('/posts/:id', upload.single('coverImage'), async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) return res.redirect('/admin/posts');

  post.title = (req.body.title || '').trim();
  post.slug = slugify(req.body.slug || post.title) || `post-${Date.now()}`;
  post.excerpt = (req.body.excerpt || '').trim();
  post.body = (req.body.body || '').trim();
  if (req.file) {
    post.coverImage = `/uploads/${req.file.filename}`;
  }

  await post.save();
  req.session.flash = { type: 'success', message: 'Blog post updated.' };
  res.redirect('/admin/posts');
});

router.post('/posts/:id/delete', async (req, res) => {
  await BlogPost.findByIdAndDelete(req.params.id);
  req.session.flash = { type: 'success', message: 'Blog post deleted.' };
  res.redirect('/admin/posts');
});

router.get('/messages', async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  res.render('admin/messages', { messages, flash: req.session.flash || null });
});

router.post('/messages/:id/read', async (req, res) => {
  await ContactMessage.findByIdAndUpdate(req.params.id, { read: true });
  res.redirect('/admin/messages');
});

router.post('/messages/:id/delete', async (req, res) => {
  await ContactMessage.findByIdAndDelete(req.params.id);
  req.session.flash = { type: 'success', message: 'Message deleted.' };
  res.redirect('/admin/messages');
});

module.exports = router;
