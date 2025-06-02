import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from 'recharts';

const SimpsonMethod = () => {
  const [functionStr, setFunctionStr] = useState('x**2');
  const [a, setA] = useState('0');
  const [b, setB] = useState('2');
  const [n, setN] = useState('4');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState(null);

  const evaluateFunction = (functionStr, x) => {
    try {
      let expr = functionStr
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/log/g, 'Math.log')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/exp/g, 'Math.exp')
        .replace(/abs/g, 'Math.abs')
        .replace(/\*\*/g, '**')
        .replace(/\^/g, '**')
        .replace(/pi/g, 'Math.PI')
        .replace(/e(?![a-zA-Z])/g, 'Math.E');

      expr = expr.replace(/(?<!Math\.)x/g, `(${x})`);
      return Function(`"use strict"; return (${expr})`)();
    } catch (error) {
      throw new Error(`Error evaluando función en x=${x}: ${error.message}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setGraphData(null);

    try {
      if (!functionStr || !a || !b || !n) {
        throw new Error('Todos los campos son obligatorios');
      }

      const nValue = parseInt(n);
      if (nValue <= 0 || nValue % 2 !== 0) {
        throw new Error('El número de subintervalos (n) debe ser par y mayor que 0');
      }

      evaluateFunction(functionStr, parseFloat(a));

      const res = calculateSimpson(functionStr, parseFloat(a), parseFloat(b), nValue);
      setResult(res);
      generateGraph(functionStr, parseFloat(a), parseFloat(b));

    } catch (err) {
      setError(err.message || 'Error desconocido');
    }
  };

  const calculateSimpson = (funcStr, a, b, n) => {
    const h = (b - a) / n;
    let sum = evaluateFunction(funcStr, a) + evaluateFunction(funcStr, b);

    for (let i = 1; i < n; i += 2) {
      sum += 4 * evaluateFunction(funcStr, a + i * h);
    }

    for (let i = 2; i < n; i += 2) {
      sum += 2 * evaluateFunction(funcStr, a + i * h);
    }

    return {
      integral: (h / 3) * sum
    };
  };

  const generateGraph = (funcStr, a, b) => {
    const numPoints = 200;
    const step = (b - a) / numPoints;
    const data = [];

    for (let i = 0; i <= numPoints; i++) {
      const x = a + i * step;
      const y = evaluateFunction(funcStr, x);
      if (isFinite(y)) {
        data.push({ x: parseFloat(x.toFixed(6)), function: parseFloat(y.toFixed(6)) });
      }
    }

    setGraphData(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-pink-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-purple-800">Calculadora – Regla de Simpson 1/3</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="functionStr" className="block text-sm font-medium text-gray-700">Función f(x):</label>
            <input
              id="functionStr"
              value={functionStr}
              onChange={(e) => setFunctionStr(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Ej: x**2 + 3*x - 5"
              required
            />
          </div>
          <div>
            <label htmlFor="a" className="block text-sm font-medium text-gray-700">Límite inferior (a):</label>
            <input
              id="a"
              value={a}
              onChange={(e) => setA(e.target.value)}
              className="w-full p-2 border rounded"
              type="number"
              step="any"
              required
            />
          </div>
          <div>
            <label htmlFor="b" className="block text-sm font-medium text-gray-700">Límite superior (b):</label>
            <input
              id="b"
              value={b}
              onChange={(e) => setB(e.target.value)}
              className="w-full p-2 border rounded"
              type="number"
              step="any"
              required
            />
          </div>
          <div>
            <label htmlFor="n" className="block text-sm font-medium text-gray-700">Número de subintervalos (n):</label>
            <input
              id="n"
              value={n}
              onChange={(e) => setN(e.target.value)}
              className="w-full p-2 border rounded"
              type="number"
              step="2"
              required
            />
          </div>

          <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
            Calcular
          </button>
        </form>

        {error && <p className="text-red-600 mt-4">{error}</p>}

        {result && (
          <div className="mt-8 bg-purple-50 p-4 rounded shadow">
            <h3 className="text-xl font-semibold text-purple-800 mb-2">Resultado:</h3>
            <p>Integral aproximada por la Regla de Simpson 1/3: <strong>{result.integral.toFixed(6)}</strong></p>
          </div>
        )}

        {graphData && (
          <div className="mt-10">
            <h3 className="text-lg font-medium mb-3 text-gray-700">Gráfico de f(x)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="function"
                  stroke="#7b2cbf"
                  fill="#b197fc"
                  fillOpacity={0.4}
                  name="Área bajo f(x)"
                />
                <Line
                  type="monotone"
                  dataKey="function"
                  stroke="#5a189a"
                  dot={false}
                  name="f(x)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpsonMethod;
