FROM node:20-alpine AS base
WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy server source
COPY server/src ./server/src

# Non-root user for security
RUN addgroup -S gecko && adduser -S gecko -G gecko
USER gecko

EXPOSE 3001
CMD ["node", "server/src/server.js"]
