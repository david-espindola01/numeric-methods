FROM python:3.12-slim

WORKDIR /app

COPY service.py .
COPY requirements.txt . 

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5007

CMD ["python", "service.py"]
