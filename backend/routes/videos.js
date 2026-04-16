const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { processVideo } = require('../utils/videoProcessor');

// Get all videos for the user's tenant
router.get('/', protect, async (req, res) => {
  try {
    const videos = await Video.find({ tenantId: req.user.tenantId })
                              .populate('uploaderId', 'name email')
                              .sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    console.error('Fetch videos error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Upload a video
router.post('/upload', protect, authorize('Admin', 'Editor'), upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const { title, description } = req.body;

    const video = await Video.create({
      title: title || req.file.originalname,
      description: description || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploaderId: req.user._id,
      tenantId: req.user.tenantId,
      status: 'Uploading' // Will transition to 'Processing' soon
    });

    res.status(201).json(video);

    // Kick off background processing
    processVideo(video._id, req.io);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Stream a video
router.get('/stream/:id', protect, async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Only allow streaming if Safe (or Admin for any)
    if (video.status !== 'Safe' && req.user.role !== 'Admin') {
       return res.status(403).json({ message: 'Video is not finalized/safe' });
    }

    const videoPath = path.join(__dirname, '..', 'uploads', video.filename);
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.mimeType || 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.mimeType || 'video/mp4',
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Streaming error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a video
router.delete('/:id', protect, authorize('Admin', 'Editor'), async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Delete the file from the filesystem
    const videoPath = path.join(__dirname, '..', 'uploads', video.filename);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    // Delete from database
    await video.deleteOne();

    res.json({ message: 'Video removed' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
