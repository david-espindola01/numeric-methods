from flask import Flask, jsonify, request
import numpy as np
from fractions import Fraction

app = Flask(__name__)

@app.route('/solve', methods=['POST'])
def gauss_seidel_solve():
    data = request.get_json()

    # Validar los datos de entrada
    if 'A' not in data or 'b' not in data:
        return jsonify({"error": "Datos incompletos. Se requieren 'A' y 'b'"}), 400

    try:
        # Convertimos la matriz A y el vector b en fracciones
        A = np.array([[Fraction(str(value)) for value in row] for row in data['A']])
        b = np.array([Fraction(str(value)) for value in data['b']])

        tolerance = Fraction(str(data.get('tolerance', '1e-6')))
        max_iterations = int(data.get('max_iterations', 100))

        solution, iterations = gauss_seidel(A, b, tolerance, max_iterations)
        # Convertimos la solución a flotantes para la respuesta JSON
        solution = [float(x) for x in solution]
        return jsonify({"method": "Gauss-Seidel", "solution": solution, "iterations": iterations})
    
    except Exception as e:
        return jsonify({"error": f"Error en el procesamiento: {str(e)}"}), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "method": "Gauss-Seidel"})

def gauss_seidel(A, b, tolerance, max_iterations):
    n = len(A)
    x = np.zeros(n, dtype=object)  # Usamos dtype=object para trabajar con Fraction

    for iteration in range(max_iterations):
        x_old = x.copy()

        for i in range(n):
            s = sum(A[i][j] * x[j] for j in range(n) if j != i)
            x[i] = (b[i] - s) / A[i][i]

        # Verificamos la tolerancia usando valores absolutos de Fraction
        if all(abs(x[i] - x_old[i]) <= tolerance for i in range(n)):
            return x, iteration + 1

    return x, max_iterations

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5007, debug=True)