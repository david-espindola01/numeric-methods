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
import MathCalculator from '../components/MathCalculator';
import '../styles/Bisection.css';

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

  // Función para formatear la expresión matemática
  const formatMathExpression = (expression) => {
    return expression
      .replace(/\*\*(\d+)/g, (match, exp) => {
        const superscripts = {
          '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
          '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
        };
        return exp.split('').map(digit => superscripts[digit] || digit).join('');
      })
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/pi/g, 'π')
      .replace(/sqrt\(/g, '√(')
      .replace(/ln\(/g, 'ln(')
      .replace(/log\(/g, 'log(')
      .replace(/sin\(/g, 'sin(')
      .replace(/cos\(/g, 'cos(')
      .replace(/tan\(/g, 'tan(')
      .replace(/exp\(/g, 'e^(')
      .replace(/abs\(/g, '|');
  };

  const handleFunctionInsert = (mathExpression) => {
    setFunctionStr(mathExpression);
  };

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
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            weight: 'bold'
          },
          color: '#2c3e50'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#667eea',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0,0,0,0.1)',
        },
        ticks: {
          color: '#495057',
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0,0,0,0.1)',
        },
        ticks: {
          color: '#495057',
          font: {
            size: 12
          }
        }
      }
    }
  };

   return (
    <div className="section-container">
      <h2 className="section-title">Método de Bisección</h2>
      
      <form onSubmit={handleSubmit} className="input-section">
        <div className="input-group">
          <label className="input-label">Función f(x):</label>
          <div className="function-input-container">
            <input
              className="input-field"
              id="function-input"
              type="text"
              placeholder="f(x) = "
              value={formatMathExpression(functionStr)}
              onChange={(e) => setFunctionStr(e.target.value)}
              required
              readOnly
            />
            <MathCalculator 
              onInsert={handleFunctionInsert}
              buttonText="Insertar Función"
            />
          </div>
        </div>
        
        <div className="inline-inputs-group">
          <input
            className="input-field"
            type="number"
            placeholder="xᵢ"
            value={xi}
            onChange={(e) => setXi(e.target.value)}
            required
            step="any"
          />
          <input
            className="input-field"
            type="number"
            placeholder="xᵤ"
            value={xu}
            onChange={(e) => setXu(e.target.value)}
            required
            step="any"
          />
          <input
            className="input-field"
            type="number"
            step="any"
            placeholder="Tolerancia"
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
          />
          <input
            className="input-field"
            type="number"
            placeholder="Iteraciones máximas"
            value={maxIterations}
            onChange={(e) => setMaxIterations(e.target.value)}
          />
        </div>
        
        <button className="primary-button" type="submit">
          Calcular
        </button>
      </form>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="section-container results-section">
          <h3 className="section-title">Resultado</h3>
          {result.error && !result.root ? (
            <div className="error-message">{result.error}</div>
          ) : (
            <ul className="results-list">
              <li className="result-item">
                <strong>f(x):</strong> {result.function}
              </li>
              <li className="result-item">
                <strong>Raíz:</strong> {result.root}
              </li>
              <li className="result-item">
                <strong>Iteraciones:</strong> {result.iterations}
              </li>
              <li className="result-item">
                <strong>Error:</strong> {result.error}
              </li>
            </ul>
          )}
        </div>
      )}

      {iterations.length > 0 && (
        <div className="section-container">
          <h3 className="section-title">Tabla de Iteraciones</h3>
          <table className="data-table">
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

          <div className="section-container chart-section">
            <h3 className="section-title">Gráfica de Aproximaciones</h3>
            <div className="chart-container">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bisection;