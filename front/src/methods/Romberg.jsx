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
import MathCalculator from '../components/MathCalculator';

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
      const response = await fetch('http://localhost:5010/solve', {
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
    <div className="section-container max-w-6xl mx-auto">
      <h2 className="section-title text-green-700">Método de Romberg</h2>
      <p className="text-gray-600 mb-6">
        Integración numérica usando el método de Romberg con extrapolación de Richardson
      </p>

      <div className="card max-w-md mx-auto mb-6">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSolve();
          }}
          className="input-section space-y-4"
        >
          <div className="input-group">
            <label className="input-label">Función f(x):</label>
            <div className="function-input-overlay-container">
              <input
                type="text"
                value={functionStr}
                onChange={e => setFunctionStr(e.target.value)}
                className="input-field function-input-full"
                placeholder="Ej: x**2, sin(x), exp(x), x**3 + 2*x"
                required
                readOnly
              />
              <div className="function-calculator-overlay">
                <MathCalculator
                  onInsert={setFunctionStr}
                  placeholder=""
                  value={functionStr}
                />
              </div>
            </div>
          </div>

          <div className="inline-inputs-group">
            <div className="input-group">
              <label className="input-label">Límite inferior (a):</label>
              <input
                type="number"
                step="any"
                value={a}
                onChange={e => setA(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Límite superior (b):</label>
              <input
                type="number"
                step="any"
                value={b}
                onChange={e => setB(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Tolerancia:</label>
              <input
                type="number"
                step="any"
                value={tolerance}
                onChange={e => setTolerance(e.target.value)}
                className="input-field"
                placeholder="1e-6"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Máx. iteraciones:</label>
              <input
                type="number"
                value={maxIterations}
                onChange={e => setMaxIterations(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full"
          >
            {loading ? 'Calculando...' : 'Calcular Integral'}
          </button>
        </form>
      </div>

      {error && (
        <div className="error-message mt-4">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="results-section mt-6">
          <h3 className="section-title">Resultado:</h3>
          <div className="inline-results-group">
            <div><strong>Método:</strong> {result.method}</div>
            <div><strong>Función:</strong> f(x) = {result.function}</div>
            <div><strong>Intervalo:</strong> [{result.interval[0]}, {result.interval[1]}]</div>
            <div><strong>Iteraciones:</strong> {result.iterations}</div>
            <div><strong>Tolerancia:</strong> {result.tolerance}</div>
            <div>
              <strong>Convergencia:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                result.converged
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.converged ? '✓ Convergió' : '✗ No convergió'}
              </span>
            </div>
            <div>
              <strong>Valor de la integral:</strong>
              <span className="ml-2 font-mono text-blue-600">{formatNumber(result.integral)}</span>
            </div>
            {result.error && (
              <div>
                <strong>Error estimado:</strong>
                <span className="ml-2 font-mono text-orange-600">{formatNumber(result.error)}</span>
              </div>
            )}
          </div>
          {result.warning && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-orange-700"><strong>Advertencia:</strong> {result.warning}</p>
            </div>
          )}

          <h3 className="section-title mt-6">Gráfico de la función:</h3>
          <div className="chart-section bg-white p-4 border rounded mb-6">
            <Line options={chartOptions} data={getChartData()} />
            <p className="text-sm text-gray-600 mt-2 text-center">
              Área bajo la curva representa la integral ∫ f(x) dx desde {a} hasta {b}
            </p>
          </div>

          <h4 className="section-title">Tabla de Romberg</h4>
          <div className="table-section overflow-x-auto mb-8">
            <table className="data-table min-w-full border text-sm">
              <thead>
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