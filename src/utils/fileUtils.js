// File utilities
const fs = require('fs');
const path = require('path');

// Get list of MP3 files in directory
const getMp3Files = (directory) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files.filter(f => f.endsWith('.mp3')));
      }
    });
  });
};

// Check if directory exists
const directoryExists = (directory) => {
  return fs.existsSync(directory) && fs.lstatSync(directory).isDirectory();
};

// Create directory if it doesn't exist
const createDirectoryIfNotExists = (directory) => {
  if (!directoryExists(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

module.exports = {
  getMp3Files,
  directoryExists,
  createDirectoryIfNotExists
};
