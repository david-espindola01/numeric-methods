from flask import Flask, jsonify, request
import numpy as np
from fractions import Fraction
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def jacobi_solve():
    if not request.is_json:
        return jsonify({"error": "El contenido debe ser JSON válido"}), 400
    
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "JSON malformado o inválido"}), 400

    if not data:
        return jsonify({"error": "No se recibieron datos"}), 400
    
    if 'A' not in data or 'b' not in data:
        return jsonify({"error": "Faltan datos requeridos. Se necesitan los campos 'A' (matriz) y 'b' (vector)"}), 400

    if not data['A'] or not data['b']:
        return jsonify({"error": "Los campos 'A' y 'b' no pueden estar vacíos"}), 400

    try:
        if not isinstance(data['A'], list):
            return jsonify({"error": "La matriz 'A' debe ser una lista de listas"}), 400
        
        if not all(isinstance(row, list) for row in data['A']):
            return jsonify({"error": "Cada fila de la matriz 'A' debe ser una lista"}), 400
        
        num_cols = len(data['A'][0]) if data['A'] else 0
        if not all(len(row) == num_cols for row in data['A']):
            return jsonify({"error": "Todas las filas de la matriz 'A' deben tener el mismo número de columnas"}), 400
        
        if len(data['A']) != num_cols:
            return jsonify({"error": "La matriz 'A' debe ser cuadrada (mismo número de filas y columnas)"}), 400
        
        if not isinstance(data['b'], list):
            return jsonify({"error": "El vector 'b' debe ser una lista"}), 400
        
        if len(data['b']) != len(data['A']):
            return jsonify({"error": f"Dimensiones incompatibles: la matriz A tiene {len(data['A'])} filas pero el vector b tiene {len(data['b'])} elementos"}), 400

        try:
            A = np.array([[Fraction(str(value)) for value in row] for row in data['A']], dtype=np.float64)
        except (ValueError, TypeError) as e:
            return jsonify({"error": "La matriz 'A' contiene valores no numéricos. Todos los elementos deben ser números"}), 400
        except Exception as e:
            return jsonify({"error": f"Error al procesar la matriz 'A': valores inválidos"}), 400

        try:
            b = np.array([Fraction(str(value)) for value in data['b']], dtype=np.float64)
        except (ValueError, TypeError) as e:
            return jsonify({"error": "El vector 'b' contiene valores no numéricos. Todos los elementos deben ser números"}), 400
        except Exception as e:
            return jsonify({"error": f"Error al procesar el vector 'b': valores inválidos"}), 400

        diagonal = np.diag(A)
        if np.any(np.abs(diagonal) < 1e-15):
            zero_positions = [i+1 for i, val in enumerate(diagonal) if abs(val) < 1e-15]
            return jsonify({"error": f"La matriz no es válida para el método de Jacobi: hay ceros en la diagonal en las posiciones {zero_positions}"}), 400

        try:
            tolerance = float(data.get('tolerance', 1e-6))
            if tolerance <= 0:
                return jsonify({"error": "La tolerancia debe ser un número positivo"}), 400
            if tolerance >= 1:
                return jsonify({"error": "La tolerancia debe ser menor que 1 para obtener resultados precisos"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "La tolerancia debe ser un número válido"}), 400

        try:
            max_iterations = int(data.get('max_iterations', 100))
            if max_iterations <= 0:
                return jsonify({"error": "El número máximo de iteraciones debe ser un entero positivo"}), 400
            if max_iterations > 10000:
                return jsonify({"error": "El número máximo de iteraciones no puede exceder 10,000 para evitar sobrecarga del servidor"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "El número máximo de iteraciones debe ser un número entero válido"}), 400

        result = jacobi(A, b, tolerance, max_iterations)
        return jsonify(result)

    except np.linalg.LinAlgError as e:
        return jsonify({"error": "Error en el cálculo de álgebra lineal: la matriz puede ser singular o mal condicionada"}), 400
    except OverflowError:
        return jsonify({"error": "Los valores son demasiado grandes para procesar. Intente con números más pequeños"}), 400
    except MemoryError:
        return jsonify({"error": "La matriz es demasiado grande para procesar en memoria"}), 400
    except Exception as e:
        return jsonify({"error": f"Error inesperado en el procesamiento: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        return jsonify({"status": "ok", "method": "Jacobi"})
    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500

def jacobi(A, b, tolerance, max_iterations):
    try:
        n = len(A)
        x = np.zeros(n, dtype=np.float64)
        x_new = np.zeros(n, dtype=np.float64)
        iterations_detail = []

        for iteration in range(max_iterations):
            row = {"iteration": iteration + 1, "x": x.tolist()}
            
            for i in range(n):
                s = sum(A[i][j] * x[j] for j in range(n) if j != i)
                x_new[i] = (b[i] - s) / A[i][i]
            
            error = np.linalg.norm(x_new - x)
            row["x_new"] = x_new.tolist()
            row["error"] = float(error)
            iterations_detail.append(row)

            if error < tolerance:
                return {
                    "method": "Jacobi",
                    "solution": x_new.tolist(),
                    "iterations": iteration + 1,
                    "iterations_detail": iterations_detail,
                    "converged": True,
                    "message": f"Solución encontrada en {iteration + 1} iteraciones con error {error:.2e}"
                }

            x = x_new.copy()

        return {
            "method": "Jacobi",
            "solution": x.tolist(),
            "iterations": max_iterations,
            "iterations_detail": iterations_detail,
            "converged": False,
            "message": f"Se alcanzó el máximo de iteraciones ({max_iterations}). La solución puede no haber convergido completamente."
        }
    
    except Exception as e:
        raise Exception(f"Error en el algoritmo de Jacobi: {str(e)}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5006, debug=True)
