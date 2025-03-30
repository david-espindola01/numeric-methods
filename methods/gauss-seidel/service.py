from flask import Flask, jsonify, request
import numpy as np

app = Flask(__name__)

@app.route('/solve', methods=['POST'])
def gauss_seidel_solve():
    data = request.get_json()

    # Validar los datos de entrada
    if 'A' not in data or 'b' not in data:
        return jsonify({"error": "Datos incompletos. Se requieren 'A' y 'b'"}), 400

    try:
        A = np.array(data['A'], dtype=float)
        b = np.array(data['b'], dtype=float)
        tolerance = float(data.get('tolerance', 1e-6))
        max_iterations = int(data.get('max_iterations', 100))

        solution, iterations = gauss_seidel(A, b, tolerance, max_iterations)
        return jsonify({"method": "Gauss-Seidel", "solution": solution, "iterations": iterations})
    
    except Exception as e:
        return jsonify({"error": f"Error en el procesamiento: {str(e)}"}), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "method": "Gauss-Seidel"})

def gauss_seidel(A, b, tolerance, max_iterations):
    n = len(A)
    x = np.zeros(n)

    for iteration in range(max_iterations):
        x_old = x.copy()

        for i in range(n):
            s = sum(A[i][j] * x[j] for j in range(n) if j != i)
            x[i] = (b[i] - s) / A[i][i]

        if np.allclose(x, x_old, atol=tolerance):
            return x.tolist(), iteration + 1

    return x.tolist(), max_iterations

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5007, debug=True)
