// Main routes
const express = require('express');
const path = require('path');
const fs = require('fs');
const { handleDownload, getSongs } = require('../controllers/downloadController');

const router = express.Router();
const musicDir = path.join(__dirname, '..', 'music');

// Home page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Download route
router.post('/download', (req, res) => {
    // io will be injected via the module.exports function
    // This is just a placeholder to avoid errors
    handleDownload(req, res, null);
});

// Status page
router.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'status.html'));
});

// API routes
router.get('/api/songs', getSongs);

module.exports = (io) => {
    // Inject io instance into routes that need it
    router.post('/download', (req, res) => {
        handleDownload(req, res, io);
    });
    return router;
};
