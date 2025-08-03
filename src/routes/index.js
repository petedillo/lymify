/**
 * Main routes for the Lymify application
 * @module routes
 */

const express = require('express');
const { handleDownload, getSongs } = require('../controllers/downloadController');

const router = express.Router();

/**
 * GET / - Home page route
 * Renders the index.ejs template
 */
router.get('/', (req, res) => {
    res.render('index');
});

/**
 * Download route
 * This route is defined in the module.exports function below
 * to ensure the io instance is properly injected
 */

/**
 * GET /status - Status page route
 * Renders the status.ejs template
 */
router.get('/status', (req, res) => {
    res.render('status');
});

/**
 * GET /api/songs - API route to get songs list
 * @returns {Array} List of downloaded songs
 */
router.get('/api/songs', getSongs);

/**
 * Export routes with Socket.IO instance
 * @param {object} io - Socket.IO server instance
 * @returns {object} Express router
 */
module.exports = (io) => {
    // Inject io instance into routes that need it
    router.post('/download', (req, res) => {
        handleDownload(req, res, io);
    });
    return router;
};
