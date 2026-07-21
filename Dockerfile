# ---------- Base ----------
FROM node:20-alpine AS base

WORKDIR /app

# Required for Prisma's query engine and Sharp on Alpine
RUN apk add --no-cache libc6-compat

# ---------- Dependencies ----------
FROM base AS deps

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

# ---------- Build ----------
FROM deps AS builder

COPY . .

RUN npx prisma generate
RUN npm run build

# ---------- Production ----------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the compiled application
COPY --from=builder --chown=node:node /app/dist ./dist

# Copy the generated Prisma Client
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=node:node /app/node_modules/@prisma ./node_modules/@prisma

# Run the application as a non-root user
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]