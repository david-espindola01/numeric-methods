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
          <div className="input-group">
            <label className="input-label">x₀:</label>
            <input
              type="number"
              name="x0"
              step="any"
              value={formData.x0}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
          <div className="input-group">
            <label className="input-label">x₁:</label>
            <input
              type="number"
              name="x1"
              step="any"
              value={formData.x1}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Tolerancia:</label>
            <input
              type="number"
              name="tolerance"
              step="any"
              value={formData.tolerance}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Iteraciones máximas:</label>
            <input
              type="number"
              name="max_iterations"
              value={formData.max_iterations}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
        </div>
        <button type="submit" className="primary-button mt-4">Calcular</button>
      </form>

      {result && (
        <div className="results-section mt-6">
          <h3 className="section-title text-xl mb-2">Resultado:</h3>
          {result.root !== undefined ? (
            <p className="result-item">Raíz aproximada: <strong>{result.root}</strong></p>
          ) : (
            <p className="error-message">{result.error}</p>
          )}

          {result.iterations_detail && (
            <>
              <h4 className="section-title text-lg mb-2 table-section">Tabla de Iteraciones:</h4>
              <div className="overflow-x-auto">
                <table className="data-table min-w-full border text-sm">
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
                        <td>{Number(it.x0).toFixed(4)}</td>
                        <td>{Number(it.x1).toFixed(4)}</td>
                        <td>{Number(it.x2).toFixed(4)}</td>
                        <td>{Number(it.fx0).toFixed(4)}</td>
                        <td>{Number(it.fx1).toFixed(4)}</td>
                        <td>{Number(it.error).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {chartData && (
            <>
              <h4 className="section-title text-xl mb-4 chart-section">Gráfica de Aproximaciones:</h4>
              <div className="chart-container bg-white p-4 border rounded">
                <Line data={chartData} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SecantMethod;
