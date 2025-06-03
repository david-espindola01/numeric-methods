import React, { useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip
} from 'chart.js';
// Importar los estilos base
import '../styles/base-styles.css';
import MathCalculator from '../components/MathCalculator.jsx';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip
);

const SecantMethod = () => {
  const [formData, setFormData] = useState({
    function: 'x**2 - 2',
    x0: 1,
    x1: 2,
    tolerance: 1e-6,
    max_iterations: 100
  });

  const [result, setResult] = useState(null);
  const [chartData, setChartData] = useState(null);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5004/solve', formData);
      setResult(response.data);

      // Chart Data
      if (response.data.iterations_detail) {
        const labels = response.data.iterations_detail.map(item => `Iteración ${item.iteration}`);
        const values = response.data.iterations_detail.map(item => item.x2);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Aproximación x₂',
              data: values,
              borderColor: 'blue',
              fill: false
            }
          ]
        });
      } else {
        setChartData(null);
      }

    } catch (err) {
      alert('Error al procesar la solicitud');
      setResult(null);
      setChartData(null);
    }
  };

  return (
<<<<<<< Updated upstream
    <div className="section-container max-w-4xl mx-auto">
      <h2 className="section-title">Método de la Secante</h2>
      <form onSubmit={handleSubmit} className="input-section mb-6">
        <div className="input-group">
          <label className="input-label">Función:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              value={formData.function}
              id='function-input'
              readOnly
              className="input-field bg-gray-100 cursor-not-allowed"
              placeholder="Función seleccionada"
              tabIndex={-1}
              style={{ flex: 1 }}
            />
            <MathCalculator
              onInsert={val => setFormData({ ...formData, function: val })}
              placeholder="Insertar Función"
              disabled={true}
            />
          </div>
        </div>
        <div className="inline-inputs-group">
=======
    <>
      <h2 className="section-title">
        <span className="icon" role="img" aria-label="icono">🔢</span>
        Método de la Secante
      </h2>
      <div className="section-container">
        <form onSubmit={handleSubmit} className="input-section">
>>>>>>> Stashed changes
          <div className="input-group">
            <label className="input-label">Función f(x):</label>
            <div className="function-input-container">
              <input
                className="input-field"
                type="text"
                placeholder="f(x) = "
                value={formData.function}
                readOnly
                required
              />
              <div>
                <MathCalculator
                  onInsert={val => setFormData({ ...formData, function: val })}
                />
              </div>
            </div>
          </div>
          <div className="inline-inputs-group">
            <input
              className="input-field"
              type="number"
              name="x0"
              step="any"
              placeholder="x₀"
              value={formData.x0}
              onChange={handleChange}
              required
            />
            <input
              className="input-field"
              type="number"
              name="x1"
              step="any"
              placeholder="x₁"
              value={formData.x1}
              onChange={handleChange}
              required
            />
            <input
              className="input-field"
              type="number"
              name="tolerance"
              step="any"
              placeholder="Tolerancia"
              value={formData.tolerance}
              onChange={handleChange}
              required
            />
            <input
              className="input-field"
              type="number"
              name="max_iterations"
              placeholder="Iteraciones máximas"
              value={formData.max_iterations}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="primary-button">Calcular</button>
        </form>

        {result && (
          <div className="section-container results-section">
            <h3 className="section-title">Resultado</h3>
            {result.root !== undefined ? (
              <ul className="results-list">
                <li className="result-item">
                  <strong>f(x):</strong> {formData.function}
                </li>
                <li className="result-item">
                  <strong>Raíz:</strong> {result.root}
                </li>
                <li className="result-item">
                  <strong>Iteraciones:</strong> {result.iterations_detail ? result.iterations_detail.length : '-'}
                </li>
                <li className="result-item">
                  <strong>Error:</strong> {result.error}
                </li>
              </ul>
            ) : (
              <div className="error-message">{result.error}</div>
            )}
          </div>
        )}

        {result && result.iterations_detail && (
          <div className="section-container">
            <h3 className="section-title">Tabla de Iteraciones</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Iteración</th>
                  <th>x₀</th>
                  <th>x₁</th>
                  <th>x₂</th>
                  <th>f(x₀)</th>
                  <th>f(x₁)</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {result.iterations_detail.map((it, i) => (
                  <tr key={i}>
                    <td>{it.iteration}</td>
                    <td>{Number(it.x0).toFixed(6)}</td>
                    <td>{Number(it.x1).toFixed(6)}</td>
                    <td>{Number(it.x2).toFixed(6)}</td>
                    <td>{Number(it.fx0).toExponential(3)}</td>
                    <td>{Number(it.fx1).toExponential(3)}</td>
                    <td>{Number(it.error).toExponential(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {chartData && (
              <div className="section-container chart-section">
                <h3 className="section-title">Gráfica de Aproximaciones</h3>
                <div className="chart-container">
                  <Line data={chartData} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SecantMethod;
