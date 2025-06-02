from flask import Flask, jsonify, request
import numpy as np
from sympy import symbols, sympify, lambdify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def secant_solve():
    data = request.get_json()
    
    if not all(k in data for k in ['function', 'x0', 'x1']):
        return jsonify({
            "error": "Datos incompletos. Se requiere: function, x0, x1"
        }), 400

    function_str = data['function']
    x0 = float(data['x0'])
    x1 = float(data['x1'])
    tolerancia = float(data.get('tolerance', 1e-6))
    max_iteraciones = int(data.get('max_iterations', 100))
    
    try:
        f = parse_function(function_str)
        
        result = secant_method(f, function_str, x0, x1, tolerancia, max_iteraciones)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "error": f"Error al procesar la función: {str(e)}"
        }), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "method": "secant"})

def parse_function(function_str):
    x = symbols('x')
    try:
        expr = sympify(function_str)
        return lambdify(x, expr, modules=['numpy', 'math'])
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la función: {str(e)}")

def secant_method(f, function_str, x0, x1, tolerancia, max_iteraciones):
    detalles = []

    for i in range(max_iteraciones):
        try:
            f_x0 = f(x0)
            f_x1 = f(x1)

            if f_x1 - f_x0 == 0:
                return {
                    "function": function_str,
                    "iterations_detail": detalles,
                    "error": "División por cero en la iteración " + str(i+1)
                }

            x2 = x1 - f_x1 * (x1 - x0) / (f_x1 - f_x0)
            error = abs((x2 - x1) / x2) if x2 != 0 else 0

            detalles.append({
                "iteration": i + 1,
                "x0": x0,
                "x1": x1,
                "fx0": f_x0,
                "fx1": f_x1,
                "x2": x2,
                "error": error
            })

            if error < tolerancia:
                return {
                    "function": function_str,
                    "root": x2,
                    "iterations": i + 1,
                    "error": error,
                    "iterations_detail": detalles
                }

            x0, x1 = x1, x2
        except Exception as e:
            return {
                "function": function_str,
                "iterations_detail": detalles,
                "error": f"Error en la iteración {i+1}: {str(e)}"
            }

    return {
        "function": function_str,
        "iterations_detail": detalles,
        "error": "El método no convergió en las iteraciones máximas"
    }


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004, debug=True)
