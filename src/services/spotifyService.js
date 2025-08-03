// Spotify service
const fetch = require('node-fetch');
const WebSocket = require('ws');
const config = require('../config');

// Download track from Spotify
const downloadTrack = async (trackUrl, clientId, io, downloadId) => {
  try {
    console.log('Creating WebSocket connection to:', `${config.spotdlApiUrl.replace('http', 'ws')}/api/ws?client_id=${clientId}`);
    // Create a WebSocket connection to register the client
    const ws = new WebSocket(`${config.spotdlApiUrl.replace('http', 'ws')}/api/ws?client_id=${clientId}`);
    
    ws.on('message', (data) => {
      console.log('Received WebSocket message:', data.toString());
      const progressData = JSON.parse(data);
      
      // Forward progress updates to the browser client
      if (progressData.progress !== undefined && progressData.message) {
        if (io && typeof io.to === 'function') {
          console.log('Sending status update to client:', progressData.message);
          io.to(downloadId).emit('statusUpdate', { message: progressData.message });
        }
      }
      
      // Check if the download is complete
      if (progressData.message && progressData.message.includes('Download completed') || progressData.message && progressData.message.includes('Done')) {
        console.log('Download completed, closing WebSocket connection');
        if (io && typeof io.to === 'function') {
          io.to(downloadId).emit('statusUpdate', { message: 'Download finished!' });
        }
        ws.close();
      }
    });

    ws.on('open', async () => {
      console.log('WebSocket connection opened');
      // Send request to spotdl web API once WebSocket is open
      const response = await fetch(`${config.spotdlApiUrl}/api/download/url?url=${encodeURIComponent(trackUrl)}&client_id=${clientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('spotdl API response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('spotdl API error response:', errorText);
        if (io && typeof io.to === 'function') {
          console.log('Sending error to client:', `ERROR: Failed to start download - ${response.statusText} - ${errorText}`);
          io.to(downloadId).emit('statusUpdate', { message: `ERROR: Failed to start download - ${response.statusText} - ${errorText}` });
        }
        ws.close();
        return;
      }

      // The response body is the path to the downloaded file, not a stream
      // We don't close the WebSocket connection here because we need to keep it open
      // to receive progress updates. The connection will be closed when the download
      // is actually complete or when we receive a completion message.
      const filePath = await response.json();
      console.log('spotdl API response body (download path):', filePath);
      if (io && typeof io.to === 'function') {
        console.log('Sending download started message to client');
        io.to(downloadId).emit('statusUpdate', { message: 'Download started...' });
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      if (io && typeof io.to === 'function') {
        console.log('Sending connection closed message to client');
        io.to(downloadId).emit('statusUpdate', { message: 'Connection to spotdl closed.' });
      }
    });

    ws.on('error', (error) => {
      console.log('WebSocket error:', error);
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
