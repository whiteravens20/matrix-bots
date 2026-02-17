FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Run the bot
CMD ["npm", "start"]
