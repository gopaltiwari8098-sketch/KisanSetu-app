FROM python:3.9-slim

WORKDIR /app

# requirements pehle copy karo (cache optimization)
COPY requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

# Baaki files copy karo
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]