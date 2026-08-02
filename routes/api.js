const express = require('express');
const BlogPost = require('../models/BlogPost');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();

router.get('/posts', async (req, res) => {
  const posts = await BlogPost.find().sort({ publishedAt: -1 });
  res.json(posts);
});

router.post('/contact', async (req, res) => {
  const { name = '', email = '', message = '' } = req.body;

  if (!name.trim() || !email.trim() || !message.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  await ContactMessage.create({ name: name.trim(), email: email.trim(), message: message.trim() });
  res.json({ success: true });
});

module.exports = router;
