import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import '../styles/base-styles.css';

const TrapezoidMethod = () => {
  const [functionStr, setFunctionStr] = useState('x**2');
  const [a, setA] = useState('0');
  const [b, setB] = useState('2');
  const [n, setN] = useState('4');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setGraphData(null);
    setIsLoading(true);

    try {
      if (!functionStr || !a || !b || !n) {
        throw new Error('Todos los campos son obligatorios');
      }

      const response = await fetch('http://localhost:5010/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          function: functionStr,
          a,
          b,
          n
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al calcular la integral');
      }

      setResult(data);
      generateGraph(data);

    } catch (err) {
      setError(err.message || 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const generateGraph = (data) => {
    try {
      const { interval, tabla } = data;
      const [aVal, bVal] = interval;

      const numPoints = 200;
      const step = (bVal - aVal) / numPoints;
      const curveData = [];

      for (let i = 0; i <= numPoints; i++) {
        const x = aVal + i * step;
        try {
          const y = evaluateFunction(functionStr, x);
          if (isFinite(y)) {
            curveData.push({ x: parseFloat(x.toFixed(6)), y: parseFloat(y.toFixed(6)), function: y });
          }
        } catch (error) {
          console.warn(`Error evaluando en x=${x}:`, error.message);
        }
      }

      const trapezoidPoints = tabla.map(row => ({
        x: row.x_i,
        y: row["f(x_i)"],
        trapezoid: row["f(x_i)"]
      }));

      const combinedData = curveData.map(point => {
        const trapPoint = trapezoidPoints.find(tp => Math.abs(tp.x - point.x) < 0.001);
        return {
          ...point,
          trapezoid: trapPoint ? trapPoint.trapezoid : null
        };
      });

      setGraphData({
        curveData: combinedData,
        trapezoidPoints
      });
    } catch (error) {
      setError(`Error generando gráfica: ${error.message}`);
    }
  };

  return (
<<<<<<< Updated upstream
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-4xl font-bold mb-8 text-center text-blue-800 flex items-center justify-center gap-3">
          <span className="text-5xl">∫</span>
          Regla del Trapecio
        </h2>

        <div className="space-y-6 bg-gray-50 p-6 rounded-lg mb-8">
          <div>
            <label className="block font-medium text-gray-700 mb-3 text-lg">Función f(x):</label>
=======
    <>
      <h2 className="section-title">
        <span className="icon" role="img" aria-label="icono">🔢</span>
        Regla del Trapecio
      </h2>
      <div className="section-container">
        <form onSubmit={handleSubmit} className="input-section">
          <div className="input-group">
            <label className="input-label">Función f(x):</label>
>>>>>>> Stashed changes
            <input
              className="input-field"
              type="text"
              value={functionStr}
              onChange={(e) => setFunctionStr(e.target.value)}
              placeholder="Ejemplo: x**2, sin(x), x**3 + 2*x, sqrt(x)"
              required
            />
<<<<<<< Updated upstream
            <p className="text-sm text-gray-500 mt-2">
              Funciones disponibles: sin, cos, tan, log, sqrt, exp, abs, pi, e, ** para potencias
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-medium text-gray-700 mb-2">Límite inferior (a):</label>
              <input
                type="number"
                step="any"
                value={a}
                onChange={(e) => setA(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">Límite superior (b):</label>
              <input
                type="number"
                step="any"
                value={b}
                onChange={(e) => setB(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">Subintervalos (n):</label>
              <input
                type="number"
                min="1"
                value={n}
                onChange={(e) => setN(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

=======
            <div className="input-hint">
              Funciones: sin, cos, tan, log, sqrt, exp, abs, pi, e, ** para potencias
            </div>
          </div>
          <div className="inline-inputs-group">
            <input
              className="input-field"
              type="number"
              step="any"
              placeholder="Límite inferior (a)"
              value={a}
              onChange={(e) => setA(e.target.value)}
              required
            />
            <input
              className="input-field"
              type="number"
              step="any"
              placeholder="Límite superior (b)"
              value={b}
              onChange={(e) => setB(e.target.value)}
              required
            />
            <input
              className="input-field"
              type="number"
              min="1"
              placeholder="Subintervalos (n)"
              value={n}
              onChange={(e) => setN(e.target.value)}
              required
            />
          </div>
>>>>>>> Stashed changes
          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? 'Calculando...' : 'Calcular'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {result && (
<<<<<<< Updated upstream
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-2xl font-semibold mb-4 text-green-800 flex items-center gap-2">
              <span>✅</span> Resultado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-white rounded-lg"><strong>Función:</strong> f(x) = {result.function}</div>
              <div className="p-3 bg-white rounded-lg"><strong>Intervalo:</strong> [{result.interval[0]}, {result.interval[1]}]</div>
              <div className="p-3 bg-white rounded-lg"><strong>Subintervalos:</strong> {result.subintervals}</div>
              <div className="p-3 bg-white rounded-lg"><strong>Tamaño de paso (h):</strong> {result.step_size?.toFixed(6)}</div>
              <div className="md:col-span-2 p-4 bg-green-100 rounded-lg border-2 border-green-300">
                <strong className="text-lg">Integral aproximada:</strong>
                <span className="text-2xl font-bold text-green-700 ml-3">
                  {typeof result.integral === 'number' ? result.integral.toFixed(8) : result.integral}
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg"><strong>Método:</strong> {result.method}</div>
            </div>
=======
          <div className="section-container results-section">
            <h3 className="section-title">Resultado</h3>
            <ul className="results-list">
              <li className="result-item">
                <strong>Función:</strong> f(x) = {result.function}
              </li>
              <li className="result-item">
                <strong>Intervalo:</strong> [{result.interval[0]}, {result.interval[1]}]
              </li>
              <li className="result-item">
                <strong>Subintervalos:</strong> {result.subintervals}
              </li>
              <li className="result-item">
                <strong>Tamaño de paso (h):</strong> {result.step_size?.toFixed(6)}
              </li>
              <li className="result-item">
                <strong>Integral aproximada:</strong> <span style={{ color: "#059669", fontWeight: "bold" }}>{typeof result.integral === 'number' ? result.integral.toFixed(8) : result.integral}</span>
              </li>
              <li className="result-item">
                <strong>Método:</strong> {result.method}
              </li>
            </ul>
>>>>>>> Stashed changes
          </div>
        )}

        {result?.tabla && (
          <div className="mt-10">
            <h3 className="text-xl font-semibold mb-4 text-indigo-800 flex items-center gap-2">
              <span>📋</span> Tabla de Cálculo
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-300 bg-white rounded-lg">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="p-3 border">i</th>
                    <th className="p-3 border">xᵢ</th>
                    <th className="p-3 border">f(xᵢ)</th>
                    <th className="p-3 border">Coeficiente</th>
                    <th className="p-3 border">Contribución</th>
                  </tr>
                </thead>
                <tbody>
                  {result.tabla.map((fila) => (
                    <tr key={fila.i} className="text-center hover:bg-indigo-50">
                      <td className="p-2 border">{fila.i}</td>
                      <td className="p-2 border">{fila["x_i"].toFixed(6)}</td>
                      <td className="p-2 border">{fila["f(x_i)"].toFixed(6)}</td>
                      <td className="p-2 border">{fila.coeficiente}</td>
                      <td className="p-2 border">{fila.contribucion.toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {graphData && (
          <div className="section-container chart-section">
            <h3 className="section-title">Gráfica de la Función y Aproximación</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={graphData.curveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    scale="linear"
                    domain={['dataMin', 'dataMax']}
                    label={{ value: 'x', position: 'insideBottom', offset: -5 }}
                    stroke="#4f46e5"
                  />
                  <YAxis
                    label={{ value: 'f(x)', angle: -90, position: 'insideLeft' }}
                    stroke="#4f46e5"
                  />
                  <Tooltip
                    formatter={(value, name) => [value.toFixed(6), name]}
                    labelFormatter={(x) => `x = ${x.toFixed(6)}`}
                    contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="function"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="rgba(59, 130, 246, 0.1)"
                    name={`f(x) = ${functionStr}`}
                  />
                  <Line
                    type="linear"
                    dataKey="trapezoid"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ fill: '#dc2626', strokeWidth: 2, r: 6 }}
                    connectNulls={false}
                    name="Puntos del Trapecio"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="chart-hint">
                <p>La línea roja muestra los puntos utilizados para la aproximación trapezoidal.</p>
                <p>El área sombreada representa la función original f(x) = {functionStr}</p>
              </div>
            </div>
          </div>
        )}
<<<<<<< Updated upstream
=======

        <div className="section-container info-section">
          <h4 className="section-title">ℹ️ Información sobre la Regla del Trapecio</h4>
          <p>
            La regla del trapecio es un método de integración numérica que aproxima el área bajo una curva
            dividiendo el intervalo en subintervalos y aproximando cada subintervalo con un trapecio.
            La fórmula es: <strong>∫f(x)dx ≈ (h/2)[f(a) + 2∑f(xi) + f(b)]</strong>, donde h = (b-a)/n.
          </p>
        </div>
>>>>>>> Stashed changes
      </div>
    </>
  );
};

export default TrapezoidMethod;
