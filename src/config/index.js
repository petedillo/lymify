// Application configuration
const config = {
  port: process.env.PORT || 3300,
  spotdlApiUrl: process.env.SPOTDL_API_URL || 'http://spotdl:8800',
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3300', 'https://lymify.petedillo.com'],
    methods: ['GET', 'POST']
  }
};

module.exports = config;
