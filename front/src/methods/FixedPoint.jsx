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
import { evaluate } from 'mathjs'; // <-- Agrega esto
import MathCalculator from '../components/MathCalculator';
import '../styles/base-styles.css';
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

function FixedPoint() {
  const [functionStr, setFunctionStr] = useState('');
  const [x0, setX0] = useState('');
  const [tolerance, setTolerance] = useState('1e-6');
  const [maxIterations, setMaxIterations] = useState('100');
  const [result, setResult] = useState(null);
  const [iterations, setIterations] = useState([]);
  const [error, setError] = useState(null);

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
      setError('Error al conectar con el servidor.',err);
    }
  };

  // Generar datos para graficar la función g(x)
  const getFunctionPlotData = () => {
    if (!functionStr) return null;
    let center = x0 ? parseFloat(x0) : 0;
    let minX = center - 5;
    let maxX = center + 5;

    // Si hay iteraciones, ajusta el rango pero con límites máximos
    if (iterations.length > 0) {
      const xs = iterations.map(row => parseFloat(row.x));
      const minIt = Math.min(...xs, minX);
      const maxIt = Math.max(...xs, maxX);
      // Limita el rango a un máximo de 20 unidades
      minX = Math.max(minIt - 2, center - 10);
      maxX = Math.min(maxIt + 2, center + 10);
    }

    // Evita rango inválido
    if (minX === maxX) {
      minX = center - 5;
      maxX = center + 5;
    }
    const step = (maxX - minX) / 100;
    if (step <= 0 || !isFinite(step)) return null;

    const points = [];
    for (let x = minX; x <= maxX; x += step) {
      try {
        const y = evaluate(functionStr, { x });
        if (typeof y === 'number' && isFinite(y)) {
          points.push({ x, y });
        }
      } catch {
        // Si hay error en la función, ignora el punto
      }
    }
    return {
      labels: points.map(p => p.x),
      datasets: [
        {
          label: 'g(x)',
          data: points.map(p => p.y),
          borderColor: '#e57373',
          backgroundColor: 'rgba(229, 115, 115, 0.1)',
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          tension: 0.25,
        }
      ]
    };
  };

  const functionPlotData = getFunctionPlotData();

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

  // Mostrar la gráfica solo si todos los campos están llenos
  const allFieldsFilled =
    functionStr.trim() !== '' &&
    x0 !== '' &&
    tolerance !== '' &&
    maxIterations !== '';

  return (
    <div>
      <h2 className="section-title">🔢 Método de Punto Fijo</h2>
      <div className="section-container">
        <form className="input-section" onSubmit={handleSubmit}>
          <div className="input-group">
            
            <div className="function-input-overlay-container">
              <label className="input-label">Función g(x):</label>
              <input
                className="input-field function-input-full"
                type="text"
                placeholder="g(x) = "
                value={formatMathExpression(functionStr)}
                onChange={(e) => setFunctionStr(e.target.value)}
                required
                readOnly
              />
              <div className="function-calculator-overlay">
                <MathCalculator 
                  onInsert={handleFunctionInsert}
                  placeholder=""
                />
              </div>
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
          
          <button className="primary-button" type="submit">
            Calcular Punto Fijo
          </button>
        </form>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {result && (
          <div className="results-section">
            <h3 className="section-title">📊 Resultado</h3>
            {result.error ? (
              <div className="error-message">{result.root}</div>
            ) : (
              <ul className="results-list">
                <li className="result-item">
                  <strong>🔧 Función g(x):</strong> {formatMathExpression(result.function)}
                </li>
                <li className="result-item">
                  <strong>🎯 Raíz encontrada:</strong> {result.root}
                </li>
                <li className="result-item">
                  <strong>🔄 Iteraciones realizadas:</strong> {result.iterations}
                </li>
                <li className="result-item">
                  <strong>📏 Error final:</strong> {result.error}
                </li>
              </ul>
            )}
          </div>
        )}

        {iterations.length > 0 && (
          <div className="table-section">
            <h3 className="section-title">📋 Tabla de Iteraciones</h3>
            <table className="data-table">
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
              <h3 className="section-title">📈 Gráfica de Convergencia</h3>
              <div className="chart-container">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {/* Gráfica de la función g(x) */}
        {allFieldsFilled && functionPlotData && (
          <div className="chart-section" style={{ minHeight: 320 }}>
            <h3 className="section-title">📉 Gráfica de la función g(x)</h3>
            <div className="chart-container">
              <Line data={functionPlotData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
                scales: {
                  x: { title: { display: true, text: 'x' } },
                  y: { title: { display: true, text: 'g(x)' } }
                }
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FixedPoint;
