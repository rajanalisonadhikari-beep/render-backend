const mongoose = require('mongoose');

/**
 * A ContentBlock is ONE editable piece of content on ONE page.
 * Example: the hero heading on index.html, or the third paragraph
 * of about.html, or an image in the trekking gallery.
 *
 * pageSlug   -> which html file it belongs to ("index", "about", "blog", "barber", "trekking", "payment")
 * blockKey   -> unique id for that spot on the page ("hero-heading", "hero-body", "gallery-img-1")
 * type       -> "richtext" | "text" | "image"
 * value      -> the HTML/plain text, or the image URL, currently live on the site
 * draftValue -> the version being edited (lets you preview before publishing)
 * label      -> human-readable name shown in the admin list ("Homepage Hero Heading")
 */
const contentBlockSchema = new mongoose.Schema(
  {
    pageSlug: { type: String, required: true, index: true },
    blockKey: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['richtext', 'text', 'image'], required: true },
    value: { type: String, default: '' },
    draftValue: { type: String, default: '' },
    order: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

contentBlockSchema.index({ pageSlug: 1, blockKey: 1 }, { unique: true });

module.exports = mongoose.model('ContentBlock', contentBlockSchema);
