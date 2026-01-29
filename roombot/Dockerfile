FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY index.js ./index.js

# config.js will be mounted from host
VOLUME [ "/app/config" ]

CMD ["node", "index.js"]
