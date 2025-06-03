from flask import Flask, jsonify, request
import math
import numpy as np
from sympy import symbols, sympify, lambdify
from flask_cors import CORS
import traceback
import sys

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def euler_solve():
    try:
        if not request.is_json:
            return jsonify({
                "error": "El contenido debe ser JSON válido",
                "message": "Asegúrate de enviar el Content-Type: application/json"
            }), 400
        
        data = request.get_json()
        
        if data is None:
            return jsonify({
                "error": "No se recibieron datos",
                "message": "El cuerpo de la petición está vacío o no es JSON válido"
            }), 400
        
        required_fields = ['function', 'x0', 'y0', 'h', 'x_final']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "error": "Faltan campos obligatorios",
                "message": f"Los siguientes campos son requeridos: {', '.join(missing_fields)}",
                "required_fields": required_fields,
                "received_fields": list(data.keys()) if isinstance(data, dict) else []
            }), 400
        
        f_function_str = data['function']
        if not f_function_str or not isinstance(f_function_str, str) or f_function_str.strip() == '':
            return jsonify({
                "error": "Función inválida",
                "message": "La función no puede estar vacía y debe ser una cadena de texto válida"
            }), 400
        
        try:
            x0 = float(data['x0'])
        except (ValueError, TypeError):
            return jsonify({
                "error": "Valor inicial x0 inválido",
                "message": "x0 debe ser un número válido"
            }), 400
        
        try:
            y0 = float(data['y0'])
        except (ValueError, TypeError):
            return jsonify({
                "error": "Valor inicial y0 inválido",
                "message": "y0 debe ser un número válido"
            }), 400
        
        try:
            h = float(data['h'])
        except (ValueError, TypeError):
            return jsonify({
                "error": "Tamaño de paso h inválido",
                "message": "h debe ser un número válido"
            }), 400
        
        try:
            x_final = float(data['x_final'])
        except (ValueError, TypeError):
            return jsonify({
                "error": "Valor final x_final inválido",
                "message": "x_final debe ser un número válido"
            }), 400
        
        if h <= 0:
            return jsonify({
                "error": "Tamaño de paso inválido",
                "message": "El tamaño de paso (h) debe ser mayor que 0"
            }), 400
        
        n_iterations = int((x_final - x0) / h)
        if n_iterations > 100000:
            return jsonify({
                "error": "Demasiadas iteraciones",
                "message": f"El cálculo requiere {n_iterations} iteraciones. Usa un tamaño de paso mayor para reducir el cómputo"
            }), 400
        
        if not all(math.isfinite(val) for val in [x0, y0, h, x_final]):
            return jsonify({
                "error": "Valores numéricos inválidos",
                "message": "Los valores no pueden ser infinitos o NaN"
            }), 400
        
        try:
            f = parse_function(f_function_str)
        except ValueError as ve:
            return jsonify({
                "error": "Error al interpretar la función",
                "message": str(ve),
                "suggestion": "Verifica la sintaxis de tu función. Usa 'x' e 'y' como variables y operadores como +, -, *, /, **, sin, cos, exp, log"
            }), 400
        except Exception as e:
            return jsonify({
                "error": "Error inesperado al procesar la función",
                "message": f"No se pudo interpretar la función: {str(e)}"
            }), 400
        
        try:
            result = metodo_euler(f, f_function_str, x0, y0, h, x_final)
            return jsonify(result)
        
        except OverflowError:
            return jsonify({
                "error": "Desbordamiento numérico",
                "message": "Los valores calculados son demasiado grandes. Intenta con un tamaño de paso menor o revisa tu función"
            }), 400
        
        except ZeroDivisionError:
            return jsonify({
                "error": "División por cero",
                "message": "Se encontró una división por cero durante el cálculo. Revisa tu función y condiciones iniciales"
            }), 400
        
        except Exception as e:
            return jsonify({
                "error": "Error durante el cálculo",
                "message": f"Error en el método de Euler: {str(e)}"
            }), 500
    
    except Exception as e:
        return jsonify({
            "error": "Error interno del servidor",
            "message": "Ocurrió un error inesperado. Por favor, verifica tus datos e intenta nuevamente",
            "details": str(e) if app.debug else "Contacta al administrador si el problema persiste"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        return jsonify({"status": "ok", "method": "euler-method"})
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "El servicio no está funcionando correctamente"
        }), 500

def parse_function(function_str):
    try:
        x, y = symbols('x y')
        function_str = function_str.strip()
        expr = sympify(function_str)
        if expr.free_symbols - {x, y}:
            unknown_vars = expr.free_symbols - {x, y}
            raise ValueError(f"Variables no reconocidas en la función: {', '.join(str(v) for v in unknown_vars)}. Solo se permiten 'x' e 'y'")
        f = lambdify((x, y), expr, modules=['numpy', 'math'])
        try:
            test_result = f(1.0, 1.0)
            if not isinstance(test_result, (int, float, np.number)) or not math.isfinite(test_result):
                raise ValueError("La función no produce valores numéricos válidos")
        except Exception as test_e:
            raise ValueError(f"La función no se puede evaluar correctamente: {str(test_e)}")
        return f
        
    except Exception as e:
        if "Variables no reconocidas" in str(e):
            raise ValueError(str(e))
        elif "La función no" in str(e):
            raise ValueError(str(e))
        else:
            raise ValueError(f"Sintaxis de función inválida: {str(e)}. Ejemplo válido: 'x + y' o 'x**2 - y'")

def metodo_euler(f, f_function_str, x0, y0, h, x_final):
    try:
        n = int((x_final - x0) / h)
        
        x_vals = [x0]
        y_vals = [y0]
        slopes = []
        
        x_current = x0
        y_current = y0
        
        for i in range(n):
            try:
                slope = f(x_current, y_current)
                if not isinstance(slope, (int, float, np.number)):
                    raise ValueError(f"La función devolvió un tipo de dato inválido: {type(slope)}")
                if not math.isfinite(slope):
                    raise ValueError(f"La función devolvió un valor no finito en x={x_current}, y={y_current}")
                slopes.append(slope)
                y_next = y_current + h * slope
                x_next = x_current + h
                if not math.isfinite(y_next):
                    raise ValueError(f"El valor de y se volvió no finito en la iteración {i+1}")
                x_vals.append(x_next)
                y_vals.append(y_next)
                x_current = x_next
                y_current = y_next
                
            except Exception as iter_e:
                raise Exception(f"Error en la iteración {i+1}: {str(iter_e)}")
        
        iterations_detail = []
        for i in range(len(x_vals) - 1):
            iterations_detail.append({
                "step": i,
                "x": round(x_vals[i], 6),
                "y": round(y_vals[i], 6),
                "slope": round(slopes[i], 6),
                "y_next": round(y_vals[i + 1], 6)
            })
        
        iterations_detail.append({
            "step": len(x_vals) - 1,
            "x": round(x_vals[-1], 6),
            "y": round(y_vals[-1], 6),
            "slope": None,
            "y_next": None
        })
        
        return {
            "method": "Método de Euler",
            "function": f_function_str,
            "initial_condition": {"x0": x0, "y0": y0},
            "step_size": h,
            "final_x": x_final,
            "iterations": n,
            "solution": {"x_values": x_vals, "y_values": y_vals},
            "iterations_detail": iterations_detail,
            "final_value": {"x": x_vals[-1], "y": y_vals[-1]}
        }
    
    except Exception as e:
        raise Exception(str(e))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5008, debug=True)
