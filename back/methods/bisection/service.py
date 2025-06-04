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

        # Guardar los límites originales del intervalo
        xi_original = xi
        xu_original = xu

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

        # Verificar raíces exactas en los extremos
        try:
            if abs(f_xi) < tolerancia:
                return jsonify({
                    "function": function_str,
                    "root": float(xi),
                    "iterations": 0,
                    "error": 0.0,
                    "converged": True,
                    "message": f"¡Raíz exacta encontrada en el límite inferior! x = {xi}",
                    "iterations_detail": [],
                    "interval_used": [xi_original, xu_original]
                })
            
            if abs(f_xu) < tolerancia:
                return jsonify({
                    "function": function_str,
                    "root": float(xu),
                    "iterations": 0,
                    "error": 0.0,
                    "converged": True,
                    "message": f"¡Raíz exacta encontrada en el límite superior! x = {xu}",
                    "iterations_detail": [],
                    "interval_used": [xi_original, xu_original]
                })
            
            # Si no hay cambio de signo en los extremos, buscar dentro del intervalo
            if f_xi * f_xu >= 0:
                interval_result = find_root_within_interval(f, xi_original, xu_original, tolerancia)
                if interval_result['found']:
                    if interval_result['strategy'] == 'exact_root':
                        # Si encontramos una raíz exacta, devolverla directamente
                        root_value = interval_result['root']
                        return jsonify({
                            "function": function_str,
                            "root": float(root_value),
                            "iterations": 0,
                            "error": 0.0,
                            "converged": True,
                            "message": f"¡Raíz exacta encontrada! x = {root_value:.6f}",
                            "iterations_detail": [],
                            "interval_used": [xi_original, xu_original]
                        })
                    else:
                        # Usar el subintervalo encontrado para bisección
                        xi, xu = interval_result['xi'], interval_result['xu']
                        multiple_roots_info = interval_result.get('multiple_roots_info', None)
                else:
                    return jsonify({
                        "error": f"No se encontró ninguna raíz dentro del intervalo [{xi_original}, {xu_original}]. {interval_result['message']} Para usar el método de bisección, la función debe cambiar de signo dentro del intervalo especificado.",
                        "interval_searched": [xi_original, xu_original],
                        "f_xi": f_xi,
                        "f_xu": f_xu
                    }), 400
        except Exception as e:
            return jsonify({
                "error": f"Error al buscar raíces dentro del intervalo: {str(e)}. Contacta al soporte técnico si el problema persiste."
            }), 500

        try:
            result = biseccion(f, function_str, xi, xu, tolerancia, max_iteraciones)
            
            # Agregar información del intervalo original
            result['interval_used'] = [xi_original, xu_original]
            result['subinterval_found'] = [xi, xu] if (xi != xi_original or xu != xu_original) else None
            
            if 'multiple_roots_info' in locals() and multiple_roots_info:
                if result.get('converged', False):
                    current_message = result.get('message', '')
                    result['message'] = f"{current_message} {multiple_roots_info}"
            
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

def find_root_within_interval(f, xi_original, xu_original, tolerance):
    """
    Busca raíces ÚNICAMENTE dentro del intervalo especificado.
    CORRECCIÓN PRINCIPAL: Implementa búsqueda sistemática y precisa.
    """
    interval_width = xu_original - xu_original
    found_intervals = []
    exact_roots = []
    
    # Usar más puntos de muestreo para mayor precisión
    num_points = min(max(500, int(abs(xu_original - xi_original) * 100)), 2000)
    
    try:
        # Crear array de puntos de prueba dentro del intervalo
        x_points = []
        step = (xu_original - xi_original) / num_points
        
        for i in range(num_points + 1):
            x_test = xi_original + i * step
            # Asegurar que no excedamos los límites por errores de punto flotante
            x_test = max(xi_original, min(x_test, xu_original))
            x_points.append(x_test)
        
        # Evaluar función en todos los puntos
        evaluations = []
        for x_test in x_points:
            try:
                f_test = f(x_test)
                if math.isfinite(f_test):
                    evaluations.append((x_test, f_test))
                    
                    # Verificar si es una raíz exacta
                    if abs(f_test) < tolerance:
                        exact_roots.append(x_test)
            except:
                continue
        
        # Si no pudimos evaluar ningún punto, retornar error
        if not evaluations:
            return {
                'found': False,
                'xi': None,
                'xu': None,
                'message': 'No se pudo evaluar la función en ningún punto del intervalo.',
                'strategy': 'evaluation_error'
            }
        
        # Buscar cambios de signo entre puntos consecutivos
        for i in range(len(evaluations) - 1):
            x1, f1 = evaluations[i]
            x2, f2 = evaluations[i + 1]
            
            # Verificar cambio de signo (productos de signos opuestos)
            if f1 * f2 < 0:
                found_intervals.append({
                    'xi': x1,
                    'xu': x2,
                    'f_xi': f1,
                    'f_xu': f2,
                    'strategy': 'sign_change'
                })
        
        # Priorizar raíces exactas
        if exact_roots:
            first_root = exact_roots[0]
            
            multiple_roots_message = ""
            total_roots = len(exact_roots) + len(found_intervals)
            if total_roots > 1:
                multiple_roots_message = f"Nota: Se detectaron {total_roots} raíces dentro del intervalo [{xi_original:.6f}, {xu_original:.6f}]. Se está devolviendo la primera encontrada."
            
            return {
                'found': True,
                'root': float(first_root),
                'strategy': 'exact_root',
                'message': f'Raíz exacta encontrada en x = {first_root:.6f}',
                'multiple_roots_info': multiple_roots_message if multiple_roots_message else None
            }
        
        # Si no hay raíces exactas, usar el primer intervalo con cambio de signo
        if found_intervals:
            first_interval = found_intervals[0]
            
            multiple_roots_message = ""
            if len(found_intervals) > 1:
                multiple_roots_message = f"Nota: Se detectaron {len(found_intervals)} intervalos con cambio de signo dentro de [{xi_original:.6f}, {xu_original:.6f}]. Se está resolviendo el primero."
            
            return {
                'found': True,
                'xi': first_interval['xi'],
                'xu': first_interval['xu'],
                'message': f'Intervalo con cambio de signo encontrado: [{first_interval["xi"]:.6f}, {first_interval["xu"]:.6f}]',
                'strategy': 'sign_change',
                'multiple_roots_info': multiple_roots_message if multiple_roots_message else None
            }
        
        # Si no se encontraron raíces, proporcionar información útil
        # Encontrar el punto donde la función está más cerca de cero
        min_abs_eval = min(evaluations, key=lambda x: abs(x[1]))
        x_closest, f_closest = min_abs_eval
        
        f_xi = f(xi_original) if xi_original in [e[0] for e in evaluations] else "No evaluable"
        f_xu = f(xu_original) if xu_original in [e[0] for e in evaluations] else "No evaluable"
        
        return {
            'found': False,
            'xi': None,
            'xu': None,
            'message': f'No se encontraron raíces en el intervalo [{xi_original:.6f}, {xu_original:.6f}]. El valor más cercano a cero fue f({x_closest:.6f}) = {f_closest:.6f}. f({xi_original:.6f}) = {f_xi}, f({xu_original:.6f}) = {f_xu}.',
            'strategy': 'no_roots_found'
        }
        
    except Exception as e:
        return {
            'found': False,
            'xi': None,
            'xu': None,
            'message': f'Error durante la búsqueda de raíces: {str(e)}',
            'strategy': 'search_error'
        }

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
