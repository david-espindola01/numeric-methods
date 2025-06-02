from flask import Flask, jsonify, request
import math
import numpy as np
from sympy import symbols, sympify, lambdify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def bisection_solve():
    data = request.get_json()

    required_keys = ['function', 'xi', 'xu', 'tolerance', 'max_iterations']
    if not all(k in data for k in required_keys):
        return jsonify({
            "error": "Datos incompletos. Se requiere: function, xi, xu, tolerance, max_iterations"
        }), 400

    function_str = data['function']
    xi = float(data['xi'])
    xu = float(data['xu'])
    tolerancia = float(data['tolerance'])
    max_iteraciones = int(data['max_iterations'])

    try:
        f = parse_function(function_str)

        if f(xi) * f(xu) >= 0:
            xi, xu = find_valid_interval(f, xi, xu)

        result = biseccion(f, function_str, xi, xu, tolerancia, max_iteraciones)
        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": f"Error al procesar la función: {str(e)}"
        }), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "method": "bisection"})

def parse_function(function_str):
    x = symbols('x')
    try:
        expr = sympify(function_str)
        return lambdify(x, expr, modules=['numpy', 'math'])
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la función: {str(e)}")

def find_valid_interval(f, xi, xu, step=0.5, max_attempts=20):
    for _ in range(max_attempts):
        if f(xi) * f(xu) < 0:
            return xi, xu
        xi -= step
        xu += step
    raise ValueError("No se encontró un intervalo adecuado con cambio de signo")

def biseccion(f, function_str, xi, xu, tolerancia, max_iteraciones):
    iteraciones = []

    for i in range(max_iteraciones):
        xr = (xi + xu) / 2
        fxr = f(xr)
        error = abs(xu - xi) / 2

        iteraciones.append({
            "xi": xi,
            "xu": xu,
            "xr": xr,
            "f(xr)": fxr,
            "error": error
        })

        if abs(fxr) < tolerancia or error < tolerancia:
            return {
                "function": function_str,
                "root": xr,
                "iterations": i + 1,
                "error": error,
                "iterations_detail": iteraciones
            }

        if fxr * f(xi) > 0:
            xi = xr
        else:
            xu = xr

    return {
        "function": function_str,
        "error": "El método diverge después de las iteraciones máximas",
        "iterations_detail": iteraciones
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
