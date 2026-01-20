# syntax=docker/dockerfile:1

# Base image with Python runtime
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Prevent Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED=1

# Install system dependencies that are commonly needed for scientific Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip separately to ensure latest tooling
RUN pip install --no-cache-dir --upgrade pip

# Copy requirement files first for better caching during iterative builds
COPY backend/requirements.txt backend/requirements.txt

# Install backend Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application source code
COPY . /app/

# Ensure start script is executable inside the container
RUN chmod +x /app/start.sh

# Ensure our backend package is importable regardless of PYTHONPATH
ENV PYTHONPATH="/app/backend"

# Expose the port the FastAPI app listens on
EXPOSE 8080

# Entrypoint script handles app startup details
CMD ["./start.sh"]
