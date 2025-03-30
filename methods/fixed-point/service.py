from flask import Flask, jsonify, request
import math
import numpy as np
from sympy import symbols, sympify, lambdify

app = Flask(__name__)

@app.route('/solve', methods=['POST'])
def fixed_point_solve():
    data = request.get_json()
    
    # Verificar que los datos necesarios estén presentes
    if not all(k in data for k in ['function', 'x0']):
        return jsonify({
            "error": "Datos incompletos. Se requiere: function, x0"
        }), 400
    
    # Obtener parámetros
    g_function_str = data['function']
    x0 = float(data['x0'])
    tolerancia = float(data.get('tolerance', 1e-6))
    max_iteraciones = int(data.get('max_iterations', 100))
    
    try:
        # Crear función evaluable a partir del string
        g = parse_function(g_function_str)
        
        result = puntoFijo(g, g_function_str, x0, tolerancia, max_iteraciones)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "error": f"Error al procesar la función: {str(e)}"
        }), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "method": "fixed-point"})

def parse_function(function_str):
    """Convierte un string de función a una función evaluable"""
    x = symbols('x')
    try:
        expr = sympify(function_str)
        return lambdify(x, expr, modules=['numpy', 'math'])
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la función: {str(e)}")

def puntoFijo(g, g_function_str, x0, tolerancia, max_iteraciones):
    x1 = x0
    for i in range(max_iteraciones):
        try:
            x1 = g(x0)
            error = abs(x1 - x0)
            
            if error < tolerancia:
                return {
                    "function": g_function_str,
                    "root": x1,
                    "iterations": i+1,
                    "error": error
                }
            
            x0 = x1
        except Exception as e:
            return {
                "function": g_function_str,
                "error": f"Error en la iteración {i+1}: {str(e)}"
            }
    
    return {
        "function": g_function_str,
        "error": "El método diverge después de las iteraciones máximas"
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)