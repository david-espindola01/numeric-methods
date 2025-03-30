from flask import Flask, jsonify, request
import numpy as np
from sympy import symbols, sympify, lambdify

app = Flask(__name__)

@app.route('/solve', methods=['POST'])
def secant_solve():
    data = request.get_json()
    
    # Verificar que los datos necesarios estén presentes
    if not all(k in data for k in ['function', 'x0', 'x1']):
        return jsonify({
            "error": "Datos incompletos. Se requiere: function, x0, x1"
        }), 400

    # Obtener parámetros
    function_str = data['function']
    x0 = float(data['x0'])
    x1 = float(data['x1'])
    tolerancia = float(data.get('tolerance', 1e-6))
    max_iteraciones = int(data.get('max_iterations', 100))
    
    try:
        # Convertir función de string a evaluable
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
    """Convierte un string de función a una función evaluable"""
    x = symbols('x')
    try:
        expr = sympify(function_str)
        return lambdify(x, expr, modules=['numpy', 'math'])
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la función: {str(e)}")

def secant_method(f, function_str, x0, x1, tolerancia, max_iteraciones):
    for i in range(max_iteraciones):
        try:
            f_x0 = f(x0)
            f_x1 = f(x1)

            if f_x1 - f_x0 == 0:
                return {
                    "function": function_str,
                    "error": "División por cero en la iteración " + str(i+1)
                }

            x2 = x1 - f_x1 * (x1 - x0) / (f_x1 - f_x0)
            error = abs((x2 - x1) / x2) if x2 != 0 else 0

            if error < tolerancia:
                return {
                    "function": function_str,
                    "root": x2,
                    "iterations": i+1,
                    "error": error
                }
            
            x0, x1 = x1, x2  
        except Exception as e:
            return {
                "function": function_str,
                "error": f"Error en la iteración {i+1}: {str(e)}"
            }
    
    return {
        "function": function_str,
        "error": "El método no convergió en las iteraciones máximas"
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004, debug=True)
