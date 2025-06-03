import React, { useState } from 'react';
import axios from 'axios';
import '../styles/base-styles.css';

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
<<<<<<< Updated upstream
    <div className="section-container max-w-5xl mx-auto p-4">
      <h2 className="section-title text-2xl font-bold mb-6 text-center">Método de Jacobi</h2>

      <div className="mb-6">
        <label className="block font-medium mb-2">Tamaño de la matriz:</label>
        <select
          value={matrixSize}
          onChange={handleSizeChange}
          className="input-field border rounded px-4 py-2 w-full max-w-xs"
        >
          {[2, 3, 4, 5].map((size) => (
            <option key={size} value={size}>
              {size}x{size}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold text-lg mb-3">Matriz A:</h3>
          <table className="border border-gray-300">
            <tbody>
              {A.map((row, i) => (
                <tr key={i}>
                  {row.map((value, j) => (
                    <td key={j} className="p-1">
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleChangeA(i, j, e.target.value)}
                        className="input-field w-16 p-1 border border-gray-300 rounded"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-3">Vector b:</h3>
          <table className="border border-gray-300">
            <tbody>
              {b.map((value, i) => (
                <tr key={i}>
                  <td className="p-1">
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleChangeB(i, e.target.value)}
                      className="input-field w-16 p-1 border border-gray-300 rounded"
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
        className="primary-button bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow"
      >
        Resolver
      </button>

      {error && (
        <p className="error-message text-red-600 font-semibold mt-4">
          {error}
        </p>
      )}

      {result && (
        <div className="results-section mt-8">
          <h3 className="text-xl font-bold mb-4">Resultado:</h3>
          <ul className="results-list list-disc pl-5 mb-6">
            <li>
              <strong>Solución:</strong> [{result.solution.map((x) => x.toFixed(6)).join(', ')}]
            </li>
            <li>
              <strong>Iteraciones:</strong> {result.iterations}
            </li>
          </ul>

          <h4 className="text-lg font-semibold mb-2">Tabla de iteraciones</h4>
          <div className="overflow-x-auto">
            <table className="data-table min-w-full border border-gray-300 text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border">Iteración</th>
                  <th className="px-3 py-2 border">x (anterior)</th>
                  <th className="px-3 py-2 border">x (nuevo)</th>
                  <th className="px-3 py-2 border">Error</th>
                </tr>
              </thead>
              <tbody>
                {result.iterations_detail.map((row, i) => (
                  <tr key={i} className="even:bg-gray-50">
                    <td className="px-3 py-2 border">{row.iteration}</td>
                    <td className="px-3 py-2 border">
                      [{row.x.map((v) => v.toFixed(6)).join(', ')}]
                    </td>
                    <td className="px-3 py-2 border">
                      [{row.x_new.map((v) => v.toFixed(6)).join(', ')}]
                    </td>
                    <td className="px-3 py-2 border">
                      {row.error.toExponential(3)}
                    </td>
=======
    <>
      <h2 className="section-title">
        <span className="icon" role="img" aria-label="icono">🔢</span>
        Método de Jacobi
      </h2>
      <div className="section-container max-w-5xl mx-auto">
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
>>>>>>> Stashed changes
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
    </>
  );
};

export default JacobiMethod;
