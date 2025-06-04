import React, { useState } from 'react';
import axios from 'axios';
//import '../styles/base-styles.css';

const JacobiMethod = () => {
  const [matrixSize, setMatrixSize] = useState(3);
  const [A, setA] = useState([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]);
  const [b, setB] = useState([0, 0, 0]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChangeA = (i, j, value) => {
    const updated = [...A];
    updated[i][j] = parseFloat(value);
    setA(updated);
  };

  const handleChangeB = (i, value) => {
    const updated = [...b];
    updated[i] = parseFloat(value);
    setB(updated);
  };

  const handleSizeChange = (e) => {
    const size = parseInt(e.target.value);
    setMatrixSize(size);
    setA(Array(size).fill().map(() => Array(size).fill(0)));
    setB(Array(size).fill(0));
    setResult(null);
  };

  const handleSolve = async () => {
    setError(null);
    setResult(null);
    try {
      const response = await axios.post('http://localhost:5006/solve', {
        A,
        b,
        tolerance: 1e-6,
        max_iterations: 100,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error de conexión');
    }
  };

  return (
    <div>
      <h2 className="section-title">🔢 Método de Jacobi</h2>
      <div className="section-container">
        <div className="input-group">
          <label className="input-label">Tamaño de la matriz:</label>
          <select
            value={matrixSize}
            onChange={handleSizeChange}
            className="input-field"
            style={{ maxWidth: 120 }}
          >
            {[2, 3, 4, 5].map((size) => (
              <option key={size} value={size}>
                {size}x{size}
              </option>
            ))}
          </select>
        </div>

        <div className="inline-inputs-group" style={{ gap: '40px', marginBottom: 32 }}>
          <div>
            <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 12, borderBottom: 'none' }}>Matriz A:</h3>
            <table className="data-table" style={{ minWidth: 120 }}>
              <tbody>
                {A.map((row, i) => (
                  <tr key={i}>
                    {row.map((value, j) => (
                      <td key={j}>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => handleChangeA(i, j, e.target.value)}
                          className="input-field"
                          style={{ width: 60, padding: 4 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 12, borderBottom: 'none' }}>Vector b:</h3>
            <table className="data-table" style={{ minWidth: 60 }}>
              <tbody>
                {b.map((value, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleChangeB(i, e.target.value)}
                        className="input-field"
                        style={{ width: 60, padding: 4 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={handleSolve}
          className="primary-button"
        >
          Resolver
        </button>

        {error && (
          <p className="error-message" style={{ marginTop: 20 }}>
            {error}
          </p>
        )}

        {result && (
          <div className="results-section" style={{ marginTop: 32 }}>
            <h3 className="section-title" style={{ fontSize: '1.1rem', borderBottom: 'none' }}>Resultado:</h3>
            <ul className="results-list" style={{ marginBottom: 24 }}>
              <li className="result-item">
                <strong>Solución:</strong> [{result.solution.map((x) => x.toFixed(6)).join(', ')}]
              </li>
              <li className="result-item">
                <strong>Iteraciones:</strong> {result.iterations}
              </li>
            </ul>

            <h4 className="section-title table-section" style={{ fontSize: '1rem', borderBottom: 'none' }}>Tabla de iteraciones</h4>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 400 }}>
                <thead>
                  <tr>
                    <th>Iteración</th>
                    <th>x (anterior)</th>
                    <th>x (nuevo)</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.iterations_detail.map((row, i) => (
                    <tr key={i}>
                      <td>{row.iteration}</td>
                      <td>[{row.x.map((v) => v.toFixed(6)).join(', ')}]</td>
                      <td>[{row.x_new.map((v) => v.toFixed(6)).join(', ')}]</td>
                      <td>{row.error.toExponential(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JacobiMethod;
