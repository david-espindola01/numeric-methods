from flask import Flask, jsonify, request
import math
import numpy as np
from sympy import symbols, sympify, lambdify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def romberg_solve():
    data = request.get_json()
    
    if not all(k in data for k in ['function', 'a', 'b']):
        return jsonify({
            "error": "Datos incompletos. Se requiere: function, a, b"
        }), 400
    
    f_function_str = data['function']
    a = float(data['a'])
    b = float(data['b'])
    tolerancia = float(data.get('tolerance', 1e-6))
    max_iteraciones = int(data.get('max_iterations', 10))
    
    try:
        f = parse_function(f_function_str)
        
        result = metodo_romberg(f, f_function_str, a, b, tolerancia, max_iteraciones)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "error": f"Error al procesar la función: {str(e)}"
        }), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "method": "romberg-method"})

def parse_function(function_str):
    x = symbols('x')
    try:
        expr = sympify(function_str)
        return lambdify(x, expr, modules=['numpy', 'math'])
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la función: {str(e)}")

def regla_trapecio_compuesta(f, a, b, n):
    h = (b - a) / n
    suma = f(a) + f(b)
    
    for i in range(1, n):
        x_i = a + i * h
        suma += 2 * f(x_i)
    
    return (h / 2) * suma

def metodo_romberg(f, f_function_str, a, b, tolerancia, max_iteraciones):
    try:
        R = np.zeros((max_iteraciones, max_iteraciones))
        
        for i in range(max_iteraciones):
            n = 2**i
            R[i, 0] = regla_trapecio_compuesta(f, a, b, n)
            
            for j in range(1, i + 1):
                R[i, j] = R[i, j-1] + (R[i, j-1] - R[i-1, j-1]) / (4**j - 1)
            
            if i > 0:
                error = abs(R[i, i] - R[i-1, i-1])
                if error < tolerancia:
                    tabla = []
                    for row in range(i + 1):
                        fila = []
                        for col in range(row + 1):
                            fila.append(R[row, col])
                        tabla.append(fila)
                    
                    return {
                        "function": f_function_str,
                        "interval": [a, b],
                        "tolerance": tolerancia,
                        "iterations": i + 1,
                        "integral": R[i, i],
                        "error": error,
                        "romberg_table": tabla,
                        "converged": True,
                        "method": "Método de Romberg"
                    }
        
        tabla = []
        for row in range(max_iteraciones):
            fila = []
            for col in range(row + 1):
                fila.append(R[row, col])
            tabla.append(fila)
        
        return {
            "function": f_function_str,
            "interval": [a, b],
            "tolerance": tolerancia,
            "iterations": max_iteraciones,
            "integral": R[max_iteraciones-1, max_iteraciones-1],
            "romberg_table": tabla,
            "converged": False,
            "warning": "No convergió dentro del número máximo de iteraciones",
            "method": "Método de Romberg"
        }
    
    except Exception as e:
        return {
            "function": f_function_str,
            "error": f"Error en el cálculo: {str(e)}"
        }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5011, debug=True)
