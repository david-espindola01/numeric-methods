from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

SERVICES = {
    "bisection": "http://bisection:5001/solve",
    "fixed-point": "http://fixed-point:5002/solve",
    "newton-raphson": "http://newton-raphson:5003/solve",
    "secant": "http://secant:5004/solve",
    "jacobi": "http://jacobi:5006/solve",
    "gauss-seidel": "http://gauss-seidel:5007/solve"
}

@app.route('/solve/<method>', methods=['POST'])
def solve(method):
    if method not in SERVICES:
        return jsonify({"error": "Método no encontrado"}), 404

    try:
        response = requests.post(SERVICES[method], json=request.get_json())
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Fallo en la comunicación con {method}: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "service": "runner"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
