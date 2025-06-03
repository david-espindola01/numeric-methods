from flask import Flask, jsonify, request
import numpy as np
from sympy import symbols, sympify, lambdify, diff, Symbol, SympifyError
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def newton_raphson_solve():
    if not request.is_json:
        return jsonify({"error": "El contenido debe ser JSON válido"}), 400
    
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "JSON malformado o inválido"}), 400

    if not data:
        return jsonify({"error": "No se recibieron datos"}), 400

    if not all(k in data for k in ['function', 'x0']):
        missing_fields = [field for field in ['function', 'x0'] if field not in data]
        return jsonify({
            "error": f"Faltan campos requeridos: {', '.join(missing_fields)}. Se necesitan 'function' (función a evaluar) y 'x0' (valor inicial)"
        }), 400

    if not data.get('function') or data.get('function', '').strip() == '':
        return jsonify({"error": "El campo 'function' no puede estar vacío"}), 400

    try:
        x0 = float(data['x0'])
        if not math.isfinite(x0):
            return jsonify({"error": "El valor inicial 'x0' debe ser un número finito (no infinito ni NaN)"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "El valor inicial 'x0' debe ser un número válido"}), 400

    function_str = data['function'].strip()

    if len(function_str) > 1000:
        return jsonify({"error": "La función es demasiado larga. Máximo 1000 caracteres"}), 400

    try:
        tolerancia = float(data.get('tolerance', 1e-6))
        if tolerancia <= 0:
            return jsonify({"error": "La tolerancia debe ser un número positivo"}), 400
        if tolerancia >= 1:
            return jsonify({"error": "La tolerancia debe ser menor que 1 para obtener resultados precisos"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "La tolerancia debe ser un número válido"}), 400

    try:
        max_iteraciones = int(data.get('max_iterations', 100))
        if max_iteraciones <= 0:
            return jsonify({"error": "El número máximo de iteraciones debe ser un entero positivo"}), 400
        if max_iteraciones > 10000:
            return jsonify({"error": "El número máximo de iteraciones no puede exceder 10,000 para evitar sobrecarga del servidor"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "El número máximo de iteraciones debe ser un número entero válido"}), 400
    
    try:
        x = symbols('x')
        try:
            expr = sympify(function_str)
        except SympifyError as e:
            return jsonify({"error": f"La función no es válida matemáticamente: {str(e)}. Asegúrese de usar sintaxis correcta (ej: x**2 + 2*x - 1)"}), 400
        except Exception as e:
            return jsonify({"error": f"Error al interpretar la función: {str(e)}. Use sintaxis matemática estándar"}), 400

        if not expr.has(x):
            return jsonify({"error": "La función debe contener la variable 'x'"}), 400

        free_symbols = expr.free_symbols
        invalid_symbols = free_symbols - {x}
        if invalid_symbols:
            return jsonify({"error": f"La función contiene variables no permitidas: {', '.join(str(s) for s in invalid_symbols)}. Solo se permite la variable 'x'"}), 400

        try:
            derivative_expr = diff(expr, x)
        except Exception as e:
            return jsonify({"error": f"No se pudo calcular la derivada de la función: {str(e)}"}), 400

        if derivative_expr == 0:
            return jsonify({"error": "La derivada de la función es constantemente cero. El método de Newton-Raphson no es aplicable"}), 400

        try:
            f = lambdify(x, expr, modules=['numpy', 'math'])
            f_derivative = lambdify(x, derivative_expr, modules=['numpy', 'math'])
        except Exception as e:
            return jsonify({"error": f"Error al crear las funciones evaluables: {str(e)}"}), 400

        try:
            f_x0_test = f(x0)
            if not math.isfinite(f_x0_test):
                return jsonify({"error": f"La función no está definida en x0 = {x0} (resultado: {f_x0_test})"}), 400
        except Exception as e:
            return jsonify({"error": f"La función no se puede evaluar en x0 = {x0}: {str(e)}"}), 400

        try:
            f_prime_x0_test = f_derivative(x0)
            if not math.isfinite(f_prime_x0_test):
                return jsonify({"error": f"La derivada no está definida en x0 = {x0} (resultado: {f_prime_x0_test})"}), 400
            if abs(f_prime_x0_test) < 1e-15:
                return jsonify({"error": f"La derivada es cero o muy cercana a cero en x0 = {x0}. El método puede no converger"}), 400
        except Exception as e:
            return jsonify({"error": f"La derivada no se puede evaluar en x0 = {x0}: {str(e)}"}), 400

        result = newton_raphson(
            f, f_derivative, 
            function_str, str(derivative_expr), 
            x0, tolerancia, max_iteraciones
        )
        return jsonify(result)
    
    except OverflowError:
        return jsonify({"error": "Los valores son demasiado grandes para procesar. Intente con números más pequeños o una tolerancia mayor"}), 400
    except MemoryError:
        return jsonify({"error": "La función es demasiado compleja para procesar en memoria"}), 400
    except Exception as e:
        return jsonify({"error": f"Error inesperado en el procesamiento: {str(e)}"}), 500

@app.route('/derivative', methods=['POST'])
def calculate_derivative():
    if not request.is_json:
        return jsonify({"error": "El contenido debe ser JSON válido"}), 400
    
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "JSON malformado o inválido"}), 400

    if not data:
        return jsonify({"error": "No se recibieron datos"}), 400
    
    if not all(k in data for k in ['function']):
        return jsonify({
            "error": "Falta el campo requerido 'function' (función a derivar)"
        }), 400

    if not data.get('function') or data.get('function', '').strip() == '':
        return jsonify({"error": "El campo 'function' no puede estar vacío"}), 400

    function_str = data['function'].strip()
    variable = data.get('variable', 'x')

    if len(function_str) > 1000:
        return jsonify({"error": "La función es demasiado larga. Máximo 1000 caracteres"}), 400

    if not isinstance(variable, str) or not variable.strip():
        return jsonify({"error": "La variable debe ser una cadena de texto no vacía"}), 400
    
    variable = variable.strip()
    if len(variable) > 10:
        return jsonify({"error": "El nombre de la variable es demasiado largo. Máximo 10 caracteres"}), 400

    try:
        try:
            var = symbols(variable)
        except Exception as e:
            return jsonify({"error": f"Nombre de variable inválido '{variable}': {str(e)}"}), 400

        try:
            expr = sympify(function_str)
        except SympifyError as e:
            return jsonify({"error": f"La función no es válida matemáticamente: {str(e)}. Asegúrese de usar sintaxis correcta"}), 400
        except Exception as e:
            return jsonify({"error": f"Error al interpretar la función: {str(e)}"}), 400

        if not expr.has(var):
            return jsonify({"error": f"La función debe contener la variable '{variable}'"}), 400

        try:
            derivative = diff(expr, var)
        except Exception as e:
            return jsonify({"error": f"No se pudo calcular la derivada: {str(e)}"}), 400
        
        return jsonify({
            "function": function_str,
            "variable": variable,
            "derivative": str(derivative),
            "derivative_lambda": "Available",
            "message": f"Derivada calculada exitosamente con respecto a '{variable}'"
        })
    
    except OverflowError:
        return jsonify({"error": "La función es demasiado compleja para derivar"}), 400
    except Exception as e:
        return jsonify({"error": f"Error inesperado al calcular la derivada: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        return jsonify({"status": "ok", "method": "newton-raphson"})
    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500

def newton_raphson(f, f_derivative, function_str, derivative_str, x0, tolerancia, max_iteraciones):
    iterations_detail = []
    x_current = x0

    try:
        for i in range(max_iteraciones):
            try:
                f_x = f(x_current)
                f_prime_x = f_derivative(x_current)

                if not math.isfinite(f_x):
                    return {
                        "function": function_str,
                        "derivative": derivative_str,
                        "iterations_detail": iterations_detail,
                        "converged": False,
                        "error": f"La función no está definida en x = {x_current} (iteración {i + 1})"
                    }

                if not math.isfinite(f_prime_x):
                    return {
                        "function": function_str,
                        "derivative": derivative_str,
                        "iterations_detail": iterations_detail,
                        "converged": False,
                        "error": f"La derivada no está definida en x = {x_current} (iteración {i + 1})"
                    }

                if abs(f_prime_x) < 1e-15:
                    return {
                        "function": function_str,
                        "derivative": derivative_str,
                        "iterations_detail": iterations_detail,
                        "converged": False,
                        "error": f"La derivada es cero en x = {x_current} (iteración {i + 1}). No se puede continuar"
                    }

                x_next = x_current - (f_x / f_prime_x)
                
                if not math.isfinite(x_next):
                    return {
                        "function": function_str,
                        "derivative": derivative_str,
                        "iterations_detail": iterations_detail,
                        "converged": False,
                        "error": f"El cálculo resultó en un valor no finito (iteración {i + 1})"
                    }

                error = abs(x_next - x_current)

                iterations_detail.append({
                    "iteration": i + 1,
                    "x": float(x_current),
                    "fx": float(f_x),
                    "fpx": float(f_prime_x),
                    "x_next": float(x_next),
                    "error": float(error)
                })

                if error < tolerancia:
                    return {
                        "function": function_str,
                        "derivative": derivative_str,
                        "root": float(x_next),
                        "iterations": i + 1,
                        "final_error": float(error),
                        "iterations_detail": iterations_detail,
                        "converged": True,
                        "message": f"Raíz encontrada en {i + 1} iteraciones con error {error:.2e}"
                    }

                if i > 0 and error > tolerancia and abs(error - iterations_detail[-2]["error"]) < tolerancia * 0.01:
                    return {
                        "function": function_str,
                        "derivative": derivative_str,
                        "iterations_detail": iterations_detail,
                        "converged": False,
                        "error": f"El método se ha estancado en la iteración {i + 1}. Intente con un valor inicial diferente"
                    }

                x_current = x_next

            except OverflowError:
                return {
                    "function": function_str,
                    "derivative": derivative_str,
                    "iterations_detail": iterations_detail,
                    "converged": False,
                    "error": f"Desbordamiento numérico en la iteración {i + 1}. Los valores son demasiado grandes"
                }
            except Exception as e:
                return {
                    "function": function_str,
                    "derivative": derivative_str,
                    "iterations_detail": iterations_detail,
                    "converged": False,
                    "error": f"Error en la iteración {i + 1}: {str(e)}"
                }

        return {
            "function": function_str,
            "derivative": derivative_str,
            "root": float(x_current),
            "iterations": max_iteraciones,
            "final_error": float(error) if 'error' in locals() else None,
            "iterations_detail": iterations_detail,
            "converged": False,
            "message": f"Se alcanzó el máximo de iteraciones ({max_iteraciones}). La solución puede no haber convergido completamente"
        }

    except Exception as e:
        return {
            "function": function_str,
            "derivative": derivative_str,
            "iterations_detail": iterations_detail,
            "converged": False,
            "error": f"Error inesperado en el algoritmo: {str(e)}"
        }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)
