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
    <div style={{ maxWidth: '800px', margin: 'auto' }}>
      <h2>Método de la Secante</h2>
      <form onSubmit={handleSubmit}>
        <label>Función:</label>
        <input type="text" name="function" value={formData.function} onChange={handleChange} required />

        <label>x₀:</label>
        <input type="number" name="x0" step="any" value={formData.x0} onChange={handleChange} required />

        <label>x₁:</label>
        <input type="number" name="x1" step="any" value={formData.x1} onChange={handleChange} required />

        <label>Tolerancia:</label>
        <input type="number" name="tolerance" step="any" value={formData.tolerance} onChange={handleChange} required />

        <label>Iteraciones máximas:</label>
        <input type="number" name="max_iterations" value={formData.max_iterations} onChange={handleChange} required />

        <button type="submit">Calcular</button>
      </form>

      {result && (
        <div>
          <h3>Resultado:</h3>
          {result.root !== undefined ? (
            <p>Raíz aproximada: <strong>{result.root}</strong></p>
          ) : (
            <p style={{ color: 'red' }}>{result.error}</p>
          )}

          {result.iterations_detail && (
            <>
              <h4>Tabla de Iteraciones:</h4>
              <table border="1" cellPadding="8">
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
                      <td>{it.x0}</td>
                      <td>{it.x1}</td>
                      <td>{it.x2}</td>
                      <td>{it.fx0}</td>
                      <td>{it.fx1}</td>
                      <td>{it.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {chartData && (
            <>
              <h4>Gráfica de Aproximaciones:</h4>
              <Line data={chartData} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SecantMethod;
