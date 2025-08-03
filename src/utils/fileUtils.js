/**
 * File utilities for the Lymify application
 * @module fileUtils
 */

const fs = require('fs');
const path = require('path');

/**
 * Get list of MP3 files in directory
 * @param {string} directory - The directory to search for MP3 files
 * @returns {Promise<string[]>} Promise that resolves to array of MP3 file names
 */
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

/**
 * Check if directory exists
 * @param {string} directory - The directory path to check
 * @returns {boolean} True if directory exists, false otherwise
 */
const directoryExists = (directory) => {
  return fs.existsSync(directory) && fs.lstatSync(directory).isDirectory();
};

/**
 * Create directory if it doesn't exist
 * @param {string} directory - The directory path to create
 * @returns {void}
 */
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
