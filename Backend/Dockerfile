FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Run as the unprivileged user that ships with the image
USER node
EXPOSE 3000
CMD ["node", "index.js"]
