# Usa una imagen base de Python
FROM python:3.11

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia los archivos necesarios al contenedor
COPY service.py requirements.txt ./

# Instala las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Expone el puerto 5006 para el microservicio
EXPOSE 5006

# Comando para ejecutar el servicio
CMD ["python", "jacobi_service.py"]