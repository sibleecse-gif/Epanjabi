FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --ignore-scripts

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

ENV NODE_ENV=production
EXPOSE 5000
CMD ["sh", "-c", "npx prisma db push && node dist/app.js"]
