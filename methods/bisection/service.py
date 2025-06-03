from flask import Flask, jsonify, request
import math
import numpy as np
from sympy import symbols, sympify, lambdify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def bisection_solve():
    try:
        if not request.is_json:
            return jsonify({
                "error": "Los datos enviados no están en el formato correcto. Asegúrate de enviar la información como se indica en los ejemplos."
            }), 400

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No se enviaron datos. Por favor, incluye la función matemática, los límites del intervalo, la precisión y el número máximo de intentos."
            }), 400

        required_info = ['function', 'xi', 'xu', 'tolerance', 'max_iterations']
        missing_info = []
        
        for key in required_info:
            if key not in data:
                if key == 'function':
                    missing_info.append("la función matemática")
                elif key == 'xi':
                    missing_info.append("el límite inferior del intervalo")
                elif key == 'xu':
                    missing_info.append("el límite superior del intervalo")
                elif key == 'tolerance':
                    missing_info.append("la precisión deseada")
                elif key == 'max_iterations':
                    missing_info.append("el número máximo de intentos")

        if missing_info:
            return jsonify({
                "error": f"Falta información requerida: {', '.join(missing_info)}. Ejemplo: función: \"x**2 - 4\", límite inferior: 0, límite superior: 3, precisión: 0.001, intentos máximos: 100"
            }), 400

        if not isinstance(data['function'], str):
            return jsonify({
                "error": "La función matemática debe ser texto. Ejemplo: \"x**2 - 4\" o \"sin(x) - 0.5\""
            }), 400

        if not data['function'].strip():
            return jsonify({
                "error": "La función matemática no puede estar vacía. Ingresa una función como \"x**2 - 4\" o \"sin(x) - 0.5\""
            }), 400

        function_str = data['function'].strip()

        try:
            xi = float(data['xi'])
            if not math.isfinite(xi):
                return jsonify({
                    "error": "El límite inferior del intervalo debe ser un número válido (no puede ser infinito)."
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "error": f"El límite inferior del intervalo debe ser un número. Por ejemplo: -2, 0, o 1.5. Recibido: {data['xi']}"
            }), 400

        try:
            xu = float(data['xu'])
            if not math.isfinite(xu):
                return jsonify({
                    "error": "El límite superior del intervalo debe ser un número válido (no puede ser infinito)."
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "error": f"El límite superior del intervalo debe ser un número. Por ejemplo: 2, 5, o 3.7. Recibido: {data['xu']}"
            }), 400

        if xi >= xu:
            return jsonify({
                "error": f"El límite inferior ({xi}) debe ser menor que el límite superior ({xu}). Ejemplo: límite inferior: 0, límite superior: 3"
            }), 400

        try:
            tolerancia = float(data['tolerance'])
            if tolerancia <= 0:
                return jsonify({
                    "error": "La precisión debe ser un número positivo mayor que cero. Ejemplo: 0.001 o 0.0001"
                }), 400
            if not math.isfinite(tolerancia):
                return jsonify({
                    "error": "La precisión debe ser un número válido."
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "error": f"La precisión debe ser un número positivo. Ejemplo: 0.001. Recibido: {data['tolerance']}"
            }), 400

        try:
            max_iteraciones = int(data['max_iterations'])
            if max_iteraciones <= 0:
                return jsonify({
                    "error": "El número máximo de intentos debe ser un número entero positivo. Ejemplo: 100"
                }), 400
            if max_iteraciones > 10000:
                return jsonify({
                    "error": "El número máximo de intentos no puede ser mayor a 10,000 para evitar sobrecargar el sistema."
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "error": f"El número máximo de intentos debe ser un número entero. Ejemplo: 100. Recibido: {data['max_iterations']}"
            }), 400

        try:
            f = parse_function(function_str)
        except ValueError as e:
            return jsonify({
                "error": f"Error en la función matemática: {str(e)}. Verifica que esté escrita correctamente. Ejemplos válidos: 'x**2 - 4', 'sin(x) - 0.5', 'log(x) - 1'"
            }), 400
        except Exception as e:
            return jsonify({
                "error": f"No se pudo procesar la función matemática: {str(e)}. Si el problema continúa, contacta al soporte técnico."
            }), 500

        try:
            f_xi = f(xi)
            if not math.isfinite(f_xi):
                return jsonify({
                    "error": f"La función no se puede calcular correctamente en el límite inferior {xi}. Prueba con un valor diferente."
                }), 400
        except Exception as e:
            return jsonify({
                "error": f"No se puede calcular la función en el límite inferior {xi}: {str(e)}. Verifica que la función y el límite sean compatibles."
            }), 400

        try:
            f_xu = f(xu)
            if not math.isfinite(f_xu):
                return jsonify({
                    "error": f"La función no se puede calcular correctamente en el límite superior {xu}. Prueba con un valor diferente."
                }), 400
        except Exception as e:
            return jsonify({
                "error": f"No se puede calcular la función en el límite superior {xu}: {str(e)}. Verifica que la función y el límite sean compatibles."
            }), 400

        try:
            if f_xi * f_xu >= 0:
                xi, xu = find_valid_interval(f, xi, xu)
        except ValueError as e:
            return jsonify({
                "error": f"No se pudo encontrar un intervalo válido: {str(e)}. El método de bisección necesita que la función cambie de signo en el intervalo. Prueba con límites diferentes."
            }), 400
        except Exception as e:
            return jsonify({
                "error": f"Error al buscar un intervalo válido: {str(e)}. Contacta al soporte técnico si el problema persiste."
            }), 500

        try:
            result = biseccion(f, function_str, xi, xu, tolerancia, max_iteraciones)
            return jsonify(result)
        except Exception as e:
            return jsonify({
                "error": f"Error durante el cálculo: {str(e)}. Si el problema continúa, contacta al soporte técnico."
            }), 500

    except Exception as e:
        return jsonify({
            "error": f"Error interno: {str(e)}. Si el problema continúa, contacta al soporte técnico."
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        return jsonify({"status": "ok", "method": "bisection"})
    except Exception as e:
        return jsonify({
            "error": f"Error en la verificación del sistema: {str(e)}"
        }), 500

def parse_function(function_str):
    x = symbols('x')
    try:
        dangerous_elements = ['__', 'import', 'exec', 'eval', 'open', 'file']
        for element in dangerous_elements:
            if element in function_str.lower():
                raise ValueError(f"La función contiene elementos no permitidos para seguridad")

        expr = sympify(function_str)
        func = lambdify(x, expr, modules=['numpy', 'math'])

        if not callable(func):
            raise ValueError("No se pudo crear una función matemática válida")

        return func
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la función '{function_str}': {str(e)}")

def find_valid_interval(f, xi, xu, step=0.5, max_attempts=20):
    original_xi, original_xu = xi, xu
    
    try:
        for attempt in range(max_attempts):
            try:
                f_xi = f(xi)
                f_xu = f(xu)
                
                if not (math.isfinite(f_xi) and math.isfinite(f_xu)):
                    raise ValueError("La función produce valores no válidos en el intervalo")
                
                if f_xi * f_xu < 0:
                    return xi, xu
                    
                xi -= step
                xu += step
                
            except Exception as e:
                raise ValueError(f"Error al evaluar la función en el intento {attempt + 1}: {str(e)}")
        
        raise ValueError(f"No se encontró un intervalo válido después de {max_attempts} intentos expandiendo desde [{original_xi}, {original_xu}]")
        
    except Exception as e:
        raise ValueError(f"Error durante la búsqueda de intervalo: {str(e)}")

def biseccion(f, function_str, xi, xu, tolerancia, max_iteraciones):
    iteraciones = []

    for i in range(max_iteraciones):
        try:
            xr = (xi + xu) / 2
            
            if not math.isfinite(xr):
                return {
                    "function": function_str,
                    "error": f"El punto medio calculado no es válido en el paso {i+1}. El cálculo no puede continuar.",
                    "converged": False,
                    "iterations_detail": iteraciones
                }
            
            try:
                fxr = f(xr)
                if not math.isfinite(fxr):
                    return {
                        "function": function_str,
                        "error": f"La función no se puede calcular correctamente en x = {xr} (paso {i+1}). Prueba con un intervalo diferente.",
                        "converged": False,
                        "iterations_detail": iteraciones
                    }
            except Exception as e:
                return {
                    "function": function_str,
                    "error": f"Error al calcular la función en el paso {i+1}: {str(e)}. El método no puede continuar.",
                    "converged": False,
                    "iterations_detail": iteraciones
                }
            
            error = abs(xu - xi) / 2
            
            if not math.isfinite(error):
                return {
                    "function": function_str,
                    "error": f"No se pudo calcular el error en el paso {i+1}. El método no puede continuar.",
                    "converged": False,
                    "iterations_detail": iteraciones
                }

            iteraciones.append({
                "step": i + 1,
                "xi": round(float(xi), 10),
                "xu": round(float(xu), 10),
                "xr": round(float(xr), 10),
                "f(xr)": round(float(fxr), 10),
                "error": round(float(error), 10)
            })

            if abs(fxr) < tolerancia or error < tolerancia:
                return {
                    "function": function_str,
                    "root": float(xr),
                    "iterations": i + 1,
                    "error": float(error),
                    "converged": True,
                    "message": f"¡Solución encontrada! El método convergió exitosamente en {i+1} pasos",
                    "iterations_detail": iteraciones
                }

            try:
                f_xi = f(xi)
                if not math.isfinite(f_xi):
                    return {
                        "function": function_str,
                        "error": f"La función no se puede calcular en el límite inferior en el paso {i+1}.",
                        "converged": False,
                        "iterations_detail": iteraciones
                    }
                
                if fxr * f_xi > 0:
                    xi = xr
                else:
                    xu = xr
                    
            except Exception as e:
                return {
                    "function": function_str,
                    "error": f"Error al actualizar el intervalo en el paso {i+1}: {str(e)}",
                    "converged": False,
                    "iterations_detail": iteraciones
                }

        except OverflowError:
            return {
                "function": function_str,
                "error": f"Los números se volvieron demasiado grandes en el paso {i+1}. Prueba con un intervalo más pequeño.",
                "converged": False,
                "iterations_detail": iteraciones
            }
        except ZeroDivisionError:
            return {
                "function": function_str,
                "error": f"Se intentó dividir por cero en el paso {i+1}. Verifica tu función.",
                "converged": False,
                "iterations_detail": iteraciones
            }
        except Exception as e:
            return {
                "function": function_str,
                "error": f"Error inesperado en el paso {i+1}: {str(e)}. El cálculo no puede continuar.",
                "converged": False,
                "iterations_detail": iteraciones
            }

    return {
        "function": function_str,
        "error": f"El método no encontró una solución después de {max_iteraciones} intentos. Prueba aumentando el número de intentos máximos o ajustando la precisión.",
        "converged": False,
        "iterations_detail": iteraciones
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
