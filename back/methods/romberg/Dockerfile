FROM python:3.12-slim

WORKDIR /app

COPY service.py .

RUN pip install --no-cache-dir flask sympy numpy

EXPOSE 5011

CMD ["python", "service.py"]
