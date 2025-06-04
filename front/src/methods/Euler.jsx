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
import MathCalculator from '../components/MathCalculator';
// Importar los estilos base
//import '../styles/base-styles.css';

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

  const handleFunctionInsert = (mathExpression) => {
    setFunctionStr(mathExpression);
  };

  return (
    <div>
      <h2 className="section-title">🔢 Método de Euler</h2>
      <div className="section-container max-w-6xl mx-auto">
        <div className="input-section max-w-md mx-auto mb-6">
          <div className="space-y-4">
            <div className="input-group">
              <div className="function-input-overlay-container">
                <label className="input-label">Función dy/dx:</label>
                <input
                  type="text"
                  value={functionStr}
                  className="input-field function-input-full"
                  placeholder="Ej: x + y, x*y, sin(x) + y"
                  readOnly
                />
                <div className="function-calculator-overlay">
                  <MathCalculator
                    onInsert={handleFunctionInsert}
                    placeholder=""
                    value={functionStr}
                  />
                </div>
              </div>
            </div>

            <div className="inline-inputs-group">
              <div className="input-group">
                <label className="input-label">x₀ (inicial):</label>
                <input
                  type="number"
                  step="any"
                  value={x0}
                  onChange={(e) => setX0(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label className="input-label">y₀ (inicial):</label>
                <input
                  type="number"
                  step="any"
                  value={y0}
                  onChange={(e) => setY0(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="inline-inputs-group">
              <div className="input-group">
                <label className="input-label">Paso (h):</label>
                <input
                  type="number"
                  step="any"
                  value={h}
                  onChange={(e) => setH(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label className="input-label">x final:</label>
                <input
                  type="number"
                  step="any"
                  value={xFinal}
                  onChange={(e) => setXFinal(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <button
              onClick={handleSolve}
              className="primary-button"
            >
              Resolver
            </button>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        {result && (
          <div className="results-section mt-6">
            {/* Información del resultado */}
            <h3 className="section-title text-xl mb-2">Resultado:</h3>
            <div className="bg-gray-50 p-4 rounded mb-6">
              <ul className="results-list">
                <li className="result-item"><strong>Método:</strong> {result.method}</li>
                <li className="result-item"><strong>Función:</strong> dy/dx = {result.function}</li>
                <li className="result-item"><strong>Iteraciones:</strong> {result.iterations}</li>
                <li className="result-item"><strong>Valor final:</strong> y({result.final_value.x.toFixed(6)}) = {result.final_value.y.toFixed(6)}</li>
              </ul>
            </div>

            {/* Tabla de iteraciones */}
            <h4 className="section-title text-lg mb-2 table-section">Tabla de iteraciones</h4>
            <div className="overflow-x-auto mb-8">
              <table className="data-table min-w-full border text-sm">
                <thead>
                  <tr>
                    <th>Paso</th>
                    <th>x</th>
                    <th>y</th>
                    <th>f(x,y) = dy/dx</th>
                    <th>y siguiente</th>
                  </tr>
                </thead>
                <tbody>
                  {result.iterations_detail.map((row, i) => (
                    <tr key={i}>
                      <td>{row.step}</td>
                      <td>{row.x}</td>
                      <td>{row.y}</td>
                      <td>
                        {row.slope !== null ? row.slope : '—'}
                      </td>
                      <td>
                        {row.y_next !== null ? row.y_next : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Gráfico */}
            <h3 className="section-title text-xl mb-4 chart-section">Gráfico de la solución:</h3>
            <div className="chart-container bg-white p-4 border rounded">
              <Line options={chartOptions} data={getChartData()} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EulerMethod;