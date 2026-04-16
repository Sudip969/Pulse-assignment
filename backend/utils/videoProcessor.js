const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');

// Simulate video processing and sensitivity analysis
const processVideo = async (videoId, io) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) return;

    video.status = 'Processing';
    await video.save();
    
    // Broadcast status update
    io.emit(`video-status-${video.tenantId}`, { videoId: video._id, status: 'Processing', progress: 0 });

    // Simulate 5 steps of processing, each taking 1 second
    for (let i = 1; i <= 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      io.emit(`video-status-${video.tenantId}`, { videoId: video._id, status: 'Processing', progress: i * 20 });
    }

    // Simulate sensitivity analysis (10% chance of being flagged)
    const isSafe = Math.random() > 0.1;
    video.status = isSafe ? 'Safe' : 'Flagged';
    
    // Mock metadata
    video.duration = Math.floor(Math.random() * 300) + 30; // Random duration between 30 to 330 seconds
    video.metadata = {
      resolution: '1920x1080',
      codec: 'h264',
      analyzedAt: new Date()
    };

    await video.save();

    // Final broadcast
    io.emit(`video-status-${video.tenantId}`, { 
      videoId: video._id, 
      status: video.status, 
      progress: 100,
      video: video 
    });

  } catch (error) {
    console.error('Video processing error:', error);
    try {
      const video = await Video.findById(videoId);
      if (video) {
        video.status = 'Failed';
        await video.save();
        io.emit(`video-status-${video.tenantId}`, { videoId: video._id, status: 'Failed', progress: 0 });
      }
    } catch (dbError) {
      console.error('Failed to update DB on error', dbError);
    }
  }
};

module.exports = { processVideo };
