from flask import Flask, jsonify, request
import math
import numpy as np
from sympy import symbols, sympify, lambdify
from flask_cors import CORS
import traceback
import re

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def romberg_solve():
    try:
        # Verificar que se reciban datos JSON
        if not request.is_json:
            return jsonify({
                "error": "El contenido debe ser JSON válido",
                "message": "Asegúrate de enviar datos en formato JSON con el header 'Content-Type: application/json'"
            }), 400
        
        data = request.get_json()
        
        # Verificar que data no sea None
        if data is None:
            return jsonify({
                "error": "No se recibieron datos",
                "message": "El cuerpo de la petición está vacío o no es JSON válido"
            }), 400
        
        # Verificar campos requeridos
        required_fields = ['function', 'a', 'b']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "error": "Datos incompletos",
                "message": f"Faltan los siguientes campos obligatorios: {', '.join(missing_fields)}",
                "required_fields": required_fields,
                "received_fields": list(data.keys())
            }), 400
        
        # Validar y convertir parámetros
        try:
            f_function_str = str(data['function']).strip()
            if not f_function_str:
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
            a = float(data['a'])
        except (ValueError, TypeError):
            return jsonify({
                "error": "Límite inferior inválido",
                "message": "El límite inferior 'a' debe ser un número válido"
            }), 400
        
        try:
            b = float(data['b'])
        except (ValueError, TypeError):
            return jsonify({
                "error": "Límite superior inválido",
                "message": "El límite superior 'b' debe ser un número válido"
            }), 400
        
        # Validar que a < b
        if a >= b:
            return jsonify({
                "error": "Intervalo inválido",
                "message": f"El límite inferior (a={a}) debe ser menor que el límite superior (b={b})"
            }), 400
        
        # Validar y convertir parámetros opcionales
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
            max_iteraciones = int(data.get('max_iterations', 10))
            if max_iteraciones <= 0:
                return jsonify({
                    "error": "Número de iteraciones inválido",
                    "message": "El número máximo de iteraciones debe ser un entero positivo mayor que 0"
                }), 400
            if max_iteraciones > 50:
                return jsonify({
                    "error": "Número de iteraciones excesivo",
                    "message": "El número máximo de iteraciones no puede ser mayor que 50 para evitar problemas de rendimiento"
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "error": "Número de iteraciones inválido",
                "message": "El número máximo de iteraciones debe ser un entero válido"
            }), 400
        
        # Intentar parsear la función
        try:
            f = parse_function(f_function_str)
        except ValueError as ve:
            return jsonify({
                "error": "Error al interpretar la función",
                "message": str(ve),
                "suggestion": "Verifica que la función use sintaxis de Python válida. Ejemplos: 'x**2 + 1', 'sin(x)', 'exp(x)', 'log(x)'"
            }), 400
        except Exception as e:
            return jsonify({
                "error": "Error inesperado al interpretar la función",
                "message": f"No se pudo procesar la función matemática: {str(e)}"
            }), 400
        
        # Validar que la función sea evaluable en el intervalo
        try:
            test_points = [a, (a + b) / 2, b]
            for point in test_points:
                result = f(point)
                # Ser más permisivo con los tipos de resultado
                if result is None or (isinstance(result, (int, float, np.number)) and (math.isnan(float(result)) or math.isinf(float(result)))):
                    return jsonify({
                        "error": "Función no evaluable",
                        "message": f"La función no puede ser evaluada correctamente en x={point}. Resultado: {result}",
                        "suggestion": "Verifica que la función esté definida en todo el intervalo [a, b]"
                    }), 400
        except Exception as e:
            return jsonify({
                "error": "Error al evaluar la función",
                "message": f"La función no puede ser evaluada en el intervalo dado: {str(e)}",
                "suggestion": "Verifica que la función esté definida en todo el intervalo [a, b] y no tenga divisiones por cero u operaciones inválidas"
            }), 400
        
        # Ejecutar el método de Romberg
        try:
            result = metodo_romberg(f, f_function_str, a, b, tolerancia, max_iteraciones)
            
            # Verificar si el resultado contiene error REAL (no el error de convergencia)
            if "error" in result and "integral" not in result:
                return jsonify({
                    "error": "Error en el cálculo del método de Romberg",
                    "message": result["error"],
                    "suggestion": "Intenta con una función más simple o verifica que esté bien definida"
                }), 500
            
            return jsonify(result)
        
        except Exception as e:
            return jsonify({
                "error": "Error durante el cálculo",
                "message": f"Error inesperado durante la ejecución del método de Romberg: {str(e)}",
                "suggestion": "Intenta con parámetros diferentes o contacta al administrador si el problema persiste"
            }), 500
    
    except Exception as e:
        # Capturar cualquier error no previsto
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
            "method": "romberg-method",
            "message": "Servicio funcionando correctamente"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error en el servicio: {str(e)}"
        }), 500

def parse_function(function_str):
    """
    Parsea una función matemática de string a función evaluable
    """
    if not isinstance(function_str, str):
        raise ValueError("La función debe ser una cadena de texto")
    
    function_str = function_str.strip()
    if not function_str:
        raise ValueError("La función no puede estar vacía")
    
    # Validaciones básicas de sintaxis
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
        
        # Probar la función con algunos valores
        try:
            test_val = func(1.0)
            # Ser más permisivo - solo verificar que no sea None y que sea un número válido
            if test_val is None:
                raise ValueError("La función retorna None")
            # Convertir a float para verificar
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

def regla_trapecio_compuesta(f, a, b, n):
    """
    Implementa la regla del trapecio compuesta
    """
    try:
        if n <= 0:
            raise ValueError("El número de subdivisiones debe ser positivo")
        
        h = (b - a) / n
        suma = f(a) + f(b)
        
        for i in range(1, n):
            x_i = a + i * h
            valor = f(x_i)
            # Convertir a float y verificar
            try:
                valor_float = float(valor)
                if math.isnan(valor_float) or math.isinf(valor_float):
                    raise ValueError(f"La función produce valores no válidos en x={x_i}")
                suma += 2 * valor_float
            except (TypeError, ValueError) as e:
                raise ValueError(f"La función produce valores no numéricos en x={x_i}: {valor}")
        
        resultado = (h / 2) * suma
        
        if math.isnan(resultado) or math.isinf(resultado):
            raise ValueError("El cálculo produjo un resultado no válido")
        
        return resultado
        
    except Exception as e:
        raise ValueError(f"Error en regla del trapecio: {str(e)}")

def metodo_romberg(f, f_function_str, a, b, tolerancia, max_iteraciones):
    """
    Implementa el método de Romberg para integración numérica
    """
    try:
        R = np.zeros((max_iteraciones, max_iteraciones))
        
        for i in range(max_iteraciones):
            try:
                n = 2**i
                R[i, 0] = regla_trapecio_compuesta(f, a, b, n)
                
                for j in range(1, i + 1):
                    denominador = 4**j - 1
                    if denominador == 0:
                        raise ValueError("División por cero en el método de Romberg")
                    R[i, j] = R[i, j-1] + (R[i, j-1] - R[i-1, j-1]) / denominador
                
                # Verificar convergencia
                if i > 0:
                    error = abs(R[i, i] - R[i-1, i-1])
                    
                    if math.isnan(error) or math.isinf(error):
                        raise ValueError("El cálculo del error produjo valores no válidos")
                    
                    if error < tolerancia:
                        tabla = []
                        for row in range(i + 1):
                            fila = []
                            for col in range(row + 1):
                                valor = R[row, col]
                                if math.isnan(valor) or math.isinf(valor):
                                    fila.append(None)
                                else:
                                    fila.append(float(valor))
                            tabla.append(fila)
                        
                        return {
                            "function": f_function_str,
                            "interval": [float(a), float(b)],
                            "tolerance": float(tolerancia),
                            "iterations": i + 1,
                            "integral": float(R[i, i]),
                            "error": float(error),
                            "romberg_table": tabla,
                            "converged": True,
                            "method": "Método de Romberg",
                            "message": "Cálculo completado exitosamente"
                        }
                        
            except Exception as e:
                raise ValueError(f"Error en iteración {i + 1}: {str(e)}")
        
        # Si no convergió
        tabla = []
        for row in range(max_iteraciones):
            fila = []
            for col in range(row + 1):
                valor = R[row, col]
                if math.isnan(valor) or math.isinf(valor):
                    fila.append(None)
                else:
                    fila.append(float(valor))
            tabla.append(fila)
        
        return {
            "function": f_function_str,
            "interval": [float(a), float(b)],
            "tolerance": float(tolerancia),
            "iterations": max_iteraciones,
            "integral": float(R[max_iteraciones-1, max_iteraciones-1]),
            "romberg_table": tabla,
            "converged": False,
            "warning": "No convergió dentro del número máximo de iteraciones",
            "method": "Método de Romberg",
            "message": "Cálculo completado pero sin convergencia. Intenta aumentar el número de iteraciones o ajustar la tolerancia.",
            "suggestion": "Considera aumentar max_iterations o reducir la tolerancia"
        }
    
    except Exception as e:
        return {
            "function": f_function_str,
            "error": f"Error en el cálculo del método de Romberg: {str(e)}"
        }

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5011, debug=True)
    except Exception as e:
        print(f"Error al iniciar el servidor: {e}")
