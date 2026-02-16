# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY tec-payment-service/package*.json ./
COPY tec-payment-service/tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema from root
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY tec-payment-service/src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY tec-payment-service/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy prisma schema from root
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5003

# Start the service
CMD ["node", "dist/index.js"]
