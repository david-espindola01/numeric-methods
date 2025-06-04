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

        # Modificación principal: buscar la primera raíz válida o detectar raíces exactas
        try:
            # Verificar si alguno de los extremos es ya una raíz exacta
            if abs(f_xi) < tolerancia:
                return jsonify({
                    "function": function_str,
                    "root": float(xi),
                    "iterations": 0,
                    "error": 0.0,
                    "converged": True,
                    "message": f"¡Raíz exacta encontrada en el límite inferior! x = {xi}",
                    "iterations_detail": []
                })
            
            if abs(f_xu) < tolerancia:
                return jsonify({
                    "function": function_str,
                    "root": float(xu),
                    "iterations": 0,
                    "error": 0.0,
                    "converged": True,
                    "message": f"¡Raíz exacta encontrada en el límite superior! x = {xu}",
                    "iterations_detail": []
                })
            
            # Si no hay cambio de signo, buscar un intervalo válido
            if f_xi * f_xu >= 0:
                interval_result = find_first_valid_root(f, xi, xu, tolerancia)
                if interval_result['found']:
                    xi, xu = interval_result['xi'], interval_result['xu']
                    # Agregar información sobre múltiples raíces al contexto
                    multiple_roots_info = interval_result.get('multiple_roots_info', None)
                else:
                    return jsonify({
                        "error": f"No se pudo encontrar un intervalo válido: {interval_result['message']}. El método de bisección necesita que la función cambie de signo en el intervalo. Prueba con límites diferentes."
                    }), 400
        except Exception as e:
            return jsonify({
                "error": f"Error al buscar un intervalo válido: {str(e)}. Contacta al soporte técnico si el problema persiste."
            }), 500

        try:
            result = biseccion(f, function_str, xi, xu, tolerancia, max_iteraciones)
            
            # Agregar información sobre múltiples raíces si existe
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

def find_first_valid_root(f, xi_original, xu_original, tolerance, step=0.1, max_search_range=100):
    """
    Busca la primera raíz válida expandiendo el intervalo o buscando en subintervalos.
    Devuelve un diccionario con la información del resultado y detecta múltiples raíces.
    """
    original_interval = [xi_original, xu_original]
    found_intervals = []  # Para almacenar todos los intervalos válidos encontrados
    
    # Verificar primero si hay raíces exactas en puntos cercanos
    for x_test in [xi_original, xu_original]:
        try:
            f_test = f(x_test)
            if abs(f_test) < tolerance:
                # Si es una raíz exacta, buscar un intervalo que la contenga
                left = x_test - step
                right = x_test + step
                try:
                    f_left = f(left)
                    f_right = f(right)
                    if f_left * f_right < 0:
                        return {
                            'found': True,
                            'xi': left,
                            'xu': right,
                            'message': f'Intervalo válido alrededor de la raíz {x_test:.6f}: [{left:.6f}, {right:.6f}]',
                            'strategy': 'around_root'
                        }
                except:
                    continue
        except:
            continue
    
    # Estrategia 1: Expandir el intervalo original evitando las raíces exactas
    xi, xu = xi_original, xu_original
    expansion_attempts = 50
    
    for attempt in range(expansion_attempts):
        try:
            f_xi = f(xi)
            f_xu = f(xu)
            
            if not (math.isfinite(f_xi) and math.isfinite(f_xu)):
                xi -= step
                xu += step
                continue
            
            # Evitar intervalos donde ambos extremos son raíces
            if abs(f_xi) < tolerance and abs(f_xu) < tolerance:
                xi -= step
                xu += step
                continue
                
            if f_xi * f_xu < 0:
                found_intervals.append({'xi': xi, 'xu': xu, 'strategy': 'expansion'})
                break
                
            xi -= step
            xu += step
            
        except Exception:
            xi -= step
            xu += step
            continue
    
    # Estrategia 2: Búsqueda sistemática desplazada para evitar simetrías
    if not found_intervals:
        search_offsets = [0.1, -0.1, 0.3, -0.3, 0.7, -0.7]
        
        for offset in search_offsets:
            xi_offset = xi_original + offset
            xu_offset = xu_original + offset
            
            try:
                f_xi_offset = f(xi_offset)
                f_xu_offset = f(xu_offset)
                
                if math.isfinite(f_xi_offset) and math.isfinite(f_xu_offset):
                    if f_xi_offset * f_xu_offset < 0:
                        found_intervals.append({'xi': xi_offset, 'xu': xu_offset, 'strategy': 'offset'})
                        break
            except:
                continue
    
    # Estrategia 3: Dividir el intervalo original en subintervalos y buscar cambios de signo
    if not found_intervals:
        num_subdivisions = 50
        interval_width = xu_original - xi_original
        subdivision_width = interval_width / num_subdivisions
        
        for i in range(num_subdivisions):
            try:
                sub_xi = xi_original + i * subdivision_width
                sub_xu = xi_original + (i + 1) * subdivision_width
                
                f_sub_xi = f(sub_xi)
                f_sub_xu = f(sub_xu)
                
                if not (math.isfinite(f_sub_xi) and math.isfinite(f_sub_xu)):
                    continue
                
                # Saltar si ambos son raíces exactas
                if abs(f_sub_xi) < tolerance and abs(f_sub_xu) < tolerance:
                    continue
                    
                if f_sub_xi * f_sub_xu < 0:
                    found_intervals.append({'xi': sub_xi, 'xu': sub_xu, 'strategy': 'subdivision'})
                    
            except Exception:
                continue
    
    # Estrategia 4: Búsqueda sistemática en un rango más amplio
    if not found_intervals:
        search_start = xi_original - max_search_range
        search_end = xu_original + max_search_range
        search_step = step * 2  # Paso más grande para búsqueda amplia
        search_points = int((search_end - search_start) / search_step)
        
        prev_x = search_start
        try:
            prev_f = f(prev_x)
        except:
            prev_f = None
        
        for i in range(1, min(search_points, 500)):  # Limitar para evitar sobrecarga
            try:
                current_x = search_start + i * search_step
                current_f = f(current_x)
                
                if prev_f is not None and math.isfinite(prev_f) and math.isfinite(current_f):
                    # Evitar casos donde ambos son raíces exactas
                    if not (abs(prev_f) < tolerance and abs(current_f) < tolerance):
                        if prev_f * current_f < 0:
                            found_intervals.append({'xi': prev_x, 'xu': current_x, 'strategy': 'wide_search'})
                
                prev_x = current_x
                prev_f = current_f
                
            except Exception:
                prev_f = None
                continue
    
    # Analizar los resultados
    if found_intervals:
        first_interval = found_intervals[0]
        
        # Preparar mensaje sobre múltiples raíces
        multiple_roots_message = ""
        if len(found_intervals) > 1:
            multiple_roots_message = f"Nota: Se detectaron {len(found_intervals)} intervalos con posibles raíces. Esta es la primera."
        
        # Verificar si hay más intervalos válidos después del primero
        additional_check_message = check_for_additional_roots(f, first_interval['xu'], xu_original + max_search_range, tolerance)
        
        if additional_check_message:
            if multiple_roots_message:
                multiple_roots_message += f" {additional_check_message}"
            else:
                multiple_roots_message = additional_check_message
        
        strategy_messages = {
            'expansion': f'Intervalo válido encontrado expandiendo: [{first_interval["xi"]:.6f}, {first_interval["xu"]:.6f}]',
            'offset': f'Intervalo válido encontrado con desplazamiento: [{first_interval["xi"]:.6f}, {first_interval["xu"]:.6f}]',
            'subdivision': f'Primera raíz encontrada en subintervalo: [{first_interval["xi"]:.6f}, {first_interval["xu"]:.6f}]',
            'wide_search': f'Primera raíz encontrada mediante búsqueda amplia: [{first_interval["xi"]:.6f}, {first_interval["xu"]:.6f}]'
        }
        
        return {
            'found': True,
            'xi': first_interval['xi'],
            'xu': first_interval['xu'],
            'message': strategy_messages.get(first_interval['strategy'], 'Intervalo válido encontrado'),
            'strategy': first_interval['strategy'],
            'multiple_roots_info': multiple_roots_message if multiple_roots_message else None
        }
    
    return {
        'found': False,
        'xi': None,
        'xu': None,
        'message': f'No se encontró ningún intervalo válido después de búsqueda exhaustiva desde {original_interval}',
        'strategy': 'none'
    }

def check_for_additional_roots(f, start_x, end_x, tolerance, step=0.5):
    """
    Verifica si hay raíces adicionales después del primer intervalo encontrado.
    Retorna un mensaje si encuentra evidencia de más raíces.
    """
    try:
        search_points = int((end_x - start_x) / step)
        if search_points > 200:  # Limitar búsqueda para evitar sobrecarga
            search_points = 200
            step = (end_x - start_x) / search_points
        
        sign_changes = 0
        prev_x = start_x
        
        try:
            prev_f = f(prev_x)
        except:
            prev_f = None
        
        for i in range(1, search_points):
            try:
                current_x = start_x + i * step
                current_f = f(current_x)
                
                if prev_f is not None and math.isfinite(prev_f) and math.isfinite(current_f):
                    if prev_f * current_f < 0:
                        sign_changes += 1
                        if sign_changes >= 1:  # Con encontrar una más es suficiente
                            return "Además, se detectó al menos una raíz adicional en el rango explorado."
                
                prev_f = current_f
                
            except:
                prev_f = None
                continue
        
        return None
        
    except Exception:
        return None

def find_valid_interval(f, xi, xu, step=0.5, max_attempts=20):
    """Función original mantenida para compatibilidad"""
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
