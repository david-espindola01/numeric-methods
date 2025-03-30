from flask import Flask, jsonify

app = Flask(__name__)

# Función g(x)
def g(x):
    return (4 - 1/(2*x) - (2*x**2)/7) ** (2/3)

# Método de Punto Fijo
def puntoFijo(x0=1.5, tolerancia=1e-6, max_iteraciones=100):
    x1 = x0
    for i in range(max_iteraciones):
        x1 = g(x0)
        error = abs(x1 - x0)
        
        if error < tolerancia:
            return {
                "function": "g(x) = (4 - 1/(2*x) - (2*x^2)/7)^(2/3)",
                "root": x1,
                "iterations": i+1
            }
        
        x0 = x1
    
    return {
        "function": "g(x) = (4 - 1/(2*x) - (2*x^2)/7)^(2/3)",
        "error": "El método diverge"
    }

# Endpoint GET para obtener el resultado
@app.route('/fixed-point', methods=['GET'])
def fixed_point_result():
    result = puntoFijo()  # Ejecuta el método con valores por defecto
    return jsonify(result)  # Devuelve el resultado en JSON

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
