from flask import Flask, jsonify

app = Flask(__name__)

def f(x):
    return -x + (1 / x**2)

def f_prima(x):
    return -1 - (2 / x**3)

def newton_raphson(x0=-2.0, error=1e-6, max_iteraciones=100):
    for i in range(max_iteraciones):
        f_x0 = f(x0)
        f_prima_x0 = f_prima(x0)

        if f_prima_x0 == 0:
            return {"error": "Derivada cero, posible punto crítico."}
        
        g_x = x0 - (f_x0 / f_prima_x0)
        error_porcentual = abs(g_x - x0) / abs(g_x) * 100 if g_x != 0 else 0

        if error_porcentual < error:
            return {
                "function": "f(x) = -x + (1 / x^2)",
                "root": g_x,
                "iterations": i+1
            }
        
        x0 = g_x

    return {
        "function": "f(x) = -x + (1 / x^2)",
        "error": "El método no convergió."
    }

@app.route('/newton-raphson', methods=['GET'])
def newton_raphson_result():
    result = newton_raphson()
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)