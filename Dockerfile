# Stage 1: Build frontend assets
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies and build frontend
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve backend with built frontend
FROM node:22-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend and backend code
COPY --from=builder /app/dist ./dist
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
