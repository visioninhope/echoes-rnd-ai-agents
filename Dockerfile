# Use an official Node.js runtime as the base image
FROM node:18-bullseye-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock files
COPY package.json yarn.lock ./
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libgif-dev \
    libpixman-1-dev \
    libsqlcipher-dev \
    && rm -rf /var/lib/apt/lists/*
ENV PYTHON=python3
# Install dependencies
RUN yarn install

# Copy the rest of the application code, excluding node_modules
COPY . .

# Build the Next.js application
RUN yarn build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["yarn", "start"]
