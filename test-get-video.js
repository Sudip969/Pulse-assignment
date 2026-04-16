const mongoose = require('mongoose');
const Video = require('./backend/models/Video');
const User = require('./backend/models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne();
  if(!user) return console.log('no user');
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  const video = await Video.findOne({ status: 'Safe', filename: { $regex: /\.mp4$/i } }) || await Video.findOne({ status: 'Safe' });
  if(!video) return console.log('no safe video');
  console.log(`URL: http://localhost:5000/api/videos/stream/${video._id}?token=${token}`);
  process.exit(0);
}
run();
