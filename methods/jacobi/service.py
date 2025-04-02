from flask import Flask, jsonify, request
import numpy as np
from fractions import Fraction 

app = Flask(__name__)

@app.route('/solve', methods=['POST'])
def jacobi_solve():
    data = request.get_json()

    if 'A' not in data or 'b' not in data:
        return jsonify({"error": "Datos incompletos. Se requieren 'A' y 'b'"}), 400

    try:
        # Convertimos la matriz A y el vector b en fracciones
        A = np.array([[Fraction(str(value)) for value in row] for row in data['A']], dtype=np.float64)
        b = np.array([Fraction(str(value)) for value in data['b']], dtype=np.float64)

        tolerance = float(data.get('tolerance', 1e-6))
        max_iterations = int(data.get('max_iterations', 100))

        solution, iterations = jacobi(A, b, tolerance, max_iterations)
        return jsonify({"method": "Jacobi", "solution": solution, "iterations": iterations})

    except Exception as e:
        return jsonify({"error": f"Error en el procesamiento: {str(e)}"}), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "method": "Jacobi"})

def jacobi(A, b, tolerance, max_iterations):
    n = len(A)
    x = np.zeros(n, dtype=np.float64)
    x_new = np.zeros(n, dtype=np.float64)

    for iteration in range(max_iterations):
        for i in range(n):
            s = sum(A[i][j] * x[j] for j in range(n) if j != i)
            x_new[i] = (b[i] - s) / A[i][i]

        if np.allclose(x, x_new, atol=tolerance):
            return x_new.tolist(), iteration + 1

        x = x_new.copy()

    return x.tolist(), max_iterations

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5006, debug=True)
    
