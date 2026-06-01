FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip

# Install torch CPU-only first (avoids pulling 800MB CUDA build)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY security/ ./security/

EXPOSE 8000
