# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ============================================
# Stage 2: Production image
# ============================================
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy only production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY server.js ./
COPY package.json ./
COPY public/ ./public/

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start app
CMD ["node", "server.js"]