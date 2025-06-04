import React, { useState } from 'react';
import axios from 'axios';
//import '../styles/base-styles.css';

const GaussSeidelMethod = () => {
  const [matrixSize, setMatrixSize] = useState(3);
  const [A, setA] = useState([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
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
    <div>
      <h2 className="section-title">🔢 Método de Gauss-Seidel</h2>
      <div className="section-container max-w-5xl mx-auto px-4 py-6">

        <div className="mb-4">
          <label className="block font-medium mb-1">Tamaño de la matriz:</label>
          <select
            value={matrixSize}
            onChange={handleSizeChange}
            className="input-field px-2 py-1 border rounded"
          >
            {[2, 3, 4, 5].map((size) => (
              <option key={size} value={size}>
                {size}x{size}
              </option>
            ))}
          </select>
        </div>

        {/* Inputs de la matriz y el vector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="font-semibold mb-2">Matriz A:</h3>
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table className="data-table border border-gray-300" style={{ minWidth: 220 }}>
                <tbody>
                  {A.map((row, i) => (
                    <tr key={i}>
                      {row.map((value, j) => (
                        <td key={j} className="p-1">
                          <input
                            type="number"
                            value={value}
                            onChange={(e) => handleChangeA(i, j, e.target.value)}
                            className="input-field"
                            style={{ width: 60, minWidth: 40, maxWidth: 80, padding: 4 }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Vector b:</h3>
            <table className="data-table border border-gray-300">
              <tbody>
                {b.map((value, i) => (
                  <tr key={i}>
                    <td className="p-1">
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleChangeB(i, e.target.value)}
                        className="input-field w-20 border px-1 py-1 rounded"
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
          className="primary-button bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Resolver
        </button>

        {error && <p className="error-message text-red-600 mt-4">{error}</p>}

        {result && (
          <div className="results-section mt-8">
            <h3 className="text-xl font-semibold mb-2">Resultado:</h3>
            <ul className="mb-4">
              <li>
                <strong>Solución:</strong> [{result.solution.map((x) => x.toFixed(6)).join(', ')}]
              </li>
              <li>
                <strong>Iteraciones:</strong> {result.iterations}
              </li>
            </ul>

            <h4 className="text-lg font-semibold mb-2">Tabla de iteraciones</h4>
            <div className="overflow-x-auto">
              <table className="data-table min-w-[700px] border border-gray-400 text-sm whitespace-nowrap">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border">Iteración</th>
                    <th className="px-2 py-1 border">x (anterior)</th>
                    <th className="px-2 py-1 border">x (nuevo)</th>
                    <th className="px-2 py-1 border">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.iterations_detail.map((row, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1 border">{row.iteration}</td>
                      <td className="px-2 py-1 border">[{row.x.map((v) => v.toFixed(6)).join(', ')}]</td>
                      <td className="px-2 py-1 border">[{row.x_new.map((v) => v.toFixed(6)).join(', ')}]</td>
                      <td className="px-2 py-1 border">{row.error.toExponential(3)}</td>
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

export default GaussSeidelMethod;
