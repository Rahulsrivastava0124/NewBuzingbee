# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_BLOG_API_URL=https://api.buzingbee.com/api/blog
ARG BLOG_API_URL=https://api.buzingbee.com/api/blog
ARG N8N_WEBHOOK_URL=https://n8n.buzingbee.com/webhook/48b7b4e4-a2b6-433f-acad-48c2fc4071cb
ARG SITE_URL=https://buzingbee.com

ENV NEXT_PUBLIC_BLOG_API_URL=$NEXT_PUBLIC_BLOG_API_URL
ENV BLOG_API_URL=$BLOG_API_URL
ENV N8N_WEBHOOK_URL=$N8N_WEBHOOK_URL
ENV SITE_URL=$SITE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

ARG NEXT_PUBLIC_BLOG_API_URL=https://api.buzingbee.com/api/blog
ARG BLOG_API_URL=https://api.buzingbee.com/api/blog
ARG N8N_WEBHOOK_URL=https://n8n.buzingbee.com/webhook/48b7b4e4-a2b6-433f-acad-48c2fc4071cb
ARG SITE_URL=https://buzingbee.com

ENV NEXT_PUBLIC_BLOG_API_URL=$NEXT_PUBLIC_BLOG_API_URL
ENV BLOG_API_URL=$BLOG_API_URL
ENV N8N_WEBHOOK_URL=$N8N_WEBHOOK_URL
ENV SITE_URL=$SITE_URL

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.env.production ./.env.production

EXPOSE 3000

CMD ["node", "server.js"]
