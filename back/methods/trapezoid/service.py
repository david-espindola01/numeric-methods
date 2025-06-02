from flask import Flask, jsonify, request
import math
import numpy as np
from sympy import symbols, sympify, lambdify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def trapezoid_solve():
    data = request.get_json()
    
    if not all(k in data for k in ['function', 'a', 'b', 'n']):
        return jsonify({
            "error": "Datos incompletos. Se requiere: function, a, b, n"
        }), 400
    
    f_function_str = data['function']
    a = float(data['a'])
    b = float(data['b'])
    n = int(data['n'])
    
    if n <= 0:
        return jsonify({
            "error": "El número de subintervalos (n) debe ser mayor que 0"
        }), 400
    
    try:
        f = parse_function(f_function_str)
        
        result = regla_trapecio(f, f_function_str, a, b, n)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "error": f"Error al procesar la función: {str(e)}"
        }), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "method": "trapezoid-rule"})

def parse_function(function_str):
    x = symbols('x')
    try:
        expr = sympify(function_str)
        return lambdify(x, expr, modules=['numpy', 'math'])
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la función: {str(e)}")

def regla_trapecio(f, f_function_str, a, b, n):
    try:
        h = (b - a) / n
        
        suma = f(a) + f(b)
        
        for i in range(1, n):
            x_i = a + i * h
            suma += 2 * f(x_i)
        
        integral = (h / 2) * suma
        
        return {
            "function": f_function_str,
            "interval": [a, b],
            "subintervals": n,
            "step_size": h,
            "integral": integral,
            "method": "Regla del Trapecio"
        }
    
    except Exception as e:
        return {
            "function": f_function_str,
            "error": f"Error en el cálculo: {str(e)}"
        }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5010, debug=True)
