from flask import Flask, jsonify, request
import numpy as np
import math
from sympy import symbols, sympify, lambdify
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def secant_solve():
    try:
        if not request.is_json:
            return jsonify({
                "error": "El contenido debe ser JSON válido",
                "message": "Asegúrate de enviar datos en formato JSON con el header 'Content-Type: application/json'"
            }), 400
        
        data = request.get_json()
        
        if data is None:
            return jsonify({
                "error": "No se recibieron datos",
                "message": "El cuerpo de la petición está vacío o no es JSON válido"
            }), 400
        
        required_fields = ['function', 'x0', 'x1']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "error": "Datos incompletos",
                "message": f"Faltan los siguientes campos obligatorios: {', '.join(missing_fields)}",
                "required_fields": required_fields,
                "received_fields": list(data.keys())
            }), 400
        
        try:
            function_str = str(data['function']).strip()
            if not function_str:
                return jsonify({
                    "error": "Función vacía",
                    "message": "La función matemática no puede estar vacía"
                }), 400
        except Exception:
            return jsonify({
                "error": "Función inválida",
                "message": "La función debe ser una cadena de texto válida"
            }), 400
        
        try:
            x0 = float(data['x0'])
        except (ValueError, TypeError):
            return jsonify({
                "error": "Valor inicial x0 inválido",
                "message": "El valor inicial x0 debe ser un número válido"
            }), 400
        
        try:
            x1 = float(data['x1'])
        except (ValueError, TypeError):
            return jsonify({
                "error": "Valor inicial x1 inválido",
                "message": "El valor inicial x1 debe ser un número válido"
            }), 400
        
        if abs(x0 - x1) < 1e-15:
            return jsonify({
                "error": "Valores iniciales idénticos",
                "message": f"Los valores iniciales x0={x0} y x1={x1} deben ser diferentes para el método de la secante"
            }), 400
        
        try:
            tolerancia = float(data.get('tolerance', 1e-6))
            if tolerancia <= 0:
                return jsonify({
                    "error": "Tolerancia inválida",
                    "message": "La tolerancia debe ser un número positivo mayor que 0"
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "error": "Tolerancia inválida",
                "message": "La tolerancia debe ser un número válido y positivo"
            }), 400
        
        try:
            max_iteraciones = int(data.get('max_iterations', 100))
            if max_iteraciones <= 0:
                return jsonify({
                    "error": "Número de iteraciones inválido",
                    "message": "El número máximo de iteraciones debe ser un entero positivo mayor que 0"
                }), 400
            if max_iteraciones > 1000:
                return jsonify({
                    "error": "Número de iteraciones excesivo",
                    "message": "El número máximo de iteraciones no puede ser mayor que 1000 para evitar problemas de rendimiento"
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "error": "Número de iteraciones inválido",
                "message": "El número máximo de iteraciones debe ser un entero válido"
            }), 400
        
        try:
            f = parse_function(function_str)
        except ValueError as ve:
            return jsonify({
                "error": "Error al interpretar la función",
                "message": str(ve),
                "suggestion": "Verifica que la función use sintaxis de Python válida. Ejemplos: 'x**2 - 4', 'sin(x) - 0.5', 'exp(x) - 2'"
            }), 400
        except Exception as e:
            return jsonify({
                "error": "Error inesperado al interpretar la función",
                "message": f"No se pudo procesar la función matemática: {str(e)}"
            }), 400
        
        try:
            f_x0 = f(x0)
            f_x1 = f(x1)
            
            for val, name in [(f_x0, f'f({x0})'), (f_x1, f'f({x1})')]:
                if val is None:
                    return jsonify({
                        "error": "Función no evaluable",
                        "message": f"La función retorna None en {name}",
                        "suggestion": "Verifica que la función esté bien definida en los puntos iniciales"
                    }), 400
                
                try:
                    val_float = float(val)
                    if math.isnan(val_float) or math.isinf(val_float):
                        return jsonify({
                            "error": "Función no evaluable",
                            "message": f"La función produce valores no válidos en {name}: {val}",
                            "suggestion": "Verifica que la función no tenga divisiones por cero u operaciones inválidas"
                        }), 400
                except (TypeError, ValueError):
                    return jsonify({
                        "error": "Función no evaluable",
                        "message": f"La función no produce valores numéricos en {name}: {val}",
                        "suggestion": "Verifica que la función retorne valores numéricos"
                    }), 400
            
            if abs(f_x1 - f_x0) < 1e-15:
                return jsonify({
                    "error": "Condición inicial problemática",
                    "message": f"Los valores f(x0)={f_x0} y f(x1)={f_x1} son prácticamente iguales, lo que causaría división por cero",
                    "suggestion": "Elige valores iniciales x0 y x1 donde f(x0) y f(x1) sean significativamente diferentes"
                }), 400
                
        except Exception as e:
            return jsonify({
                "error": "Error al evaluar la función",
                "message": f"La función no puede ser evaluada en los puntos iniciales: {str(e)}",
                "suggestion": "Verifica que la función esté bien definida y no tenga operaciones inválidas"
            }), 400
        
        try:
            result = secant_method(f, function_str, x0, x1, tolerancia, max_iteraciones)
            
            if "error" in result and "root" not in result:
                return jsonify({
                    "error": "Error en el cálculo del método de la secante",
                    "message": result["error"],
                    "suggestion": "Intenta con valores iniciales diferentes o verifica que la función tenga raíces en la región de búsqueda"
                }), 500
            
            return jsonify(result)
        
        except Exception as e:
            return jsonify({
                "error": "Error durante el cálculo",
                "message": f"Error inesperado durante la ejecución del método de la secante: {str(e)}",
                "suggestion": "Intenta con parámetros diferentes o contacta al administrador si el problema persiste"
            }), 500
    
    except Exception as e:
        return jsonify({
            "error": "Error interno del servidor",
            "message": f"Error inesperado: {str(e)}",
            "suggestion": "Contacta al administrador del sistema"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        return jsonify({
            "status": "ok", 
            "method": "secant",
            "message": "Servicio funcionando correctamente"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error en el servicio: {str(e)}"
        }), 500

def parse_function(function_str):
    if not isinstance(function_str, str):
        raise ValueError("La función debe ser una cadena de texto")
    
    function_str = function_str.strip()
    if not function_str:
        raise ValueError("La función no puede estar vacía")
    
    forbidden_patterns = [
        r'import\s+',
        r'__.*__',
        r'exec\s*\(',
        r'eval\s*\(',
        r'open\s*\(',
        r'file\s*\(',
    ]
    
    for pattern in forbidden_patterns:
        if re.search(pattern, function_str, re.IGNORECASE):
            raise ValueError("La función contiene elementos no permitidos por seguridad")
    
    x = symbols('x')
    try:
        expr = sympify(function_str)
        if not expr.free_symbols.issubset({x}):
            raise ValueError("La función solo puede contener la variable 'x'")
        
        func = lambdify(x, expr, modules=['numpy', 'math'])
        
        try:
            test_val = func(1.0)
            if test_val is None:
                raise ValueError("La función retorna None")
            float_val = float(test_val)
            if math.isnan(float_val) or math.isinf(float_val):
                raise ValueError(f"La función retorna un valor no válido: {test_val}")
        except Exception as e:
            raise ValueError(f"Error al evaluar la función de prueba: {str(e)}")
        
        return func
        
    except Exception as e:
        if "sympify" in str(e).lower():
            raise ValueError(f"Sintaxis matemática inválida: {str(e)}")
        else:
            raise ValueError(f"No se pudo interpretar la función: {str(e)}")

def secant_method(f, function_str, x0, x1, tolerancia, max_iteraciones):
    try:
        detalles = []

        for i in range(max_iteraciones):
            try:
                f_x0 = f(x0)
                f_x1 = f(x1)
                
                for val, point in [(f_x0, x0), (f_x1, x1)]:
                    try:
                        val_float = float(val)
                        if math.isnan(val_float) or math.isinf(val_float):
                            raise ValueError(f"La función produce valores no válidos en x={point}: {val}")
                    except (TypeError, ValueError) as e:
                        raise ValueError(f"La función produce valores no numéricos en x={point}: {val}")

                denominador = f_x1 - f_x0
                if abs(denominador) < 1e-15:
                    return {
                        "function": function_str,
                        "iterations_detail": detalles,
                        "error": f"División por cero en la iteración {i+1}: f(x0)={f_x0} ≈ f(x1)={f_x1}",
                        "converged": False,
                        "message": "El método falló porque la secante se volvió horizontal",
                        "suggestion": "Intenta con valores iniciales diferentes donde f(x0) y f(x1) sean más diferentes"
                    }

                x2 = x1 - f_x1 * (x1 - x0) / denominador
                
                try:
                    x2_float = float(x2)
                    if math.isnan(x2_float) or math.isinf(x2_float):
                        raise ValueError(f"El cálculo produjo un valor no válido para x2: {x2}")
                    x2 = x2_float
                except (TypeError, ValueError) as e:
                    return {
                        "function": function_str,
                        "iterations_detail": detalles,
                        "error": f"Error en el cálculo de x2 en la iteración {i+1}: {str(e)}",
                        "converged": False
                    }
                
                error = abs((x2 - x1) / x2) if abs(x2) > 1e-15 else abs(x2 - x1)

                detalles.append({
                    "iteration": i + 1,
                    "x0": float(x0),
                    "x1": float(x1),
                    "fx0": float(f_x0),
                    "fx1": float(f_x1),
                    "x2": float(x2),
                    "error": float(error)
                })

                if error < tolerancia:
                    return {
                        "function": function_str,
                        "root": float(x2),
                        "iterations": i + 1,
                        "error": float(error),
                        "iterations_detail": detalles,
                        "converged": True,
                        "method": "Método de la Secante",
                        "message": "Raíz encontrada exitosamente"
                    }

                x0, x1 = x1, x2
                
            except Exception as e:
                return {
                    "function": function_str,
                    "iterations_detail": detalles,
                    "error": f"Error en la iteración {i+1}: {str(e)}",
                    "converged": False
                }

        return {
            "function": function_str,
            "iterations_detail": detalles,
            "error": f"El método no convergió en {max_iteraciones} iteraciones",
            "converged": False,
            "method": "Método de la Secante",
            "message": f"Se alcanzó el número máximo de iteraciones ({max_iteraciones}) sin convergencia",
            "suggestion": "Intenta aumentar max_iterations, cambiar los valores iniciales, o reducir la tolerancia"
        }
        
    except Exception as e:
        return {
            "function": function_str,
            "error": f"Error general en el método de la secante: {str(e)}",
            "converged": False
        }

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5004, debug=True)
    except Exception as e:
        print(f"Error al iniciar el servidor: {e}")
