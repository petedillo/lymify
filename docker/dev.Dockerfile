# Base stage
FROM node:22 AS base
WORKDIR /usr/src/app

# Development stage
FROM base AS development
RUN npm install -g nodemon
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3300
CMD ["npx", "nodemon", "src/server.js"]

# Production stage
FROM base AS production
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 3300
CMD ["node", "src/server.js"]
