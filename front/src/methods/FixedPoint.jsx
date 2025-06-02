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
import '../styles/FixedPoint.css';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

function FixedPoint() {
  const [functionStr, setFunctionStr] = useState('');
  const [x0, setX0] = useState('');
  const [tolerance, setTolerance] = useState('1e-6');
  const [maxIterations, setMaxIterations] = useState('100');
  const [result, setResult] = useState(null);
  const [iterations, setIterations] = useState([]);
  const [error, setError] = useState(null);

  // Función para formatear la expresión para mostrar al usuario
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

  // Función para manejar la inserción desde la calculadora
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
      x0: parseFloat(x0),
      tolerance: parseFloat(tolerance),
      max_iterations: parseInt(maxIterations),
    };

    try {
      const response = await fetch('http://localhost:5002/solve', {
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
        label: 'Aproximaciones xₙ',
        data: iterations.map((row) => row.x),
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
    <div className="fixed-point-container">
      <h2 className="fixed-point-title">🔢 Método de Punto Fijo</h2>
      
      <form className="fixed-point-form" onSubmit={handleSubmit}>
        <div className="function-input-group">
          <label className="function-label">Función g(x):</label>
          <div className="function-input-container">
            <input
              className="function-input"
              type="text"
              placeholder="g(x) = "
              value={formatMathExpression(functionStr)}
              onChange={(e) => setFunctionStr(e.target.value)}
              required
              readOnly
            />
            <MathCalculator 
              onInsert={handleFunctionInsert}
              placeholder="Abrir Calculadora"
            />
          </div>
        </div>
        
        <div className="inline-inputs-group">
          <input
            className="input-field"
            type="number"
            placeholder="Valor inicial x₀"
            value={x0}
            onChange={(e) => setX0(e.target.value)}
            required
            step="any"
          />
          <input
            className="input-field"
            type="number"
            step="any"
            placeholder="Tolerancia (ej: 1e-6)"
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
        
        <button className="calculate-button" type="submit">
          🚀 Calcular Punto Fijo
        </button>
      </form>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="results-section">
          <h3 className="results-title">📊 Resultado</h3>
          {result.error ? (
            <div className="error-message">{result.error}</div>
          ) : (
            <ul className="results-list">
              <li className="results-item">
                <strong>🔧 Función g(x):</strong> {formatMathExpression(result.function)}
              </li>
              <li className="results-item">
                <strong>🎯 Raíz encontrada:</strong> {result.root}
              </li>
              <li className="results-item">
                <strong>🔄 Iteraciones realizadas:</strong> {result.iterations}
              </li>
              <li className="results-item">
                <strong>📏 Error final:</strong> {result.error}
              </li>
            </ul>
          )}
        </div>
      )}

      {iterations.length > 0 && (
        <div className="iterations-section">
          <h3 className="iterations-title">📋 Tabla de Iteraciones</h3>
          <table className="iterations-table">
            <thead>
              <tr>
                <th>Iteración</th>
                <th>xₙ</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {iterations.map((row, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{parseFloat(row.x).toFixed(8)}</td>
                  <td>{parseFloat(row.error).toExponential(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="chart-section">
            <h3 className="chart-title">📈 Gráfica de Convergencia</h3>
            <div className="chart-container">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FixedPoint;