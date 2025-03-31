from flask import Flask, jsonify, request
import numpy as np
from sympy import symbols, sympify, lambdify, diff, Symbol, SympifyError

app = Flask(__name__)

# =============================================
# Endpoint para resolver con Newton-Raphson (ahora calcula la derivada automáticamente)
# =============================================
@app.route('/solve', methods=['POST'])
def newton_raphson_solve():
    data = request.get_json()
    
    # Verificar datos obligatorios
    if not all(k in data for k in ['function', 'x0']):
        return jsonify({
            "error": "Datos incompletos. Se requiere: function, x0"
        }), 400

    function_str = data['function']
    x0 = float(data['x0'])
    tolerancia = float(data.get('tolerance', 1e-6))
    max_iteraciones = int(data.get('max_iterations', 100))
    
    try:
        # Convertir la función a simbólica y calcular su derivada
        x = symbols('x')
        expr = sympify(function_str)
        derivative_expr = diff(expr, x)  # Derivada automática
        
        # Crear funciones numéricas
        f = lambdify(x, expr, modules=['numpy', 'math'])
        f_derivative = lambdify(x, derivative_expr, modules=['numpy', 'math'])
        
        # Ejecutar Newton-Raphson
        result = newton_raphson(
            f, f_derivative, 
            function_str, str(derivative_expr), 
            x0, tolerancia, max_iteraciones
        )
        return jsonify(result)
    
    except SympifyError as e:
        return jsonify({"error": f"Función no válida: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Error inesperado: {str(e)}"}), 500

# =============================================
# Endpoint para calcular derivadas (nuevo)
# =============================================
@app.route('/derivative', methods=['POST'])
def calculate_derivative():
    data = request.get_json()
    
    if not all(k in data for k in ['function']):
        return jsonify({
            "error": "Datos incompletos. Se requiere: function"
        }), 400

    function_str = data['function']
    variable = data.get('variable', 'x')  # Opcional: variable de derivación (por defecto 'x')
    
    try:
        # Calcular derivada simbólica
        var = symbols(variable)
        expr = sympify(function_str)
        derivative = diff(expr, var)
        
        return jsonify({
            "function": function_str,
            "variable": variable,
            "derivative": str(derivative),
            "derivative_lambda": "Available"  # Puede usarse con lambdify
        })
    
    except SympifyError as e:
        return jsonify({"error": f"Función no válida: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Error inesperado: {str(e)}"}), 500

# =============================================
# Funciones auxiliares
# =============================================
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "method": "newton-raphson"})

def newton_raphson(f, f_derivative, function_str, derivative_str, x0, tolerancia, max_iteraciones):
    for i in range(max_iteraciones):
        try:
            f_x0 = f(x0)
            f_prima_x0 = f_derivative(x0)

            if f_prima_x0 == 0:
                return {
                    "function": function_str,
                    "derivative": derivative_str,
                    "error": "Derivada cero. No se puede continuar."
                }
            
            x1 = x0 - (f_x0 / f_prima_x0)
            error = abs(x1 - x0)
            
            if error < tolerancia:
                return {
                    "function": function_str,
                    "derivative": derivative_str,
                    "root": float(x1),  # Convertir a float para JSON
                    "iterations": i + 1,
                    "error": float(error)
                }
            
            x0 = x1
        except Exception as e:
            return {
                "function": function_str,
                "error": f"Error en iteración {i + 1}: {str(e)}"
            }
    
    return {
        "function": function_str,
        "error": "Máximo de iteraciones alcanzado"
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)