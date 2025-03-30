from flask import Flask, jsonify

app = Flask(__name__)

# Función f(x)
def f(x):
    return (x**2) / 4 + (x * (3/2)) - 2

# Método de la Secante
def secant_method(x0=10, x1=6, tolerancia=1e-6, max_iteraciones=100):
    for i in range(max_iteraciones):
        f_x0 = f(x0)
        f_x1 = f(x1)

        if f_x1 - f_x0 == 0:
            return {"error": "División por cero detectada en iteración: " + str(i)}

        x2 = x1 - f_x1 * (x1 - x0) / (f_x1 - f_x0)
        error = abs((x2 - x1) / x2) * 100 if x2 != 0 else 0

        if error < tolerancia:
            return {
                "function": "f(x) = (x^2)/4 + (3/2)x - 2",
                "root": x2,
                "iterations": i+1
            }
        
        x0, x1 = x1, x2  

    return {
        "function": "f(x) = (x^2)/4 + (3/2)x - 2",
        "error": "El método no convergió."
    }

# Endpoint para consultar el resultado
@app.route('/secant', methods=['GET'])
def secant_result():
    result = secant_method()
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004, debug=True)