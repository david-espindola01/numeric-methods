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
def simpson_solve():
    try:
        if not request.is_json:
            return jsonify({
                "error": "El contenido debe ser JSON válido",
                "message": "Asegúrate de enviar datos en formato JSON"
            }), 400
        
        data = request.get_json()
        
        if data is None:
            return jsonify({
                "error": "JSON vacío o inválido",
                "message": "El cuerpo de la petición debe contener datos JSON válidos"
            }), 400
        
        required_fields = ['function', 'a', 'b', 'n']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "error": "Faltan campos obligatorios",
                "message": f"Los siguientes campos son requeridos: {', '.join(missing_fields)}",
                "required_fields": required_fields,
                "received_fields": list(data.keys()) if isinstance(data, dict) else []
            }), 400
        
        empty_fields = [field for field in required_fields if not str(data[field]).strip()]
        if empty_fields:
            return jsonify({
                "error": "Campos vacíos detectados",
                "message": f"Los siguientes campos no pueden estar vacíos: {', '.join(empty_fields)}"
            }), 400
        
        f_function_str = str(data['function']).strip()
        
        try:
            a = float(data['a'])
        except (ValueError, TypeError):
            return jsonify({
                "error": "Parámetro 'a' inválido",
                "message": f"El límite inferior 'a' debe ser un número válido. Recibido: '{data['a']}'"
            }), 400
        
        try:
            b = float(data['b'])
        except (ValueError, TypeError):
            return jsonify({
                "error": "Parámetro 'b' inválido",
                "message": f"El límite superior 'b' debe ser un número válido. Recibido: '{data['b']}'"
            }), 400
        
        try:
            n = int(data['n'])
        except (ValueError, TypeError):
            return jsonify({
                "error": "Parámetro 'n' inválido",
                "message": f"El número de subintervalos 'n' debe ser un número entero. Recibido: '{data['n']}'"
            }), 400
        
        if a >= b:
            return jsonify({
                "error": "Intervalo inválido",
                "message": f"El límite inferior 'a' ({a}) debe ser menor que el límite superior 'b' ({b})"
            }), 400
        
        if n <= 0:
            return jsonify({
                "error": "Número de subintervalos inválido",
                "message": f"El número de subintervalos 'n' debe ser mayor que 0. Recibido: {n}"
            }), 400
        
        if n % 2 != 0:
            return jsonify({
                "error": "Número de subintervalos debe ser par",
                "message": f"La regla de Simpson 1/3 requiere un número par de subintervalos. Recibido: {n} (impar). Prueba con {n+1} o {n-1}"
            }), 400
        
        if n > 10000:
            return jsonify({
                "error": "Número de subintervalos demasiado grande",
                "message": f"Por razones de rendimiento, el máximo número de subintervalos permitido es 10000. Recibido: {n}"
            }), 400
        
        if not f_function_str:
            return jsonify({
                "error": "Función vacía",
                "message": "Debes proporcionar una función matemática válida. Ejemplo: 'x**2 + 1'"
            }), 400
        
        try:
            f = parse_function(f_function_str)
            
            result = regla_simpson(f, f_function_str, a, b, n)
            
            if "error" in result:
                return jsonify({
                    "error": "Error en el cálculo de la integral",
                    "message": result["error"],
                    "function": f_function_str
                }), 400
            
            return jsonify(result)
        
        except ValueError as ve:
            return jsonify({
                "error": "Función matemática inválida",
                "message": str(ve),
                "suggestion": "Verifica la sintaxis de tu función. Ejemplos válidos: 'x**2', 'sin(x)', 'exp(x)', 'log(x)'"
            }), 400
        
        except ZeroDivisionError:
            return jsonify({
                "error": "División por cero",
                "message": "La función contiene una división por cero en el intervalo especificado",
                "suggestion": "Verifica que tu función esté definida en todo el intervalo [a, b]"
            }), 400
        
        except OverflowError:
            return jsonify({
                "error": "Resultado demasiado grande",
                "message": "El cálculo produce números demasiado grandes para procesar",
                "suggestion": "Intenta con un intervalo más pequeño o menos subintervalos"
            }), 400
        
        except Exception as e:
            error_type = type(e).__name__
            print(f"Error inesperado: {error_type}: {str(e)}")
            traceback.print_exc()
            
            return jsonify({
                "error": f"Error inesperado durante el cálculo",
                "message": f"Se produjo un error de tipo {error_type}: {str(e)}",
                "function": f_function_str
            }), 500
    
    except Exception as e:
        print(f"Error general del servidor: {str(e)}")
        traceback.print_exc()
        
        return jsonify({
            "error": "Error interno del servidor",
            "message": "Se produjo un error inesperado al procesar tu solicitud",
            "details": str(e) if app.debug else "Contacta al administrador del sistema"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        return jsonify({
            "status": "ok", 
            "method": "simpson-rule",
            "message": "Servicio funcionando correctamente"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error en el servicio: {str(e)}"
        }), 500

def parse_function(function_str):
    x = symbols('x')
    try:
        function_str = function_str.strip()
        expr = sympify(function_str)
        
        if not expr.free_symbols:
            raise ValueError("La función debe contener la variable 'x'")
        
        if len(expr.free_symbols) > 1 or (expr.free_symbols and 'x' not in str(expr.free_symbols)):
            invalid_vars = [str(var) for var in expr.free_symbols if str(var) != 'x']
            raise ValueError(f"La función solo puede contener la variable 'x'. Variables no válidas encontradas: {', '.join(invalid_vars)}")
        
        func = lambdify(x, expr, modules=['numpy', 'math'])
        
        try:
            test_result = func(1.0)
            if not isinstance(test_result, (int, float, np.number)):
                raise ValueError("La función debe retornar valores numéricos")
        except Exception as test_error:
            raise ValueError(f"Error al evaluar la función: {str(test_error)}")
        
        return func
        
    except Exception as e:
        if "ValueError" in str(type(e)):
            raise e
        else:
            raise ValueError(f"No se pudo interpretar la función '{function_str}'. Error: {str(e)}")

def regla_simpson(f, f_function_str, a, b, n):
    try:
        h = (b - a) / n
        
        if h < 1e-15:
            return {
                "error": "El paso de integración es demasiado pequeño, esto puede causar errores numéricos"
            }
        
        table_data = []
        suma_total = 0
        
        for i in range(n + 1):
            x_i = a + i * h
            
            if i == 0 or i == n:
                coefficient = 1
            elif i % 2 == 1:
                coefficient = 4
            else:
                coefficient = 2
            
            try:
                fx_i = f(x_i)
                
                if math.isnan(fx_i) or math.isinf(fx_i):
                    return {
                        "error": f"La función produce un valor no válido en x = {x_i}"
                    }
                
                weighted_value = coefficient * fx_i
                suma_total += weighted_value
                
                table_data.append({
                    "i": i,
                    "x": round(x_i, 6),
                    "fx": round(fx_i, 6),
                    "coefficient": coefficient,
                    "weighted": round(weighted_value, 6)
                })
                
            except Exception as e:
                return {
                    "error": f"Error al evaluar la función en x = {x_i}: {str(e)}"
                }
        
        integral = (h / 3) * suma_total
        
        if math.isnan(integral) or math.isinf(integral):
            return {
                "error": "El resultado de la integral no es un número válido"
            }
        
        graph_data = generate_graph_data(f, a, b)
        
        return {
            "function": f_function_str,
            "interval": [a, b],
            "subintervals": n,
            "step_size": round(h, 6),
            "integral": round(integral, 8),
            "method": "Regla de Simpson 1/3",
            "status": "success",
            "table_data": table_data,
            "graph_data": graph_data,
            "suma_total": round(suma_total, 6),
            "formula_explanation": f"I ≈ (h/3) × [suma total] = ({round(h, 6)}/3) × {round(suma_total, 6)} = {round(integral, 8)}"
        }
    
    except Exception as e:
        return {
            "error": f"Error durante el cálculo de la regla de Simpson: {str(e)}"
        }

def generate_graph_data(f, a, b, num_points=200):
    try:
        step = (b - a) / num_points
        graph_data = []
        
        for i in range(num_points + 1):
            x = a + i * step
            try:
                y = f(x)
                if math.isfinite(y):
                    graph_data.append({
                        "x": round(x, 6),
                        "function": round(y, 6)
                    })
            except:
                continue
        
        return graph_data
    
    except Exception as e:
        print(f"Error generando datos del gráfico: {str(e)}")
        return []

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5008, debug=True)
