import React, { useState } from 'react';
import axios from 'axios';

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
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Método de Gauss-Seidel</h2>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Tamaño de la matriz:</label>
        <select
          value={matrixSize}
          onChange={handleSizeChange}
          className="p-2 border rounded"
        >
          {[2, 3, 4, 5].map((size) => (
            <option key={size} value={size}>
              {size}x{size}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Matriz A:</h3>
          <table className="border">
            <tbody>
              {A.map((row, i) => (
                <tr key={i}>
                  {row.map((value, j) => (
                    <td key={j} className="border p-1">
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleChangeA(i, j, e.target.value)}
                        className="w-16 p-1 border rounded"
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
          <table className="border">
            <tbody>
              {b.map((value, i) => (
                <tr key={i}>
                  <td className="border p-1">
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleChangeB(i, e.target.value)}
                      className="w-16 p-1 border rounded"
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
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Resolver
      </button>

      {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}

      {result && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Resultado:</h3>
          <p>
            <strong>Solución:</strong> [{result.solution.map((x) => x.toFixed(6)).join(', ')}]
          </p>
          <p>
            <strong>Iteraciones:</strong> {result.iterations}
          </p>

          <h4 className="text-lg font-semibold mt-4 mb-2">Tabla de iteraciones</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2">Iteración</th>
                  <th className="border px-3 py-2">x (anterior)</th>
                  <th className="border px-3 py-2">x (nuevo)</th>
                  <th className="border px-3 py-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {result.iterations_detail.map((row, i) => (
                  <tr key={i}>
                    <td className="border px-3 py-1 text-center">{row.iteration}</td>
                    <td className="border px-3 py-1">[{row.x.map((v) => v.toFixed(6)).join(', ')}]</td>
                    <td className="border px-3 py-1">[{row.x_new.map((v) => v.toFixed(6)).join(', ')}]</td>
                    <td className="border px-3 py-1">{row.error.toExponential(3)}</td>
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