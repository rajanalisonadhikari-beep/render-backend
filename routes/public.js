const express = require('express');
const path = require('path');
const BlogPost = require('../models/BlogPost');
const ContactMessage = require('../models/ContactMessage');
const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '../public') });
});

router.get('/blog', async (req, res) => {
  const posts = await BlogPost.find().sort({ publishedAt: -1 });
  res.render('blog', { posts });
});

router.post('/contact', async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim();
  const message = (req.body.message || '').trim();

  if (!name || !email || !message) {
    return res.redirect('/?contact=invalid');
  }

  await ContactMessage.create({ name, email, message });
  res.redirect('/?contact=sent');
});

module.exports = router;
