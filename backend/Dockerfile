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

# Pre-download models during build so they're ready at startup
RUN python -c "\
from transformers import pipeline; \
print('Downloading MiniLM...'); \
pipeline('zero-shot-classification', model='cross-encoder/nli-MiniLM2-L6-H768'); \
print('Downloading fine-tuned RoBERTa...'); \
pipeline('text-classification', model='venooma/roberta-truthlens'); \
print('All models downloaded.')"

# Expose port (Render injects $PORT at runtime)
EXPOSE 10000

# Run with gunicorn — uses $PORT env var for Render compatibility
CMD gunicorn \
    --workers 1 \
    --threads 4 \
    --timeout 300 \
    --bind 0.0.0.0:${PORT:-5000} \
    --access-logfile - \
    run:app
