# Build and serve the React application using Node.js
FROM docker.1ms.run/node:18-alpine

# Set the working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml (if exists)
COPY package.json ./
COPY pnpm-workspace.yaml* ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["pnpm", "run", "dev"]