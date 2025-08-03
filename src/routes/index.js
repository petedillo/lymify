// Main routes
const express = require('express');
const path = require('path');
const fs = require('fs');
const { handleDownload, getSongs } = require('../controllers/downloadController');

const router = express.Router();
const musicDir = path.join(__dirname, '..', 'music');

/**
 * Home page route
 */
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

/**
 * Download route
 */
// This route is defined in the module.exports function below
// to ensure the io instance is properly injected

/**
 * Status page route
 */
router.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'status.html'));
});

/**
 * API route to get songs list
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
