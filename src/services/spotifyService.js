/**
 * Spotify service for the Lymify application
 * @module spotifyService
 */

const fetch = require('node-fetch');
const WebSocket = require('ws');
const config = require('../config');
const logger = require('../utils/logger');
const { emitStatusUpdate } = require('../utils/socketUtils');

const spotdlApiUrl = config.spotdlApiUrl;

/**
 * Download track from Spotify
 * @param {string} trackUrl - The URL of the track to download
 * @param {string} clientId - The client ID for the WebSocket connection
 * @param {object} io - The Socket.IO server instance
 * @param {string} downloadId - The ID of the download session
 * @returns {Promise<void>}
 */
const downloadTrack = async (trackUrl, clientId, io, downloadId) => {
  try {
    logger.info('Creating WebSocket connection to:', `${config.spotdlApiUrl.replace('http', 'ws')}/api/ws?client_id=${clientId}`);
    logger.info('Socket.IO instance available at function start:', !!io);
    if (io) {
      logger.info('Socket.IO instance type:', typeof io);
      logger.info('Socket.IO to function available:', typeof io.to);
    }
    // Create a WebSocket connection to register the client
    const ws = new WebSocket(`${config.spotdlApiUrl.replace('http', 'ws')}/api/ws?client_id=${clientId}`);
    
    ws.on('message', (data) => {
      logger.debug('Received WebSocket message:', data.toString());
      logger.debug('Socket.IO instance available in message handler:', !!io);
      if (io) {
        logger.debug('Socket.IO instance type in message handler:', typeof io);
        logger.debug('Socket.IO to function available in message handler:', typeof io.to);
      }
      const progressData = JSON.parse(data);
      
      // Forward progress updates to the browser client
      if (progressData.progress !== undefined && progressData.message) {
        emitStatusUpdate(io, downloadId, progressData.message, 'info', progressData.progress);
      }
      
      // Check if the download is complete
      if (progressData.message && progressData.message.includes('Download completed') || progressData.message && progressData.message.includes('Done')) {
        logger.info('Download completed, closing WebSocket connection');
        emitStatusUpdate(io, downloadId, 'Download finished!', 'success');
        ws.close();
      }
    });

    ws.on('open', async () => {
      logger.info('WebSocket connection opened');
      // Send request to spotdl web API once WebSocket is open
      const response = await fetch(`${config.spotdlApiUrl}/api/download/url?url=${encodeURIComponent(trackUrl)}&client_id=${clientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      logger.debug('spotdl API response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('spotdl API error response:', errorText);
        emitStatusUpdate(io, downloadId, `ERROR: Failed to start download - ${response.statusText} - ${errorText}`, 'error');
        ws.close();
        return;
      }

      // The response body is the path to the downloaded file, not a stream
      // We don't close the WebSocket connection here because we need to keep it open
      // to receive progress updates. The connection will be closed when the download
      // is actually complete or when we receive a completion message.
      const filePath = await response.json();
      logger.debug('spotdl API response body (download path):', filePath);
      logger.info('Sending download started message to client');
      emitStatusUpdate(io, downloadId, 'Download started...', 'info');
    });

    ws.on('close', () => {
      logger.info('WebSocket connection closed');
      emitStatusUpdate(io, downloadId, 'Connection to spotdl closed.', 'info');
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      emitStatusUpdate(io, downloadId, `WebSocket error: ${error.message}`, 'error');
    });
  } catch (error) {
    emitStatusUpdate(io, downloadId, `ERROR: ${error.message}`, 'error');
  }
};

module.exports = {
  downloadTrack
};
