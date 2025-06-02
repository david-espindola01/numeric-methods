from flask import Flask, jsonify, request
import math
import numpy as np
from sympy import symbols, sympify, lambdify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def euler_solve():
    data = request.get_json()
    
    if not all(k in data for k in ['function', 'x0', 'y0', 'h', 'x_final']):
        return jsonify({
            "error": "Datos incompletos. Se requiere: function, x0, y0, h, x_final"
        }), 400
    
    f_function_str = data['function']
    x0 = float(data['x0'])
    y0 = float(data['y0'])
    h = float(data['h'])
    x_final = float(data['x_final'])
    
    if h <= 0:
        return jsonify({
            "error": "El tamaño de paso (h) debe ser mayor que 0"
        }), 400
    
    if x_final <= x0:
        return jsonify({
            "error": "x_final debe ser mayor que x0"
        }), 400
    
    try:
        f = parse_function(f_function_str)
        
        result = metodo_euler(f, f_function_str, x0, y0, h, x_final)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "error": f"Error al procesar la función: {str(e)}"
        }), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "method": "euler-method"})

def parse_function(function_str):
    x, y = symbols('x y')
    try:
        expr = sympify(function_str)
        return lambdify((x, y), expr, modules=['numpy', 'math'])
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la función: {str(e)}")

def metodo_euler(f, f_function_str, x0, y0, h, x_final):
    try:
        n = int((x_final - x0) / h)
        
        x_vals = [x0]
        y_vals = [y0]
        slopes = []  # Para almacenar las pendientes
        
        x_current = x0
        y_current = y0
        
        for i in range(n):
            slope = f(x_current, y_current)
            slopes.append(slope)
            
            y_next = y_current + h * slope
            x_next = x_current + h
            
            x_vals.append(x_next)
            y_vals.append(y_next)
            
            x_current = x_next
            y_current = y_next
        
        # Crear tabla de iteraciones detallada
        iterations_detail = []
        for i in range(len(x_vals) - 1):  # -1 porque no hay pendiente para el último punto
            iterations_detail.append({
                "step": i,
                "x": round(x_vals[i], 6),
                "y": round(y_vals[i], 6),
                "slope": round(slopes[i], 6),
                "y_next": round(y_vals[i + 1], 6)
            })
        
        # Agregar el punto final sin pendiente
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
        raise Exception(f"Error en el cálculo: {str(e)}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5008, debug=True)