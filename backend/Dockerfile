FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src 
COPY --from=builder /app/tsconfig.json ./ 

RUN mkdir -p uploads/avatars uploads/covers uploads/builds

EXPOSE 3000
CMD ["node", "dist/main"]