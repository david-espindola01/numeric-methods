from flask import Flask, jsonify, request
import math
import numpy as np
from sympy import symbols, sympify, lambdify

app = Flask(__name__)

@app.route('/solve', methods=['POST'])
def bisection_solve():
    data = request.get_json()
    
    # Verificar que los datos necesarios estén presentes
    if not all(k in data for k in ['function', 'xi', 'xu']):
        return jsonify({
            "error": "Datos incompletos. Se requiere: function, xi, xu"
        }), 400
    
    # Obtener parámetros
    function_str = data['function']
    xi = float(data['xi'])
    xu = float(data['xu'])
    tolerancia = float(data.get('tolerance', 1e-6))
    max_iteraciones = int(data.get('max_iterations', 100))
    
    try:
        # Crear función evaluable a partir del string
        f = parse_function(function_str)
        
        # Validar el intervalo
        if f(xi) * f(xu) >= 0:
            return jsonify({
                "error": "La función debe tener signos opuestos en los extremos del intervalo"
            }), 400
        
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
    """Convierte un string de función a una función evaluable"""
    x = symbols('x')
    try:
        expr = sympify(function_str)
        return lambdify(x, expr, modules=['numpy', 'math'])
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la función: {str(e)}")

def biseccion(f, function_str, xi, xu, tolerancia, max_iteraciones):
    for i in range(max_iteraciones):
        xr = (xi + xu) / 2
        if abs(f(xr)) < tolerancia or (xu - xi) / 2 < tolerancia:
            return {
                "function": function_str,
                "root": xr,
                "iterations": i+1,
                "error": (xu - xi) / 2
            }
        if f(xr) * f(xi) > 0:
            xi = xr
        else:
            xu = xr
    
    return {
        "function": function_str,
        "error": "El método diverge después de las iteraciones máximas"
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)