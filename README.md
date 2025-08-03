# Lymify

A containerized web application that allows users to download Spotify tracks through a simple web interface with real-time progress tracking using spotDL.

## Overview

This application consists of two Docker containers managed by `docker-compose.yml`:

- **webapp**: An Express.js server that handles user requests, displays a list of downloaded songs, and initiates new downloads
- **spotdl**: The spotDL/spotify-downloader container that performs the actual download from a Spotify URL to a shared music folder

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   webapp        │    │     spotdl      │
│  (Express.js)   │◄──►│ (spotify-dl)    │
│                 │    │                 │
│ • Web Interface │    │ • Download      │
│ • Status Track  │    │   Engine        │
│ • Orchestration │    │ • File Output   │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                   │
            ┌─────────────┐
            │   ./music   │
            │ (Shared Vol)│
            └─────────────┘
```

## Application Flow

1. User visits the home page (`/`) to see a list of all currently downloaded songs
2. User submits a Spotify track URL via a form to the `/download` endpoint
3. The webapp container sends a request to the spotdl container's web API to start the download process
4. The user is immediately redirected to a status page (`/status?id=:downloadId`) which connects to a Socket.IO server for real-time updates
5. The status page displays real-time progress updates from the download process using Socket.IO rooms to isolate updates per download session
6. Downloaded files are saved to the shared `./music` directory

## Prerequisites

- Docker
- Docker Compose
- Internet connection for downloading tracks

## Project Structure

```
lymify/
├── src/                     # Source code
│   ├── config/              # Configuration files
│   │   └── index.js         # Application configuration
│   ├── controllers/         # Route controllers
│   │   └── downloadController.js  # Download controller
│   ├── routes/              # Route definitions
│   │   └── index.js         # Main routes
│   ├── services/            # Business logic
│   │   └── spotifyService.js      # Spotify download service
│   ├── utils/               # Helper functions
│   │   ├── fileUtils.js     # File utilities
│   │   ├── logger.js        # Logger utility
│   │   └── socketUtils.js   # Socket.IO utility functions
│   ├── public/              # Static files
│   │   ├── css/             # CSS styles
│   │   ├── js/              # JavaScript files
│   │   ├── index.html       # Main page
│   │   └── status.html      # Download status page
│   └── server.js            # Express.js server
├── docker/                  # Docker configuration
│   ├── dev.Dockerfile       # Development Dockerfile
│   └── prod.Dockerfile      # Production Dockerfile
├── music/                   # Shared directory for downloaded songs
├── tests/                   # Test files
│   ├── server.test.js       # Server tests
│   └── logger.test.js       # Logger tests
├── .spotdl-cache/           # Cache for spotdl
├── .env.example             # Environment variables example
├── .gitignore               # Git ignore file
├── docker-compose.yml       # Multi-container orchestration
├── package.json             # Node.js dependencies
└── README.md                # This file
```

## Configuration

The application can be configured using the following environment variables. You can set them in your `docker-compose.yml` file or directly in your shell.

| Variable         | Description                                     | Default                  |
|------------------|-------------------------------------------------|--------------------------|
| `NODE_ENV`       | The environment mode (development/production)   | `development`            |
| `PORT`           | The port on which the web server will listen.   | `3300`                   |
| `SPOTDL_API_URL` | The full URL for the spotDL container's API.    | `http://spotdl:8800`     |

You can also create a `.env` file in the root directory based on the `.env.example` file to set these variables.

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/petedillo/lymify.git
cd lymify
```

### Step 2: Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file to set your preferred configuration.

### Step 3: Build and Run with Docker Compose

#### Option A: Build from Source

```yaml
version: '3.8'
services:
  lymify:
    build:
      context: .
      dockerfile: docker/dev.Dockerfile
    ports:
      - "3300:3300"
    volumes:
      - ./music:/usr/src/app/music
      - /var/run/docker.sock:/var/run/docker.sock
      - ./.spotdl-cache:/app/.spotdl-cache
    restart: unless-stopped
```

#### Option B: Use Pre-built Image

For a quicker setup, you can use the pre-built image from the registry. Create `docker-compose.yml` with the following:

```yaml
version: '3.8'
services:
  lymify:
    image: petedillo.com/lymify:latest
    ports:
      - "3300:3300"
    volumes:
      - ./music:/usr/src/app/music
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - spotdl

  spotdl:
    image: spotdl/spotify-downloader:latest
    entrypoint: ["python3", "-m", "spotdl", "web", "--host", "0.0.0.0", "--port", "8800"]
    ports:
      - "8800:8800"
    volumes:
      - ./music:/music
      - ./.spotdl-cache:/app/.spotdl-cache
    restart: unless-stopped
```

Then run:

```bash
docker compose up -d
```

## Development

### Local Development

The webapp can be developed locally by running the Express.js server directly:

```bash
# Install dependencies
npm install

# Run the server in development mode
npm run dev
```

Note that the spotdl container must be running for downloads to work. You can start it with:

```bash
docker compose up -d spotdl
```

### Logger Utility

The application now includes a built-in logger utility (`src/utils/logger.js`) that:

- Is enabled in development mode but disabled in production
- Provides different log levels: `info`, `warn`, `error`, and `debug`
- Can be controlled using the `NODE_ENV` environment variable

To use the logger in your code:

```javascript
const logger = require('./utils/logger');

logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message');
logger.debug('Debug message');
```

### Testing

The application includes unit tests for the logger utility:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Project Structure Details

#### Step 1: Configuration

The application configuration is defined in `src/config/index.js`. This file handles environment variables and provides default values.

For details, please refer to the [src/config/index.js](src/config/index.js) file.

#### Step 2: Route Controllers

Route controllers handle the business logic for different routes. The main controller is `downloadController.js` which manages the download process.

For implementation details, please refer to the [src/controllers/downloadController.js](src/controllers/downloadController.js) file.

#### Step 3: Route Definitions

Routes are defined in `src/routes/index.js`. This file maps URLs to controller functions.

For implementation details, please refer to the [src/routes/index.js](src/routes/index.js) file.

#### Step 4: Services

Services contain the core business logic. The main service is `spotifyService.js` which handles communication with the spotdl container.

For implementation details, please refer to the [src/services/spotifyService.js](src/services/spotifyService.js) file.

#### Step 5: Utilities

Utility functions are located in `src/utils/`. This includes file utilities and the new logger utility.

For implementation details, please refer to the files in the [src/utils/](src/utils/) directory.

#### Step 6: Express.js Application

The Express.js server is implemented in `server.js`. This file contains all the logic for:

- Serving the web interface
- Handling download requests
- Communicating with the spotdl container via its web API
- Providing real-time status updates through Socket.IO

For implementation details, please refer to the [server.js](server.js) file.
### Step 7: HTML Templates

The web interface consists of three main files in the `public/` directory:

- `index.html`: The main page that displays downloaded songs and provides the download form
- `status.html`: The status page that shows real-time progress updates during downloads
- `style.css`: The stylesheet that provides styling for the web interface

For implementation details, please refer to the files in the [public/](public/) directory.

## Running the Application

### Step 1: Build and Start

```bash
# Navigate to project directory
cd lymify

# Build and start containers
docker compose up --build
```

### Step 2: Access the Application

1. Open your web browser
2. Navigate to `http://localhost:3300`
3. Enter a Spotify track URL (e.g., `https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh`)
4. Click "Download Track"
5. Monitor progress on the status page

### Step 3: Check Downloaded Files

Downloaded songs will appear in the `./music` directory on your local machine.

## Usage Examples

### Valid Spotify URLs
- `https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh`
- `https://open.spotify.com/track/1L8Qp9x7b6l1H3X7F0X1o1`

### API Endpoints

- `GET /` - Main page with download form and list of songs
- `POST /download` - Submit download request
- `GET /status` - Status page for download progress
- `GET /api/songs` - List of downloaded songs

## Troubleshooting

### Common Issues

1. **Container fails to start**
   ```bash
   docker compose logs webapp
   docker compose logs spotdl
   ```

2. **Download fails**
   - Check if Spotify URL is valid
   - Ensure spotdl container is running
   - Check container logs for errors

3. **Files not appearing**
   - Verify `./music` directory permissions
   - Check if download completed successfully

### Logs and Debugging

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f webapp
docker compose logs -f spotdl

# Execute commands in containers
docker compose exec webapp sh
docker compose exec spotdl sh
```

## Stopping the Application

```bash
# Stop containers
docker compose down

# Stop and remove volumes
docker compose down -v
```

## License

MIT License - feel free to modify and distribute as needed.

## Usage

1. Start the application:
   ```bash
   docker compose up -d
   ```

2. Access the web interface at http://localhost:3300

3. Enter a Spotify track URL in the form and click "Download Track"

4. You'll be redirected to a status page where you can monitor the download progress in real-time

5. Once completed, the downloaded song will appear in the list on the main page

6. The downloaded files are stored in the `./music` directory

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This application is for educational purposes. Ensure you comply with Spotify's Terms of Service and respect copyright laws when downloading music.
