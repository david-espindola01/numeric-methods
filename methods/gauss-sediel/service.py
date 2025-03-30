from flask import Flask, jsonify
import numpy as np

app = Flask(__name__)

class GaussSeidelMethod:
    def __init__(self, A, b, tolerance=1e-6, max_iterations=100):
        self.A = A
        self.b = b
        self.tolerance = tolerance
        self.max_iterations = max_iterations

    def solve(self):
        n = len(self.A)
        x = np.zeros(n)

        for iteration in range(self.max_iterations):
            x_old = x.copy()

            for i in range(n):
                s = sum(self.A[i][j] * x[j] for j in range(n) if j != i)
                x[i] = (self.b[i] - s) / self.A[i][i]

            if np.allclose(x, x_old, atol=self.tolerance):
                return x.tolist(), iteration + 1

        return x.tolist(), self.max_iterations

# Sistemas de ecuaciones
A1 = np.array([
    [3, 0, -3/2, 1],
    [-2/3, 3, -3, 0],
    [0, 0, 3, -3/2],
    [-1/2, 0, 0, 1]
])
b1 = np.array([1, 1, 1, 1])

A2 = np.array([
    [6, 0, 3, 0],
    [1/4, -4, -4/3, 0],
    [0, 0, 6, 1/3],
    [2, 0, 0, 6]
])
b2 = np.array([1/2, 1/2, 1/2, 1/2])

@app.route('/gauss-seidel/1', methods=['GET'])
def gauss_seidel_1():
    solver = GaussSeidelMethod(A1, b1)
    solution, iterations = solver.solve()
    return jsonify({"method": "Gauss-Seidel", "system": 1, "solution": solution, "iterations": iterations})

@app.route('/gauss-seidel/2', methods=['GET'])
def gauss_seidel_2():
    solver = GaussSeidelMethod(A2, b2)
    solution, iterations = solver.solve()
    return jsonify({"method": "Gauss-Seidel", "system": 2, "solution": solution, "iterations": iterations})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5007, debug=True)
