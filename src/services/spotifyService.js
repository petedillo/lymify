// Spotify service
const fetch = require('node-fetch');
const WebSocket = require('ws');
const config = require('../config');

// Download track from Spotify
const downloadTrack = async (trackUrl, clientId, io, downloadId) => {
  try {
    // Create a WebSocket connection to register the client
    const ws = new WebSocket(`${config.spotdlApiUrl.replace('http', 'ws')}/api/ws?client_id=${clientId}`);
    
    ws.on('message', (data) => {
      const progressData = JSON.parse(data);
      // Forward progress updates to the browser client
      if (progressData.progress !== undefined && progressData.message) {
        if (io && typeof io.to === 'function') {
          console.log('Sending status update to client:', progressData.message);
          io.to(downloadId).emit('statusUpdate', { message: progressData.message });
        }
      }
    });

    ws.on('open', async () => {
      // Send request to spotdl web API once WebSocket is open
      const response = await fetch(`${config.spotdlApiUrl}/api/download/url?url=${encodeURIComponent(trackUrl)}&client_id=${clientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (io && typeof io.to === 'function') {
          console.log('Sending error to client:', `ERROR: Failed to start download - ${response.statusText} - ${errorText}`);
          io.to(downloadId).emit('statusUpdate', { message: `ERROR: Failed to start download - ${response.statusText} - ${errorText}` });
        }
        ws.close();
        return;
      }

      // The response body is the path to the downloaded file, not a stream
      const filePath = await response.json();
      if (io && typeof io.to === 'function') {
        console.log('Sending completion message to client:', `Download completed: ${filePath}`);
        io.to(downloadId).emit('statusUpdate', { message: `Download completed: ${filePath}` });
      }
      ws.close();
    });

    ws.on('close', () => {
      if (io && typeof io.to === 'function') {
        console.log('Sending connection closed message to client');
        io.to(downloadId).emit('statusUpdate', { message: 'Connection to spotdl closed.' });
      }
    });

    ws.on('error', (error) => {
      if (io && typeof io.to === 'function') {
        console.log('Sending WebSocket error to client:', `WebSocket error: ${error.message}`);
        io.to(downloadId).emit('statusUpdate', { message: `WebSocket error: ${error.message}` });
      }
    });
  } catch (error) {
    if (io && typeof io.to === 'function') {
      console.log('Sending error to client:', `ERROR: ${error.message}`);
      io.to(downloadId).emit('statusUpdate', { message: `ERROR: ${error.message}` });
    }
  }
};

module.exports = {
  downloadTrack
};
