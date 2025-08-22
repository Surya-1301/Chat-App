# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src ./src

# Expose port (Render will set PORT env var)
EXPOSE 4000

ENV NODE_ENV=production
CMD ["node", "src/index.js"]
