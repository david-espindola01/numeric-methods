FROM python:3.12

WORKDIR /app

COPY service.py .
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 5002

CMD ["python", "service.py", "5002"]
