const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware for Parsing Form Data
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Login Function
async function login(enrollmentNo, password) {
  const loginData = {
    enrollmentNo: enrollmentNo,
    password: password,
    platform: "A"
  };

  try {
    const response = await axios.post('https://gateway-production.allen.ac.in/userms/v1/login', loginData, {
      headers: {
        'regid': 'dCMGFzWnTPuEmISbChjWAI:APA91bFhlIsu4_NXcXEUydgA8zLGgysc07wBrvWtyburxMEwQdXxR82kEeqKIwu7Nk6ToAwaUIZ-91P5FOcsC524F9G-TBuwsLVWGkB7zOdMOVKIzAWNvXhsR9E_LeYz70eFNwAouCYk',
        'appversion': '3.19.4',
        'deviceinfo': 'Xiaomi#M2007J20CI#10',
        'user-agent': 'and',
        'platform': 'A',
        'content-type': 'application/json; charset=UTF-8',
        'accept-encoding': 'gzip'
      }
    });
    return response.data.token;
  } catch (error) {
    console.error("Login failed", error);
    return null;
  }
}

// Batch Videos Fetch Function
async function getBatchVideos(token) {
  try {
    const response = await axios.get('https://gateway-production.allen.ac.in/batch/videos', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'platform': 'A',
        'content-type': 'application/json'
      }
    });
    return response.data.videos;
  } catch (error) {
    console.error("Failed to fetch batch videos", error);
    return [];
  }
}

// Save URLs to TXT File
function saveUrlsToTxtFile(urls, enrollmentNo) {
  const fileContent = urls.join('\n');
  const filePath = path.join(__dirname, 'public', `${enrollmentNo}_batch_urls.txt`);
  fs.writeFileSync(filePath, fileContent, 'utf8');
  return filePath;
}

// POST Endpoint to Handle Login and Extract URLs
app.post('/extract', async (req, res) => {
  const { enrollmentNo, password } = req.body;

  const token = await login(enrollmentNo, password);
  if (!token) {
    return res.status(500).send('Login failed. Please check your credentials.');
  }

  const videos = await getBatchVideos(token);
  if (videos.length === 0) {
    return res.status(500).send('Failed to fetch batch videos.');
  }

  const videoUrls = videos.map(video => video.url);
  const filePath = saveUrlsToTxtFile(videoUrls, enrollmentNo);

  res.send(`<a href="/${enrollmentNo}_batch_urls.txt" download>Download Your Batch URLs</a>`);
});

// Start the Server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
