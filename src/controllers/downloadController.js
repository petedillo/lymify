/**
 * Download controller for the Lymify application
 * @module downloadController
 */

const logger = require('../utils/logger');
const musicDir = '/usr/src/app/music';

/**
 * Handle download request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {object} io - Socket.IO server instance
 * @returns {void}
 */
const handleDownload = async (req, res, io) => {
    const trackUrl = req.body.trackUrl;
    const downloadId = Date.now().toString();

    logger.info('Download request received for URL:', trackUrl);
    logger.info('Download ID:', downloadId);

    res.redirect(`/status?id=${downloadId}`);

    // Generate a client ID for the request
    const clientId = 'webapp-' + Date.now();
    logger.info('Generated client ID:', clientId);
    
    // Use the spotify service to handle the download
    const { downloadTrack } = require('../services/spotifyService');
    downloadTrack(trackUrl, clientId, io, downloadId);
};

/**
 * Get songs list
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {void}
 */
const getSongs = (req, res) => {
    const { getMp3Files } = require('../utils/fileUtils');
    
    getMp3Files(musicDir)
        .then(files => res.json(files))
        .catch(err => {
            logger.error('Error reading music directory:', err);
            res.status(500).send('Error reading music directory');
        });
};

module.exports = {
    handleDownload,
    getSongs
};
