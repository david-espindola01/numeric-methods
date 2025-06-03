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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:5009/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: functionStr,
          a,
          b,
          n
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al calcular la integral');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Error desconocido');
    }
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
          <>
            <div className="mt-8 bg-purple-50 p-4 rounded shadow">
              <h3 className="text-xl font-semibold text-purple-800 mb-2">Resultado:</h3>
              <p>Integral aproximada por la Regla de Simpson 1/3: <strong>{result.integral.toFixed(6)}</strong></p>
              <p className="text-sm text-gray-600 mt-1">{result.formula_explanation}</p>
            </div>

            {result.graph_data && (
              <div className="mt-10">
                <h3 className="text-lg font-medium mb-3 text-gray-700">Gráfico de f(x)</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={result.graph_data}>
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

            {result.table_data && (
              <div className="mt-10">
                <h3 className="text-lg font-medium mb-3 text-gray-700">Tabla de Evaluación</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-gray-300 bg-white rounded-lg">
                    <thead className="bg-purple-100">
                      <tr>
                        <th className="p-2 border">i</th>
                        <th className="p-2 border">xᵢ</th>
                        <th className="p-2 border">f(xᵢ)</th>
                        <th className="p-2 border">Coef.</th>
                        <th className="p-2 border">Contribución</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.table_data.map((row) => (
                        <tr key={row.i} className="text-center hover:bg-purple-50">
                          <td className="p-2 border">{row.i}</td>
                          <td className="p-2 border">{row.x.toFixed(6)}</td>
                          <td className="p-2 border">{row.fx.toFixed(6)}</td>
                          <td className="p-2 border">{row.coefficient}</td>
                          <td className="p-2 border">{row.weighted.toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SimpsonMethod;
