# syntax=docker/dockerfile:1

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend with frontend
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Prevent Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy backend requirements and install
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application source
COPY . /app/

# Copy built frontend from stage 1
COPY --from=frontend-builder /frontend/build /app/frontend/build

# Make start script executable
RUN chmod +x /app/start.sh

# Set PYTHONPATH
ENV PYTHONPATH="/app/backend"

# Expose port
EXPOSE 8080

# Run app
CMD ["./start.sh"]
