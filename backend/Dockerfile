FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Expose port
EXPOSE 5000

# Run with gunicorn — long timeout for model inference + LIME
CMD ["gunicorn", \
     "--workers", "1", \
     "--threads", "4", \
     "--timeout", "300", \
     "--bind", "0.0.0.0:5000", \
     "--access-logfile", "-", \
     "run:app"]
