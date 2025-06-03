import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RombergMethod = () => {
  const [functionStr, setFunctionStr] = useState('x**2');
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const [tolerance, setTolerance] = useState(1e-6);
  const [maxIterations, setMaxIterations] = useState(10);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSolve = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5011/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          function: functionStr,
          a: parseFloat(a),
          b: parseFloat(b),
          tolerance: parseFloat(tolerance),
          max_iterations: parseInt(maxIterations),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error del servidor');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (typeof num === 'number') {
      if (Math.abs(num) < 1e-10) return '0.000000e+00';
      return num.toExponential(6);
    }
    return num;
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Función a Integrar',
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'x',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'f(x)',
        },
      },
    },
  };

  const getChartData = () => {
    if (!result) return null;
    
    const numPoints = 100;
    const step = (parseFloat(b) - parseFloat(a)) / numPoints;
    const xValues = [];
    const yValues = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const x = parseFloat(a) + i * step;
      let y;
      
      try {
        // Evaluación básica para funciones comunes
        if (functionStr.includes('x**2')) {
          y = x * x;
        } else if (functionStr.includes('x**3')) {
          y = x * x * x;
        } else if (functionStr.includes('sin(x)')) {
          y = Math.sin(x);
        } else if (functionStr.includes('cos(x)')) {
          y = Math.cos(x);
        } else if (functionStr.includes('exp(x)')) {
          y = Math.exp(x);
        } else if (functionStr.includes('log(x)') || functionStr.includes('ln(x)')) {
          y = x > 0 ? Math.log(x) : 0;
        } else if (functionStr.includes('sqrt(x)')) {
          y = x >= 0 ? Math.sqrt(x) : 0;
        } else {
          // Para funciones lineales simples
          y = x;
        }
        xValues.push(x.toFixed(3));
        yValues.push(y);
      } catch {
        xValues.push(x.toFixed(3));
        yValues.push(0);
      }
    }

    return {
      labels: xValues,
      datasets: [
        {
          label: `f(x) = ${functionStr}`,
          data: yValues,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
        },
      ],
    };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Método de Romberg</h2>
      <p className="text-gray-600 mb-6">
        Integración numérica usando el método de Romberg con extrapolación de Richardson
      </p>

      <div className="max-w-md mx-auto mb-6">
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Función f(x):</label>
            <input
              type="text"
              value={functionStr}
              onChange={(e) => setFunctionStr(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Ej: x**2, sin(x), exp(x), x**3 + 2*x"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Límite inferior (a):</label>
              <input
                type="number"
                step="any"
                value={a}
                onChange={(e) => setA(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Límite superior (b):</label>
              <input
                type="number"
                step="any"
                value={b}
                onChange={(e) => setB(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Tolerancia:</label>
              <input
                type="number"
                step="any"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="1e-6"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Máx. iteraciones:</label>
              <input
                type="number"
                value={maxIterations}
                onChange={(e) => setMaxIterations(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <button
            onClick={handleSolve}
            disabled={loading}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Calculando...' : 'Calcular Integral'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6">
          {/* Información del resultado */}
          <h3 className="text-xl font-semibold mb-2">Resultado:</h3>
          <div className="bg-gray-50 p-4 rounded mb-6 border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Método:</strong> {result.method}</p>
                <p><strong>Función:</strong> f(x) = {result.function}</p>
                <p><strong>Intervalo:</strong> [{result.interval[0]}, {result.interval[1]}]</p>
              </div>
              <div>
                <p><strong>Iteraciones:</strong> {result.iterations}</p>
                <p><strong>Tolerancia:</strong> {result.tolerance}</p>
                <p><strong>Convergencia:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    result.converged 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.converged ? '✓ Convergió' : '✗ No convergió'}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded border">
              <p className="text-lg"><strong>Valor de la integral:</strong> 
                <span className="ml-2 font-mono text-blue-600">{formatNumber(result.integral)}</span>
              </p>
              {result.error && (
                <p className="mt-1"><strong>Error estimado:</strong> 
                  <span className="ml-2 font-mono text-orange-600">{formatNumber(result.error)}</span>
                </p>
              )}
            </div>
            {result.warning && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                <p className="text-orange-700"><strong>Advertencia:</strong> {result.warning}</p>
              </div>
            )}
          </div>

          {/* Gráfico de la función */}
          <h3 className="text-xl font-semibold mb-4">Gráfico de la función:</h3>
          <div className="bg-white p-4 border rounded mb-6">
            <Line options={chartOptions} data={getChartData()} />
            <p className="text-sm text-gray-600 mt-2 text-center">
              Área bajo la curva representa la integral ∫ f(x) dx desde {a} hasta {b}
            </p>
          </div>

          {/* Tabla de Romberg */}
          <h4 className="text-lg font-semibold mb-2">Tabla de Romberg</h4>
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full border text-sm">
              <thead className="bg-green-100">
                <tr>
                  <th className="border px-3 py-2 font-semibold">Fila (i)</th>
                  {result.romberg_table[0] && result.romberg_table[0].map((_, colIndex) => (
                    <th key={colIndex} className="border px-3 py-2 font-semibold">
                      R<sub>{colIndex},{colIndex}</sub>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.romberg_table.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border px-3 py-2 text-center font-medium bg-green-50">{rowIndex}</td>
                    {row.map((value, colIndex) => (
                      <td key={colIndex} className={`border px-2 py-1 font-mono text-xs ${
                        colIndex === rowIndex ? 'bg-green-50 font-semibold' : ''
                      }`}>
                        {formatNumber(value)}
                      </td>
                    ))}
                    {/* Llenar celdas vacías */}
                    {Array.from({ length: result.romberg_table.length - row.length }, (_, i) => (
                      <td key={`empty-${i}`} className="border px-3 py-1 bg-gray-200"></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RombergMethod;