from flask import Flask, jsonify
import math

app = Flask(__name__)


def f(x):
    return (math.exp(4*x)*3/2) + x**2 - (3/4)*x - 2


def biseccion(xi=-3, xu=-1, tolerancia=1e-6, max_iteraciones=100):
    for i in range(max_iteraciones):
        xr = (xi + xu) / 2
        if abs(f(xr)) < tolerancia or (xu - xi) / 2 < tolerancia:
            return {
                "function": "f(x) = (e^(4x)*3/2) + x^2 - (3/4)x - 2",
                "root": xr,
                "iterations": i+1
            }
        if f(xr) * f(xi) > 0:
            xi = xr
        else:
            xu = xr
    
    return {
        "function": "f(x) = (e^(4x) * 3/2) + x^2 - (3/4)x - 2",
        "error": "El método diverge"
    }

@app.route('/bisection', methods=['GET'])
def bisection_result():
    result = biseccion() 
    return jsonify(result) 

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
