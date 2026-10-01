# =================================================================
# Stage 1: Build Frontend Assets
# =================================================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# =================================================================
# Stage 2: Production Server Runtime
# =================================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production backend dependencies only
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend application files
COPY --chown=node:node backend/ ./backend/

# Copy compiled frontend production assets
COPY --chown=node:node --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose default application port
EXPOSE 5000

# Switch to non-root user
USER node

# Start Express server
CMD ["node", "backend/server.js"]
