from flask import Flask, jsonify, request
import math
import numpy as np
from sympy import symbols, sympify, lambdify
from flask_cors import CORS
import traceback

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
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": "Faltan campos obligatorios",
                    "message": f"Falta el campo requerido: '{field}'"
                }), 400
            if str(data[field]).strip() == "":
                return jsonify({
                    "error": "Campo vacío",
                    "message": f"El campo '{field}' no puede estar vacío"
                }), 400

        try:
            f_function_str = str(data['function']).strip()
            a = float(data['a'])
            b = float(data['b'])
            n = int(data['n'])
        except ValueError as ve:
            return jsonify({
                "error": "Error de tipo de dato",
                "message": f"Uno de los parámetros no tiene el tipo de dato esperado: {str(ve)}"
            }), 400

        if a >= b:
            return jsonify({
                "error": "Intervalo inválido",
                "message": "El límite inferior 'a' debe ser menor que el superior 'b'"
            }), 400

        if n <= 0:
            return jsonify({
                "error": "Número de subintervalos inválido",
                "message": "El número de subintervalos debe ser mayor que 0"
            }), 400

        if n % 2 != 0:
            return jsonify({
                "error": "Subintervalos impares no válidos",
                "message": "La regla de Simpson 1/3 requiere un número par de subintervalos"
            }), 400

        try:
            f = parse_function(f_function_str)
            result = regla_simpson(f, f_function_str, a, b, n)

            if "error" in result:
                return jsonify({
                    "error": "Error en el cálculo",
                    "message": result["error"]
                }), 400

            return jsonify(result)

        except Exception as e:
            return jsonify({
                "error": "Error en el procesamiento de la función",
                "message": str(e)
            }), 400

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": "Error interno del servidor",
            "message": str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "method": "simpson-rule"
    })

def parse_function(function_str):
    x = symbols('x')
    try:
        expr = sympify(function_str)
        return lambdify(x, expr, modules=['numpy', 'math'])
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la función: {str(e)}")

def regla_simpson(f, f_function_str, a, b, n):
    try:
        h = (b - a) / n

        tabla = []
        suma = 0

        for i in range(n + 1):
            x_i = a + i * h

            if i == 0 or i == n:
                coef = 1
            elif i % 2 == 0:
                coef = 2
            else:
                coef = 4

            try:
                fx = f(x_i)
                if not isinstance(fx, (int, float, np.number)):
                    return {"error": f"f({x_i}) devolvió un valor no numérico"}

                if not math.isfinite(fx):
                    return {"error": f"f({x_i}) devolvió infinito o NaN"}

                contrib = coef * fx
                suma += contrib

                tabla.append({
                    "i": i,
                    "x": round(x_i, 6),
                    "fx": round(fx, 6),
                    "coefficient": coef,
                    "weighted": round(contrib, 6)
                })
            except Exception as e:
                return {"error": f"Error al evaluar f({x_i}): {str(e)}"}

        integral = (h / 3) * suma
        if not math.isfinite(integral):
            return {"error": "El resultado de la integral no es un número válido"}

        return {
            "function": f_function_str,
            "interval": [a, b],
            "subintervals": n,
            "step_size": round(h, 6),
            "integral": round(integral, 8),
            "method": "Regla de Simpson 1/3",
            "status": "success",
            "suma_total": round(suma, 6),
            "formula_explanation": f"I ≈ (h/3) × [suma total] = ({round(h, 6)}/3) × {round(suma, 6)} = {round(integral, 8)}",
            "table_data": tabla,
            "graph_data": generate_graph_data(f, a, b)
        }

    except Exception as e:
        return {"error": f"Error general durante el cálculo: {str(e)}"}

def generate_graph_data(f, a, b, points=200):
    try:
        step = (b - a) / points
        data = []
        for i in range(points + 1):
            x = a + i * step
            try:
                y = f(x)
                if math.isfinite(y):
                    data.append({
                        "x": round(x, 6),
                        "function": round(y, 6)
                    })
            except:
                continue
        return data
    except Exception as e:
        return []

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5009, debug=True)
