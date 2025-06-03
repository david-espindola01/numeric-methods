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
import '../styles/base-styles.css';

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

  // Para insertar desde la calculadora
  const handleFunctionInsert = (mathExpression) => {
    setFunctionStr(mathExpression);
  };

  return (
    <>
      <h2 className="section-title">
        <span className="icon" role="img" aria-label="icono">🔢</span>
        Método de Euler
      </h2>
      <div className="section-container">
        <form
          onSubmit={e => { e.preventDefault(); handleSolve(); }}
          className="input-section"
        >
          <div className="input-group">
            <label className="input-label">Función dy/dx:</label>
            <div className="function-input-container">
              <input
                type="text"
                value={functionStr}
                onChange={(e) => setFunctionStr(e.target.value)}
                className="input-field"
                placeholder="Ej: x + y, x*y, sin(x) + y"
                required
                readOnly
              />
              <div>
                <MathCalculator onInsert={handleFunctionInsert} />
              </div>
            </div>
          </div>
          <div className="inline-inputs-group">
            <input
              className="input-field"
              type="number"
              step="any"
              placeholder="x₀ (inicial)"
              value={x0}
              onChange={(e) => setX0(e.target.value)}
              required
            />
            <input
              className="input-field"
              type="number"
              step="any"
              placeholder="y₀ (inicial)"
              value={y0}
              onChange={(e) => setY0(e.target.value)}
              required
            />
            <input
              className="input-field"
              type="number"
              step="any"
              placeholder="Paso (h)"
              value={h}
              onChange={(e) => setH(e.target.value)}
              required
            />
            <input
              className="input-field"
              type="number"
              step="any"
              placeholder="x final"
              value={xFinal}
              onChange={(e) => setXFinal(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="primary-button"
          >
            Resolver
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {result && (
          <div className="section-container results-section">
            <h3 className="section-title">Resultado</h3>
            <ul className="results-list">
              <li className="result-item"><strong>Método:</strong> {result.method}</li>
              <li className="result-item"><strong>Función:</strong> dy/dx = {result.function}</li>
              <li className="result-item"><strong>Iteraciones:</strong> {result.iterations}</li>
              <li className="result-item"><strong>Valor final:</strong> y({result.final_value.x.toFixed(6)}) = {result.final_value.y.toFixed(6)}</li>
            </ul>

            <h4 className="section-title table-section">Tabla de iteraciones</h4>
            <table className="data-table">
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

            <div className="section-container chart-section">
              <h3 className="section-title">Gráfico de la solución</h3>
              <div className="chart-container">
                <Line options={chartOptions} data={getChartData()} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EulerMethod;