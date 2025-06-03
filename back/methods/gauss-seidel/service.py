from flask import Flask, jsonify, request
import numpy as np
from fractions import Fraction
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def gauss_seidel_solve():
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
        
        if 'A' not in data:
            return jsonify({
                "error": "Falta la matriz A",
                "message": "Se requiere la matriz de coeficientes 'A' para resolver el sistema"
            }), 400
        
        if 'b' not in data:
            return jsonify({
                "error": "Falta el vector b",
                "message": "Se requiere el vector de términos independientes 'b' para resolver el sistema"
            }), 400
        
        if not isinstance(data['A'], list):
            return jsonify({
                "error": "Matriz A inválida",
                "message": "La matriz A debe ser una lista de listas (array 2D)"
            }), 400
        
        if len(data['A']) == 0:
            return jsonify({
                "error": "Matriz A vacía",
                "message": "La matriz A no puede estar vacía"
            }), 400
        
        for i, row in enumerate(data['A']):
            if not isinstance(row, list):
                return jsonify({
                    "error": f"Fila {i+1} de matriz A inválida",
                    "message": f"La fila {i+1} de la matriz A debe ser una lista de números"
                }), 400
            
            if len(row) == 0:
                return jsonify({
                    "error": f"Fila {i+1} de matriz A vacía",
                    "message": f"La fila {i+1} de la matriz A no puede estar vacía"
                }), 400
        
        n_rows = len(data['A'])
        n_cols = len(data['A'][0])
        
        if n_rows != n_cols:
            return jsonify({
                "error": "Matriz A no es cuadrada",
                "message": f"La matriz A debe ser cuadrada. Actual: {n_rows}x{n_cols}"
            }), 400
        
        for i, row in enumerate(data['A']):
            if len(row) != n_cols:
                return jsonify({
                    "error": f"Matriz A inconsistente en fila {i+1}",
                    "message": f"Todas las filas deben tener {n_cols} elementos. La fila {i+1} tiene {len(row)}"
                }), 400
        
        if not isinstance(data['b'], list):
            return jsonify({
                "error": "Vector b inválido",
                "message": "El vector b debe ser una lista de números"
            }), 400
        
        if len(data['b']) == 0:
            return jsonify({
                "error": "Vector b vacío",
                "message": "El vector b no puede estar vacío"
            }), 400
        
        if len(data['b']) != n_rows:
            return jsonify({
                "error": "Dimensiones incompatibles",
                "message": f"El vector b debe tener {n_rows} elementos para coincidir con la matriz A {n_rows}x{n_cols}"
            }), 400
        
        try:
            A_converted = []
            for i, row in enumerate(data['A']):
                converted_row = []
                for j, value in enumerate(row):
                    try:
                        if isinstance(value, str):
                            converted_value = float(Fraction(value))
                        else:
                            converted_value = float(value)
                        
                        if not math.isfinite(converted_value):
                            return jsonify({
                                "error": f"Valor inválido en A[{i+1}][{j+1}]",
                                "message": f"El valor en la posición ({i+1},{j+1}) de la matriz A no es un número finito"
                            }), 400
                        
                        converted_row.append(converted_value)
                    except (ValueError, TypeError, ZeroDivisionError):
                        return jsonify({
                            "error": f"Valor no numérico en A[{i+1}][{j+1}]",
                            "message": f"No se puede convertir '{value}' a número en la posición ({i+1},{j+1}) de la matriz A"
                        }), 400
                A_converted.append(converted_row)
            
            A = np.array(A_converted, dtype=np.float64)
            
        except Exception as e:
            return jsonify({
                "error": "Error al procesar matriz A",
                "message": f"No se pudo convertir la matriz A: {str(e)}"
            }), 400
        
        try:
            b_converted = []
            for i, value in enumerate(data['b']):
                try:
                    if isinstance(value, str):
                        converted_value = float(Fraction(value))
                    else:
                        converted_value = float(value)
                    
                    if not math.isfinite(converted_value):
                        return jsonify({
                            "error": f"Valor inválido en b[{i+1}]",
                            "message": f"El valor en la posición {i+1} del vector b no es un número finito"
                        }), 400
                    
                    b_converted.append(converted_value)
                except (ValueError, TypeError, ZeroDivisionError):
                    return jsonify({
                        "error": f"Valor no numérico en b[{i+1}]",
                        "message": f"No se puede convertir '{value}' a número en la posición {i+1} del vector b"
                    }), 400
            
            b = np.array(b_converted, dtype=np.float64)
            
        except Exception as e:
            return jsonify({
                "error": "Error al procesar vector b",
                "message": f"No se pudo convertir el vector b: {str(e)}"
            }), 400
        
        try:
            tolerance = float(data.get('tolerance', 1e-6))
            if tolerance <= 0:
                return jsonify({
                    "error": "Tolerancia inválida",
                    "message": "La tolerancia debe ser un número positivo"
                }), 400
            if not math.isfinite(tolerance):
                return jsonify({
                    "error": "Tolerancia inválida",
                    "message": "La tolerancia debe ser un número finito"
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "error": "Tolerancia inválida",
                "message": "La tolerancia debe ser un número válido"
            }), 400
        
        try:
            max_iterations = int(data.get('max_iterations', 100))
            if max_iterations <= 0:
                return jsonify({
                    "error": "Número de iteraciones inválido",
                    "message": "El número máximo de iteraciones debe ser un entero positivo"
                }), 400
            if max_iterations > 10000:
                return jsonify({
                    "error": "Demasiadas iteraciones",
                    "message": f"El número máximo de iteraciones ({max_iterations}) es demasiado alto. Máximo permitido: 10000"
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "error": "Número de iteraciones inválido",
                "message": "El número máximo de iteraciones debe ser un entero válido"
            }), 400
        
        for i in range(len(A)):
            if abs(A[i][i]) < 1e-14:
                return jsonify({
                    "error": "División por cero",
                    "message": f"El elemento diagonal A[{i+1}][{i+1}] es cero o muy pequeño. El método de Gauss-Seidel requiere elementos diagonales no nulos"
                }), 400
        
        is_diagonally_dominant = True
        for i in range(len(A)):
            diagonal = abs(A[i][i])
            off_diagonal_sum = sum(abs(A[i][j]) for j in range(len(A)) if j != i)
            if diagonal <= off_diagonal_sum:
                is_diagonally_dominant = False
                break
        
        try:
            result = gauss_seidel(A, b, tolerance, max_iterations)
            
            if not is_diagonally_dominant:
                result["warning"] = "La matriz no es diagonalmente dominante. La convergencia no está garantizada"
            
            return jsonify(result)
        
        except np.linalg.LinAlgError as linalg_e:
            return jsonify({
                "error": "Error de álgebra lineal",
                "message": f"Error en los cálculos matriciales: {str(linalg_e)}"
            }), 400
        
        except OverflowError:
            return jsonify({
                "error": "Desbordamiento numérico",
                "message": "Los valores calculados son demasiado grandes. El método puede no converger para este sistema"
            }), 400
        
        except Exception as e:
            return jsonify({
                "error": "Error durante el cálculo",
                "message": f"Error en el método de Gauss-Seidel: {str(e)}"
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
        return jsonify({"status": "ok", "method": "Gauss-Seidel"})
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "El servicio no está funcionando correctamente"
        }), 500

def gauss_seidel(A, b, tolerance, max_iterations):
    try:
        n = len(A)
        x = np.zeros(n, dtype=np.float64)
        iterations_detail = []

        for iteration in range(max_iterations):
            x_old = x.copy()
            row = {"iteration": iteration + 1, "x": x_old.tolist()}

            for i in range(n):
                try:
                    s = sum(A[i][j] * x[j] for j in range(n) if j != i)
                    new_value = (b[i] - s) / A[i][i]
                    
                    if not math.isfinite(new_value):
                        raise ValueError(f"El cálculo produjo un valor no finito en la variable x{i+1}")
                    
                    x[i] = new_value
                    
                except ZeroDivisionError:
                    raise ValueError(f"División por cero en la diagonal A[{i+1}][{i+1}]")
                except Exception as e:
                    raise ValueError(f"Error al calcular x{i+1} en la iteración {iteration+1}: {str(e)}")

            try:
                error = np.linalg.norm(x - x_old)
                
                if not math.isfinite(error):
                    raise ValueError("El cálculo del error produjo un valor no finito")
                
                row["x_new"] = x.tolist()
                row["error"] = float(error)
                iterations_detail.append(row)

                if error < tolerance:
                    return {
                        "method": "Gauss-Seidel",
                        "solution": x.tolist(),
                        "iterations": iteration + 1,
                        "iterations_detail": iterations_detail,
                        "converged": True
                    }
                    
            except Exception as e:
                raise ValueError(f"Error al calcular el error en la iteración {iteration+1}: {str(e)}")

        return {
            "method": "Gauss-Seidel",
            "solution": x.tolist(),
            "iterations": max_iterations,
            "iterations_detail": iterations_detail,
            "converged": False,
            "message": f"No se alcanzó la convergencia después de {max_iterations} iteraciones"
        }
    
    except Exception as e:
        raise Exception(str(e))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5007, debug=True)
