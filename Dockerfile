# Stage 1: Build
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# Stage 2: Production
FROM node:24-alpine AS production

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/migrate-mongo-config.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S accesscore -u 1001

# Change ownership
RUN chown -R accesscore:nodejs /app

# Switch to non-root user
USER accesscore

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main"]
