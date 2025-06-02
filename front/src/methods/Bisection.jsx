import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

function Bisection() {
  const [functionStr, setFunctionStr] = useState('');
  const [xi, setXi] = useState('');
  const [xu, setXu] = useState('');
  const [tolerance, setTolerance] = useState('1e-6');
  const [maxIterations, setMaxIterations] = useState('100');
  const [result, setResult] = useState(null);
  const [iterations, setIterations] = useState([]);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    setIterations([]);

    const payload = {
      function: functionStr,
      xi: parseFloat(xi),
      xu: parseFloat(xu),
      tolerance: parseFloat(tolerance),
      max_iterations: parseInt(maxIterations),
    };

    try {
      const response = await fetch('http://localhost:5001/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error desconocido');
      } else {
        setResult(data);
        setIterations(data.iterations_detail || []);
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
    }
  };

  const chartData = {
    labels: iterations.map((_, index) => index + 1),
    datasets: [
      {
        label: 'Aproximación xr',
        data: iterations.map((row) => row.xr),
        borderColor: 'green',
        tension: 0.3,
      },
    ],
  };

  return (
    <div>
      <h2>Método de Bisección</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="f(x) = "
          value={functionStr}
          onChange={(e) => setFunctionStr(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="xᵢ"
          value={xi}
          onChange={(e) => setXi(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="xᵤ"
          value={xu}
          onChange={(e) => setXu(e.target.value)}
          required
        />
        <input
          type="number"
          step="any"
          placeholder="Tolerancia"
          value={tolerance}
          onChange={(e) => setTolerance(e.target.value)}
        />
        <input
          type="number"
          placeholder="Iteraciones máximas"
          value={maxIterations}
          onChange={(e) => setMaxIterations(e.target.value)}
        />
        <button type="submit">Calcular</button>
      </form>

      {result && (
        <div>
          <h3>Resultado:</h3>
          {result.error && !result.root ? (
            <p style={{ color: 'red' }}>{result.error}</p>
          ) : (
            <ul>
              <li><strong>f(x):</strong> {result.function}</li>
              <li><strong>Raíz:</strong> {result.root}</li>
              <li><strong>Iteraciones:</strong> {result.iterations}</li>
              <li><strong>Error:</strong> {result.error}</li>
            </ul>
          )}
        </div>
      )}

      {iterations.length > 0 && (
        <div>
          <h3>Tabla de Iteraciones</h3>
          <table border="1">
            <thead>
              <tr>
                <th>Iteración</th>
                <th>xᵢ</th>
                <th>xᵤ</th>
                <th>xᵣ</th>
                <th>f(xᵣ)</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {iterations.map((row, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{row.xi.toFixed(6)}</td>
                  <td>{row.xu.toFixed(6)}</td>
                  <td>{row.xr.toFixed(6)}</td>
                  <td>{row["f(xr)"].toExponential(3)}</td>
                  <td>{row.error.toExponential(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Gráfica de Aproximaciones</h3>
          <Line data={chartData} />
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default Bisection;
