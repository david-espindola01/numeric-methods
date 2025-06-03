import React, { useState } from 'react';
import axios from 'axios';
// Importar los estilos base
import '../styles/base-styles.css';

const GaussSeidelMethod = () => {
  const [matrixSize, setMatrixSize] = useState(3);
  const [A, setA] = useState([
    [10, -1, 2],
    [-1, 11, -1],
    [2, -1, 10],
  ]);
  const [b, setB] = useState([6, 25, -11]);
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
      const response = await axios.post('http://localhost:5007/solve', {
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
    <div className="section-container max-w-5xl mx-auto">
      <h2 className="section-title">Método de Gauss-Seidel</h2>

      <div className="input-section mb-4">
        <label className="input-label block mb-1">Tamaño de la matriz:</label>
        <select
          value={matrixSize}
          onChange={handleSizeChange}
          className="input-field"
        >
          {[2, 3, 4, 5].map((size) => (
            <option key={size} value={size}>
              {size}x{size}
            </option>
          ))}
        </select>
      </div>

      <div className="inline-inputs-group grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Matriz A:</h3>
          <table className="data-table border">
            <tbody>
              {A.map((row, i) => (
                <tr key={i}>
                  {row.map((value, j) => (
                    <td key={j}>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleChangeA(i, j, e.target.value)}
                        className="input-field w-16"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Vector b:</h3>
          <table className="data-table border">
            <tbody>
              {b.map((value, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleChangeB(i, e.target.value)}
                      className="input-field w-16"
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
        className="primary-button mt-4"
      >
        Resolver
      </button>

      {error && <p className="error-message">{error}</p>}

      {result && (
        <div className="results-section mt-6">
          <h3 className="section-title text-xl mb-2">Resultado:</h3>
          <ul className="results-list">
            <li className="result-item">
              <strong>Solución:</strong> [{result.solution.map((x) => x.toFixed(6)).join(', ')}]
            </li>
            <li className="result-item">
              <strong>Iteraciones:</strong> {result.iterations}
            </li>
          </ul>

          <h4 className="section-title text-lg mb-2 table-section">Tabla de iteraciones</h4>
          <div className="overflow-x-auto">
            <table className="data-table min-w-full border text-sm">
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
  );
};

export default GaussSeidelMethod;