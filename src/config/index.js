/**
 * Application configuration
 * @module config
 */

/**
 * Configuration object
 * @type {Object}
 * @property {number} port - The port the server will listen on
 * @property {string} spotdlApiUrl - The URL of the spotdl API service
 * @property {Object} cors - CORS configuration
 * @property {Array|string} cors.origin - Allowed origins for CORS
 * @property {Array} cors.methods - Allowed HTTP methods for CORS
 */
const config = {
  port: process.env.PORT || 3300,
  spotdlApiUrl: process.env.SPOTDL_API_URL || 'http://spotdl:8800',
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3300', 'https://lymify.petedillo.com'],
    methods: ['GET', 'POST']
  }
};

module.exports = config;
