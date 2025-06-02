import React, { useState } from 'react';
import axios from 'axios';
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

const EulerMethod = () => {
  const [functionStr, setFunctionStr] = useState('x + y');
  const [x0, setX0] = useState(0);
  const [y0, setY0] = useState(1);
  const [h, setH] = useState(0.1);
  const [xFinal, setXFinal] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSolve = async () => {
    setError(null);
    setResult(null);
    try {
      const response = await axios.post('http://localhost:5008/solve', {
        function: functionStr,
        x0: parseFloat(x0),
        y0: parseFloat(y0),
        h: parseFloat(h),
        x_final: parseFloat(xFinal),
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error de conexión');
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Solución por Método de Euler',
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
          text: 'y',
        },
      },
    },
  };

  const getChartData = () => {
    if (!result || !result.solution) return null;

    const xValues = result.solution.x_values;
    const yValues = result.solution.y_values;

    return {
      labels: xValues.map(x => x.toFixed(3)),
      datasets: [
        {
          label: 'Solución Euler',
          data: yValues,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          fill: true,
        },
        {
          label: 'Puntos de aproximación',
          data: yValues,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgb(239, 68, 68)',
          borderWidth: 0,
          pointRadius: 6,
          pointBackgroundColor: 'rgb(239, 68, 68)',
          showLine: false,
        },
      ],
    };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Método de Euler</h2>

      <div className="max-w-md mx-auto mb-6">
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Función dy/dx:</label>
            <input
              type="text"
              value={functionStr}
              onChange={(e) => setFunctionStr(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Ej: x + y, x*y, sin(x) + y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">x₀ (inicial):</label>
              <input
                type="number"
                step="any"
                value={x0}
                onChange={(e) => setX0(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">y₀ (inicial):</label>
              <input
                type="number"
                step="any"
                value={y0}
                onChange={(e) => setY0(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Paso (h):</label>
              <input
                type="number"
                step="any"
                value={h}
                onChange={(e) => setH(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">x final:</label>
              <input
                type="number"
                step="any"
                value={xFinal}
                onChange={(e) => setXFinal(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <button
            onClick={handleSolve}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Resolver
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}

      {result && (
        <div className="mt-6">
          {/* Información del resultado */}
          <h3 className="text-xl font-semibold mb-2">Resultado:</h3>
          <div className="bg-gray-50 p-4 rounded mb-6">
            <p><strong>Método:</strong> {result.method}</p>
            <p><strong>Función:</strong> dy/dx = {result.function}</p>
            <p><strong>Iteraciones:</strong> {result.iterations}</p>
            <p><strong>Valor final:</strong> y({result.final_value.x.toFixed(6)}) = {result.final_value.y.toFixed(6)}</p>
          </div>

          {/* Tabla de iteraciones */}
          <h4 className="text-lg font-semibold mb-2">Tabla de iteraciones</h4>
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2">Paso</th>
                  <th className="border px-3 py-2">x</th>
                  <th className="border px-3 py-2">y</th>
                  <th className="border px-3 py-2">f(x,y) = dy/dx</th>
                  <th className="border px-3 py-2">y siguiente</th>
                </tr>
              </thead>
              <tbody>
                {result.iterations_detail.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border px-3 py-1 text-center">{row.step}</td>
                    <td className="border px-3 py-1">{row.x}</td>
                    <td className="border px-3 py-1">{row.y}</td>
                    <td className="border px-3 py-1">
                      {row.slope !== null ? row.slope : '—'}
                    </td>
                    <td className="border px-3 py-1">
                      {row.y_next !== null ? row.y_next : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gráfico */}
          <h3 className="text-xl font-semibold mb-4">Gráfico de la solución:</h3>
          <div className="bg-white p-4 border rounded">
            <Line options={chartOptions} data={getChartData()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EulerMethod;