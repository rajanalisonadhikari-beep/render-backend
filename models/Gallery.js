const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  caption: { type: String, trim: true },
  imageUrl: { type: String, required: true, trim: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gallery', GallerySchema);
