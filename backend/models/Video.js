const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
  duration: { type: Number },
  status: { type: String, enum: ['Uploading', 'Processing', 'Safe', 'Flagged', 'Failed'], default: 'Uploading' },
  metadata: { type: Object },
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
