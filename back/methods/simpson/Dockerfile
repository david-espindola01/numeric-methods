FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
COPY service.py .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5008

CMD ["python", "service.py"]
