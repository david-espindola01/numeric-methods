from flask import Flask, jsonify, request
import math
import numpy as np
from sympy import symbols, sympify, lambdify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def fixed_point_solve():
    try:
        if not request.is_json:
            return jsonify({
                "error": "El contenido debe ser válido. Asegúrate de incluir la información completa"
            }), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                "error": "Envía los parámetros requeridos."
            }), 400
        
        if not all(k in data for k in ['function', 'x0']):
            missing_fields = [k for k in ['function', 'x0'] if k not in data]
            return jsonify({
                "error": f"Faltan los siguientes campos requeridos: {', '.join(missing_fields)}. Ejemplo: {{\"function\": \"x**2 - 2\", \"x0\": 1.5}}"
            }), 400
        
        if not isinstance(data['function'], str):
            return jsonify({
                "error": "La función no tiene formato correcto"
            }), 400
        
        if not data['function'].strip():
            return jsonify({
                "error": "La función no puede estar vacía. Proporciona una función matemática válida."
            }), 400
        
        g_function_str = data['function'].strip()
        
        try:
            x0 = float(data['x0'])
            if not math.isfinite(x0):
                return jsonify({
                    "error": "El valor inicial 'x0' debe ser un número finito."
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "error": f"El valor inicial 'x0' debe ser un número válido. Recibido: {data['x0']}"
            }), 400
        
        try:
            tolerancia = float(data.get('tolerance', 1e-6))
            if tolerancia <= 0:
                return jsonify({
                    "error": "La tolerancia debe ser un número positivo mayor que cero."
                }), 400
            if not math.isfinite(tolerancia):
                return jsonify({
                    "error": "La tolerancia debe ser un número finito."
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "error": f"La tolerancia debe ser un número válido. Recibido: {data.get('tolerance')}"
            }), 400
        
        try:
            max_iteraciones = int(data.get('max_iterations', 100))
            if max_iteraciones <= 0:
                return jsonify({
                    "error": "El número máximo de iteraciones debe ser un entero positivo."
                }), 400
            if max_iteraciones > 10000:
                return jsonify({
                    "error": "El número máximo de iteraciones no puede exceder 10,000 para evitar sobrecarga del servidor."
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "error": f"El número máximo de iteraciones debe ser un entero válido. Recibido: {data.get('max_iterations')}"
            }), 400
        
        try:
            g = parse_function(g_function_str)
        except ValueError as e:
            return jsonify({
                "error": f"Error en la función matemática: {str(e)}. Verifica la sintaxis. Ejemplo válido: 'x**2 - 2' o 'cos(x)'"
            }), 400
        except Exception as e:
            return jsonify({
                "error": f"Error inesperado al interpretar la función: {str(e)}. Contacta al administrador si el problema persiste."
            }), 500
        
        try:
            test_result = g(x0)
            if not math.isfinite(test_result):
                return jsonify({
                    "error": f"La función produce un resultado no finito en x0={x0}. Prueba con un valor inicial diferente."
                }), 400
        except Exception as e:
            return jsonify({
                "error": f"No se puede evaluar la función en x0={x0}: {str(e)}. Verifica que la función y el valor inicial sean compatibles."
            }), 400
        
        try:
            result = puntoFijo(g, g_function_str, x0, tolerancia, max_iteraciones)
            return jsonify(result)
        except Exception as e:
            return jsonify({
                "error": f"Error durante la ejecución del algoritmo: {str(e)}."
            }), 500
    
    except Exception as e:
        return jsonify({
            "error": f"Error interno del servidor: {str(e)}. Contacta al administrador si el problema persiste."
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        return jsonify({"status": "ok", "method": "fixed-point"})
    except Exception as e:
        return jsonify({
            "error": f"Error en el chequeo de salud: {str(e)}"
        }), 500

def parse_function(function_str):
    x = symbols('x')
    try:
        dangerous_chars = ['__', 'import', 'exec', 'eval', 'open', 'file']
        for char in dangerous_chars:
            if char in function_str.lower():
                raise ValueError(f"Función contiene elementos no permitidos: '{char}'")
        
        expr = sympify(function_str)
        func = lambdify(x, expr, modules=['numpy', 'math'])
        
        if not callable(func):
            raise ValueError("La función generada no es ejecutable")
        
        return func
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la función '{function_str}': {str(e)}")

def puntoFijo(g, g_function_str, x0, tolerancia, max_iteraciones):
    x1 = x0
    iteraciones = []

    for i in range(max_iteraciones):
        try:
            x1 = g(x0)
            
            if not math.isfinite(x1):
                return {
                    "function": g_function_str,
                    "error": f"La función produjo un valor no finito en la iteración {i+1}. El método no puede continuar.",
                    "iterations_detail": iteraciones
                }
            
            error = abs(x1 - x0)
            
            if not math.isfinite(error):
                return {
                    "function": g_function_str,
                    "error": f"El error calculado no es finito en la iteración {i+1}. El método no puede continuar.",
                    "iterations_detail": iteraciones
                }
            
            iteraciones.append({
                "iteration": i + 1,
                "x": round(float(x1), 10),
                "error": round(error, 10)
            })

            if error < tolerancia:
                return {
                    "function": g_function_str,
                    "root": float(x1),
                    "iterations": i + 1,
                    "error": error,
                    "converged": True,
                    "message": f"Método convergió exitosamente después de {i+1} iteraciones",
                    "iterations_detail": iteraciones
                }

            x0 = x1
            
        except OverflowError:
            return {
                "function": g_function_str,
                "error": f"Desbordamiento numérico en la iteración {i+1}. Los valores son demasiado grandes para continuar.",
                "converged": False,
                "iterations_detail": iteraciones
            }
        except ZeroDivisionError:
            return {
                "function": g_function_str,
                "error": f"División por cero en la iteración {i+1}. Verifica la función o cambia el valor inicial.",
                "converged": False,
                "iterations_detail": iteraciones
            }
        except Exception as e:
            return {
                "function": g_function_str,
                "error": f"Error en la iteración {i+1}: {str(e)}. El método no puede continuar.",
                "converged": False,
                "iterations_detail": iteraciones
            }

    return {
        "function": g_function_str,
        "error": f"El método no convergió después de {max_iteraciones} iteraciones. Prueba aumentando el número máximo de iteraciones o cambiando el valor inicial.",
        "converged": False,
        "iterations_detail": iteraciones
    }


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
