FROM node:20-alpine AS base
WORKDIR /app

# Install all server dependencies (tsx is a devDep needed at runtime)
COPY server/package*.json ./server/
RUN cd server && npm ci

# Copy server source + entry point
COPY server/src ./server/src
COPY server/server.js ./server/server.js

# Non-root user for security
RUN addgroup -S gecko && adduser -S gecko -G gecko
USER gecko

EXPOSE 3001
WORKDIR /app/server
CMD ["npm", "start"]
