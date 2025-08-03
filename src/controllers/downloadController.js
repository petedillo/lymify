// Download controller
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const config = require('../config');

const spotdlApiUrl = config.spotdlApiUrl;
const musicDir = '/usr/src/app/music';

// Handle download request
const handleDownload = async (req, res, io) => {
    const trackUrl = req.body.trackUrl;
    const downloadId = Date.now().toString();

    console.log('Download request received for URL:', trackUrl);
    console.log('Download ID:', downloadId);

    res.redirect(`/status?id=${downloadId}`);

    // Generate a client ID for the request
    const clientId = 'webapp-' + Date.now();
    console.log('Generated client ID:', clientId);
    
    // Use the spotify service to handle the download
    const { downloadTrack } = require('../services/spotifyService');
    downloadTrack(trackUrl, clientId, io, downloadId);
};

// Get songs list
const getSongs = (req, res) => {
    const { getMp3Files } = require('../utils/fileUtils');
    
    getMp3Files(musicDir)
        .then(files => res.json(files))
        .catch(err => res.status(500).send('Error reading music directory'));
};

module.exports = {
    handleDownload,
    getSongs
};
