from flask import Flask, jsonify, request
import math
import numpy as np
from sympy import symbols, sympify, lambdify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def simpson_solve():
    data = request.get_json()
    
    if not all(k in data for k in ['function', 'a', 'b', 'n']):
        return jsonify({
            "error": "Datos incompletos. Se requiere: function, a, b, n"
        }), 400
    
    f_function_str = data['function']
    a = float(data['a'])
    b = float(data['b'])
    n = int(data['n'])
    
    if n <= 0 or n % 2 != 0:
        return jsonify({
            "error": "El número de subintervalos (n) debe ser par y mayor que 0"
        }), 400
    
    try:
        f = parse_function(f_function_str)
        
        result = regla_simpson(f, f_function_str, a, b, n)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "error": f"Error al procesar la función: {str(e)}"
        }), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "method": "simpson-rule"})

def parse_function(function_str):
    x = symbols('x')
    try:
        expr = sympify(function_str)
        return lambdify(x, expr, modules=['numpy', 'math'])
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la función: {str(e)}")

def regla_simpson(f, f_function_str, a, b, n):
    try:
        h = (b - a) / n
        
        suma = f(a) + f(b)
        
        for i in range(1, n, 2):
            x_i = a + i * h
            suma += 4 * f(x_i)
        
        for i in range(2, n, 2):
            x_i = a + i * h
            suma += 2 * f(x_i)
        
        integral = (h / 3) * suma
        
        return {
            "function": f_function_str,
            "interval": [a, b],
            "subintervals": n,
            "step_size": h,
            "integral": integral,
            "method": "Regla de Simpson 1/3"
        }
    
    except Exception as e:
        return {
            "function": f_function_str,
            "error": f"Error en el cálculo: {str(e)}"
        }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5009, debug=True)
