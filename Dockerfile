FROM node:20-alpine

# Install curl, tar, ca-certificates, openssl for Sing-box setup
RUN apk add --no-cache curl tar ca-certificates openssl bash

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY index.js ./

ENV PORT=443
ENV PANEL_PATH=mavis

EXPOSE 443

CMD ["node", "index.js"]
