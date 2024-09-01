# Build stage
FROM node:21.6.1 AS build

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the code
COPY . .

# Build the React app
RUN npm run build

# Production stage
FROM node:21.6.1-slim

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built assets from the build stage
COPY --from=build /usr/src/app/build ./build

# Copy server files
COPY server ./server

# Expose the port the app runs on
EXPOSE 5000

# Start the server
CMD ["node", "server/server.js"]