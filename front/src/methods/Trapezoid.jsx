import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import MathCalculator from '../components/MathCalculator';
import '../styles/base-styles.css';

const TrapezoidMethod = () => {
  const [functionStr, setFunctionStr] = useState('x**2');
  const [a, setA] = useState('0');
  const [b, setB] = useState('2');
  const [n, setN] = useState('4');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const evaluateFunction = (functionStr, x) => {
    try {
      let expr = functionStr
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/log/g, 'Math.log')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/exp/g, 'Math.exp')
        .replace(/abs/g, 'Math.abs')
        .replace(/\*\*/g, '**')
        .replace(/\^/g, '**')
        .replace(/pi/g, 'Math.PI')
        .replace(/e(?![a-zA-Z])/g, 'Math.E');
      expr = expr.replace(/(?<!Math\.)x/g, `(${x})`);
      return Function(`"use strict"; return (${expr})`)();
    } catch (error) {
      throw new Error(`Error evaluando función en x=${x}: ${error.message}`);
    }
  };

  const handleFunctionInsert = (val) => setFunctionStr(val);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setGraphData(null);
    setIsLoading(true);

    try {
      if (!functionStr || !a || !b || !n) {
        throw new Error('Todos los campos son obligatorios');
      }

      const response = await fetch('http://localhost:5009/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          function: functionStr,
          a,
          b,
          n
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      setResult(data);
      generateGraph(data);

    } catch (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('No se pudo conectar con el servidor. Verifica que esté corriendo.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateGraph = (data) => {
    try {
      console.log('Datos recibidos:', data); // Debug data

      // Verify data structure
      if (!data) {
        throw new Error('No se recibieron datos del servidor');
      }

      // Get interval values, with fallback
      const interval = data.interval || [
        parseFloat(a), // Use form values as fallback
        parseFloat(b)
      ];
      const [aVal, bVal] = interval;

      // Generate curve points
      const numPoints = 200;
      const step = (bVal - aVal) / numPoints;
      const curveData = [];

      for (let i = 0; i <= numPoints; i++) {
        const x = aVal + i * step;
        try {
          const y = evaluateFunction(functionStr, x);
          if (isFinite(y)) {
            curveData.push({ 
              x: parseFloat(x.toFixed(6)), 
              y: parseFloat(y.toFixed(6)), 
              function: y 
            });
          }
        } catch (error) {
          console.warn(`Error evaluando punto x=${x}:`, error);
        }
      }

      // Handle trapezoid points
      let trapezoidPoints = [];
      if (data.tabla && Array.isArray(data.tabla)) {
        trapezoidPoints = data.tabla.map(row => ({
          x: row.x_i || row.x || 0,
          y: row["f(x_i)"] || row.fx || row.y || 0,
          trapezoid: row["f(x_i)"] || row.fx || row.y || 0
        }));
      } else if (data.points && Array.isArray(data.points)) {
        // Alternative data structure
        trapezoidPoints = data.points.map(row => ({
          x: row.x || 0,
          y: row.y || 0,
          trapezoid: row.y || 0
        }));
      }

      // Combine data
      const combinedData = curveData.map(point => {
        const trapPoint = trapezoidPoints.find(tp => Math.abs(tp.x - point.x) < 0.001);
        return {
          ...point,
          trapezoid: trapPoint ? trapPoint.trapezoid : null
        };
      });

      setGraphData({
        curveData: combinedData,
        trapezoidPoints
      });
    } catch (error) {
      console.error('Error en generateGraph:', error, 'Data:', data);
      setError(`Error generando gráfica: ${error.message}`);
    }
  };

  return (
    <div className="section-container">
      <div className="card">
        <h2 className="section-title text-center">Regla del Trapecio</h2>

        <form onSubmit={handleSubmit} className="input-section">
          <div className="input-group">
            <label className="input-label">Función f(x):</label>
            <div className="function-input-overlay-container">
              <input
                type="text"
                value={functionStr}
                onChange={(e) => setFunctionStr(e.target.value)}
                className="input-field function-input-full"
                placeholder="Ej: x**2 + 3*x - 5"
                required
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
              <label className="input-label">Límite inferior (a):</label>
              <input
                type="number"
                step="any"
                value={a}
                onChange={(e) => setA(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Límite superior (b):</label>
              <input
                type="number"
                step="any"
                value={b}
                onChange={(e) => setB(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Subintervalos (n):</label>
              <input
                type="number"
                min="1"
                value={n}
                onChange={(e) => setN(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !functionStr || !a || !b || !n}
            className="primary-button"
          >
            {isLoading ? '🔄 Calculando...' : '📊 Calcular Integral'}
          </button>
        </form>

        {error && (
          <div className="error-message mt-4">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="results-section mt-8">
            <h3 className="section-title">Resultado</h3>
            <div className="inline-results-group">
              <div><strong>Función:</strong> f(x) = {result.function}</div>
              <div><strong>Intervalo:</strong> [{result.interval[0]}, {result.interval[1]}]</div>
              <div><strong>Subintervalos:</strong> {result.subintervals}</div>
              <div><strong>Tamaño de paso (h):</strong> {result.step_size?.toFixed(6)}</div>
              <div><strong>Método:</strong> {result.method}</div>
              <div>
                <strong>Integral aproximada:</strong>
                <span className="text-green-700 font-bold ml-2">
                  {typeof result.integral === 'number' ? result.integral.toFixed(8) : result.integral}
                </span>
              </div>
            </div>
          </div>
        )}

        {result?.tabla && (
          <div className="table-section mt-10">
            <h3 className="section-title">Tabla de Cálculo</h3>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>i</th>
                    <th>xᵢ</th>
                    <th>f(xᵢ)</th>
                    <th>Coeficiente</th>
                    <th>Contribución</th>
                  </tr>
                </thead>
                <tbody>
                  {result.tabla.map((fila) => (
                    <tr key={fila.i}>
                      <td>{fila.i}</td>
                      <td>{fila["x_i"].toFixed(6)}</td>
                      <td>{fila["f(x_i)"].toFixed(6)}</td>
                      <td>{fila.coeficiente}</td>
                      <td>{fila.contribucion.toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {graphData && (
          <div className="chart-section mt-8">
            <h3 className="section-title">Visualización de la Función y Aproximación</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={graphData.curveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="function"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="rgba(59, 130, 246, 0.1)"
                    name={`f(x) = ${functionStr}`}
                  />
                  <Line
                    type="linear"
                    dataKey="trapezoid"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ fill: '#dc2626', strokeWidth: 2, r: 6 }}
                    connectNulls={false}
                    name="Puntos del Trapecio"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>La línea roja muestra los puntos utilizados para la aproximación trapezoidal</p>
                <p>El área sombreada representa la función original f(x) = {functionStr}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrapezoidMethod;
