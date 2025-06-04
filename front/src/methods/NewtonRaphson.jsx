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
// Importar los estilos base
//import '../styles/NewtonRaphson.css';
// Importar el componente Calculadora
import Calculadora from '../components/MathCalculator.jsx';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

function NewtonRaphson() {
  const [functionStr, setFunctionStr] = useState('');
  const [x0, setX0] = useState('');
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
      x0: parseFloat(x0),
      tolerance: parseFloat(tolerance),
      max_iterations: parseInt(maxIterations),
    };

    try {
      const response = await fetch('http://localhost:5003/solve', {
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
      setError('Error al conectar con el servidor.',err);
    }
  };

  const chartData = {
    labels: iterations.map((row) => row.iteration),
    datasets: [
      {
        label: 'xₙ',
        data: iterations.map((row) => row.x),
        borderColor: 'green',
        tension: 0.3,
      },
    ],
  };

  return (
    <div>
      <h2 className="section-title" >🔢 Método de Newton-Raphson</h2>
      <div className="section-container max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="input-section mb-6">
          <div className="input-group">
            <label className="input-label">Función f(x):</label>
            <div className="function-input-overlay-container">
              <input
                type="text"
                value={functionStr}
                id="function-input"
                readOnly
                className="input-field function-input-full"
                placeholder="f(x)"
                tabIndex={-1}
              />
              <div className="function-calculator-overlay">
                <Calculadora
                  value={functionStr}
                  onChange={setFunctionStr}
                  placeholder=""
                />
              </div>
            </div>
          </div>
          <div className="inline-inputs-group">
            <div className="input-group">
              <label className="input-label">x₀:</label>
              <input
                type="number"
                placeholder="x₀"
                value={x0}
                onChange={(e) => setX0(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Tolerancia:</label>
              <input
                type="number"
                step="any"
                placeholder="Tolerancia"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Iteraciones máximas:</label>
              <input
                type="number"
                placeholder="Iteraciones máximas"
                value={maxIterations}
                onChange={(e) => setMaxIterations(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <button type="submit" className="primary-button mt-4">Calcular</button>
        </form>

        {result && (
          <div className="results-section mt-6">
            <h3 className="section-title text-xl mb-2">Resultado:</h3>
            {result.error ? (
              <p className="error-message">{result.error}</p>
            ) : (
              <ul className="results-list">
                <li className="result-item"><strong>f(x):</strong> {result.function}</li>
                <li className="result-item"><strong>f'(x):</strong> {result.derivative}</li>
                <li className="result-item"><strong>Raíz:</strong> {result.root}</li>
                <li className="result-item"><strong>Iteraciones:</strong> {result.iterations}</li>
                <li className="result-item"><strong>Error:</strong> {result.error}</li>
              </ul>
            )}
          </div>
        )}

        {iterations.length > 0 && (
          <div className="results-section mt-6">
            <h4 className="section-title text-lg mb-2 table-section">Tabla de Iteraciones</h4>
            <div className="overflow-x-auto">
              <table className="data-table min-w-full border text-sm">
                <thead>
                  <tr>
                    <th>Iteración</th>
                    <th>xₙ</th>
                    <th>f(xₙ)</th>
                    <th>f'(xₙ)</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {iterations.map((row, i) => (
                    <tr key={i}>
                      <td>{row.iteration}</td>
                      <td>{row.x}</td>
                      <td>{row.fx}</td>
                      <td>{row.fpx}</td>
                      <td>{row.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="section-title text-xl mb-4 chart-section">Gráfica</h3>
            <div className="chart-container bg-white p-4 border rounded">
              <Line data={chartData} />
            </div>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default NewtonRaphson;
