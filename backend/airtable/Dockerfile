FROM node:18.16.0-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
COPY staging/ .

# Add lockfile and package.json's of isolated subworkspace
FROM node:18.16.0-alpine AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
RUN apk add build-base libc6-compat gcompat curl
RUN curl -L https://unpkg.com/@pnpm/self-installer | node
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/ .
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install
RUN pnpm run build

FROM node:18.16.0-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 breezbook
USER breezbook

COPY --from=installer --chown=breezbook:nodejs /app/dist ./dist
COPY --from=installer --chown=breezbook:nodejs /app/prisma ./prisma
#COPY --from=installer --chown=breezbook:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=breezbook:nodejs /app/node_modules/prisma/libquery_engine-linux-musl-openssl* /app/prisma/
#COPY --from=installer --chown=breezbook:nodejs /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
CMD node dist/cjs/index.cjs