FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY index.js ./index.js

# config.js będzie mountowane z hosta
VOLUME [ "/app/config" ]

CMD ["node", "index.js"]
