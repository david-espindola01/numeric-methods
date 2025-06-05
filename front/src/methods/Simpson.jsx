import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from 'recharts';
import '../styles/base-styles.css';
import MathCalculator from '../components/MathCalculator';

const SimpsonMethod = () => {
  const [functionStr, setFunctionStr] = useState('x**2');
  const [a, setA] = useState('0');
  const [b, setB] = useState('2');
  const [n, setN] = useState('4');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:5008/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: functionStr,
          a,
          b,
          n
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al calcular la integral');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Error desconocido');
    }
  };

  // Función para insertar desde la calculadora
  const handleFunctionInsert = (val) => setFunctionStr(val);

  return (
    <div className="section-container">
      <div className="card">
        <h2 className="section-title text-center">Calculadora – Regla de Simpson 1/3</h2>

        <form onSubmit={handleSubmit} className="input-section">
          <div className="input-group">
            <label htmlFor="functionStr" className="input-label">Función f(x):</label>
            <div className="function-input-overlay-container">
              <input
                id="functionStr"
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
              <label htmlFor="a" className="input-label">Límite inferior (a):</label>
              <input
                id="a"
                value={a}
                onChange={(e) => setA(e.target.value)}
                className="input-field"
                type="number"
                step="any"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="b" className="input-label">Límite superior (b):</label>
              <input
                id="b"
                value={b}
                onChange={(e) => setB(e.target.value)}
                className="input-field"
                type="number"
                step="any"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="n" className="input-label">Número de subintervalos (n):</label>
              <input
                id="n"
                value={n}
                onChange={(e) => setN(e.target.value)}
                className="input-field"
                type="number"
                step="2"
                required
              />
            </div>
          </div>

          <button type="submit" className="primary-button">
            Calcular
          </button>
        </form>

        {error && <p className="error-message mt-4">{error}</p>}

        {result && (
          <>
            <div className="results-section mt-8">
              <h3 className="section-title">Resultado:</h3>
              <p>Integral aproximada por la Regla de Simpson 1/3: <strong>{result.integral.toFixed(6)}</strong></p>
              <p className="text-sm text-gray-600 mt-1">{result.formula_explanation}</p>
            </div>

            {result.graph_data && (
              <div className="chart-section mt-10">
                <h3 className="section-title">Gráfico de f(x)</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={result.graph_data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="function"
                        stroke="#7b2cbf"
                        fill="#b197fc"
                        fillOpacity={0.4}
                        name="Área bajo f(x)"
                      />
                      <Line
                        type="monotone"
                        dataKey="function"
                        stroke="#5a189a"
                        dot={false}
                        name="f(x)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {result.table_data && (
              <div className="table-section mt-10">
                <h3 className="section-title">Tabla de Evaluación</h3>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>i</th>
                        <th>xᵢ</th>
                        <th>f(xᵢ)</th>
                        <th>Coef.</th>
                        <th>Contribución</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.table_data.map((row) => (
                        <tr key={row.i}>
                          <td>{row.i}</td>
                          <td>{row.x.toFixed(6)}</td>
                          <td>{row.fx.toFixed(6)}</td>
                          <td>{row.coefficient}</td>
                          <td>{row.weighted.toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SimpsonMethod;
