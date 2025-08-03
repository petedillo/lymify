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
4. The user is immediately redirected to a status page (`/status?id=:downloadId`) which connects to a WebSocket for real-time updates
5. The status page displays real-time progress updates from the download process
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
│   │   └── fileUtils.js     # File utilities
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
│   └── server.test.js       # Server tests
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
| `PORT`           | The port on which the web server will listen.   | `3000`                   |
| `SPOTDL_API_URL` | The full URL for the spotDL container's API.    | `http://spotdl:8800`     |

You can also create a `.env` file in the root directory based on the `.env.example` file to set these variables.

## Setup Instructions

### Step 1: Create Project Directory

```bash
mkdir lymify
cd lymify
mkdir -p music public
```

### Step 2: Create Docker Compose Configuration

You have two options for setting up the `docker-compose.yml` file.

#### Option A: Build from Source

Use this option if you plan to modify the code. Create a `docker-compose.yml` file with the following content:

```yaml
version: '3.8'
services:
  lymify:
    build:
      context: .
      dockerfile: docker/dev.Dockerfile
      target: development
    ports:
      - "3300:3300"
    environment:
      - NODE_ENV=development
      - PORT=3300
      - SPOTDL_API_URL=http://spotdl:8800
    volumes:
      - ./music:/usr/src/app/music
      - .:/usr/src/app
      - /usr/src/app/node_modules
    depends_on:
      - spotdl
    command: ["npx", "nodemon", "src/server.js"]

  spotdl:
    image: spotdl/spotify-downloader:latest
    command: ["web", "--host", "0.0.0.0", "--port", "8800", "--keep-alive", "--web-use-output-dir"]
    volumes:
      - ./music:/music
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
      - "3001:3000"
    volumes:
      - ./music:/usr/src/app/music
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - spotdl

  spotdl:
    image: spotdl/spotify-downloader:latest
    command: web --host 0.0.0.0 --keep-alive
    ports:
      - "8800:8800"
    volumes:
      - ./music:/music
      - ./.spotdl-cache:/app/.spotdl-cache
    restart: unless-stopped
```

### Step 3: Dockerfile for Webapp

The Dockerfile for the webapp is defined in `docker/dev.Dockerfile` and `docker/prod.Dockerfile`. These files set up the Node.js environment and install all necessary dependencies.

For details, please refer to the [docker/dev.Dockerfile](docker/dev.Dockerfile) and [docker/prod.Dockerfile](docker/prod.Dockerfile) files.
### Step 4: Package Configuration

The package configuration is defined in `package.json`. This file includes all the necessary dependencies for the web application:

- Express.js for the web server
- Dockerode for Docker container management
- Socket.IO for real-time communication
- Node-fetch for making HTTP requests

For details, please refer to the [package.json](package.json) file.

### Step 5: Express.js Application

The Express.js server is implemented in `server.js`. This file contains all the logic for:

- Serving the web interface
- Handling download requests
- Communicating with the spotdl container via its web API
- Providing real-time status updates through Socket.IO

For implementation details, please refer to the [server.js](server.js) file.
### Step 6: HTML Templates

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
2. Navigate to `http://localhost:3001`
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

### Stopping the Application

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
