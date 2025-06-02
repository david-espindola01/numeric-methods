from flask import Flask, jsonify, request
import numpy as np
from fractions import Fraction
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def gauss_seidel_solve():
    data = request.get_json()

    if 'A' not in data or 'b' not in data:
        return jsonify({"error": "Datos incompletos. Se requieren 'A' y 'b'"}), 400

    try:
        A = np.array([[Fraction(str(value)) for value in row] for row in data['A']], dtype=np.float64)
        b = np.array([Fraction(str(value)) for value in data['b']], dtype=np.float64)

        tolerance = float(data.get('tolerance', 1e-6))
        max_iterations = int(data.get('max_iterations', 100))

        # Usa el resultado directamente, igual que en Jacobi
        result = gauss_seidel(A, b, tolerance, max_iterations)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": f"Error en el procesamiento: {str(e)}"}), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "method": "Gauss-Seidel"})

def gauss_seidel(A, b, tolerance, max_iterations):
    n = len(A)
    x = np.zeros(n, dtype=np.float64)
    iterations_detail = []

    for iteration in range(max_iterations):
        x_old = x.copy()
        row = {"iteration": iteration + 1, "x": x_old.tolist()}

        for i in range(n):
            s = sum(A[i][j] * x[j] for j in range(n) if j != i)
            x[i] = (b[i] - s) / A[i][i]

        error = np.linalg.norm(x - x_old)
        row["x_new"] = x.tolist()
        row["error"] = float(error)
        iterations_detail.append(row)

        if error < tolerance:
            return {
                "method": "Gauss-Seidel",
                "solution": x.tolist(),
                "iterations": iteration + 1,
                "iterations_detail": iterations_detail
            }

    return {
        "method": "Gauss-Seidel",
        "solution": x.tolist(),
        "iterations": max_iterations,
        "iterations_detail": iterations_detail
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5007, debug=True)