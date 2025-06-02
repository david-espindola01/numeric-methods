import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const TrapezoidMethod = () => {
  const [functionStr, setFunctionStr] = useState('x**2');
  const [a, setA] = useState('0');
  const [b, setB] = useState('2');
  const [n, setN] = useState('4');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Función mejorada para evaluar expresiones matemáticas
  const evaluateFunction = (functionStr, x) => {
    try {
      // Reemplazar funciones matemáticas comunes
      let expr = functionStr
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/log/g, 'Math.log')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/exp/g, 'Math.exp')
        .replace(/abs/g, 'Math.abs')
        .replace(/\*\*/g, '**') // Mantener potencias
        .replace(/\^/g, '**')   // Convertir ^ a **
        .replace(/pi/g, 'Math.PI')
        .replace(/e(?![a-zA-Z])/g, 'Math.E');

      // Reemplazar x con el valor
      expr = expr.replace(/(?<!Math\.)x/g, `(${x})`);
      
      // Evaluar la expresión
      return Function(`"use strict"; return (${expr})`)();
    } catch (error) {
      throw new Error(`Error evaluando función en x=${x}: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setGraphData(null);
    setIsLoading(true);

    try {
      // Validar que todos los campos estén llenos
      if (!functionStr || !a || !b || !n) {
        throw new Error('Todos los campos son obligatorios');
      }

      // Validar que la función se puede evaluar
      const testX = parseFloat(a) || 0;
      evaluateFunction(functionStr, testX);

      // Simular llamada al backend (reemplaza con tu endpoint real)
      const mockResult = calculateTrapezoid(functionStr, parseFloat(a), parseFloat(b), parseInt(n));
      setResult(mockResult);
      generateGraph(mockResult);
      
    } catch (err) {
      setError(err.message || 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTrapezoid = (funcStr, a, b, n) => {
    const h = (b - a) / n;
    let sum = evaluateFunction(funcStr, a) + evaluateFunction(funcStr, b);
    
    for (let i = 1; i < n; i++) {
      const xi = a + i * h;
      sum += 2 * evaluateFunction(funcStr, xi);
    }
    
    const integral = (h / 2) * sum;
    
    return {
      function: funcStr,
      interval: [a, b],
      subintervals: n,
      step_size: h,
      integral: integral,
      method: "Regla del Trapecio"
    };
  };

  const generateGraph = (data) => {
    try {
      const { interval, subintervals } = data;
      const [aVal, bVal] = interval;
      
      // Generar puntos para la curva suave
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
          console.warn(`Error evaluando en x=${x}:`, error.message);
        }
      }

      // Generar puntos para los trapecios
      const trapezoidStep = (bVal - aVal) / subintervals;
      const trapezoidPoints = [];

      for (let i = 0; i <= subintervals; i++) {
        const x = aVal + i * trapezoidStep;
        try {
          const y = evaluateFunction(functionStr, x);
          if (isFinite(y)) {
            trapezoidPoints.push({
              x: parseFloat(x.toFixed(6)),
              y: parseFloat(y.toFixed(6)),
              trapezoid: y
            });
          }
        } catch (error) {
          console.warn(`Error evaluando trapecio en x=${x}:`, error.message);
        }
      }

      // Combinar datos para la gráfica
      const combinedData = curveData.map(point => {
        const trapPoint = trapezoidPoints.find(tp => Math.abs(tp.x - point.x) < 0.001);
        return {
          ...point,
          trapezoid: trapPoint ? trapPoint.trapezoid : null
        };
      });

      setGraphData({
        curveData: combinedData,
        trapezoidPoints: trapezoidPoints
      });
    } catch (error) {
      setError(`Error generando gráfica: ${error.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-4xl font-bold mb-8 text-center text-blue-800 flex items-center justify-center gap-3">
          <span className="text-5xl">∫</span>
          Regla del Trapecio
        </h2>
        
        <div className="space-y-6 bg-gray-50 p-6 rounded-lg mb-8">
          <div>
            <label className="block font-medium text-gray-700 mb-3 text-lg">Función f(x):</label>
            <input
              type="text"
              value={functionStr}
              onChange={(e) => setFunctionStr(e.target.value)}
              className="w-full border border-gray-300 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
              placeholder="Ejemplos: x**2, sin(x), x**3 + 2*x, sqrt(x)"
            />
            <p className="text-sm text-gray-500 mt-2">
              Funciones disponibles: sin, cos, tan, log, sqrt, exp, abs, pi, e, ** para potencias
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-medium text-gray-700 mb-2">Límite inferior (a):</label>
              <input
                type="number"
                step="any"
                value={a}
                onChange={(e) => setA(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">Límite superior (b):</label>
              <input
                type="number"
                step="any"
                value={b}
                onChange={(e) => setB(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">Subintervalos (n):</label>
              <input
                type="number"
                min="1"
                value={n}
                onChange={(e) => setN(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading || !functionStr || !a || !b || !n}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 transition-all duration-300 font-medium text-lg shadow-lg"
          >
            {isLoading ? '🔄 Calculando...' : '📊 Calcular Integral'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-2xl font-semibold mb-4 text-green-800 flex items-center gap-2">
              <span>✅</span> Resultado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-white rounded-lg"><strong>Función:</strong> f(x) = {result.function}</div>
              <div className="p-3 bg-white rounded-lg"><strong>Intervalo:</strong> [{result.interval[0]}, {result.interval[1]}]</div>
              <div className="p-3 bg-white rounded-lg"><strong>Subintervalos:</strong> {result.subintervals}</div>
              <div className="p-3 bg-white rounded-lg"><strong>Tamaño de paso (h):</strong> {result.step_size?.toFixed(6)}</div>
              <div className="md:col-span-2 p-4 bg-green-100 rounded-lg border-2 border-green-300">
                <strong className="text-lg">Integral aproximada:</strong> 
                <span className="text-2xl font-bold text-green-700 ml-3">
                  {typeof result.integral === 'number' ? result.integral.toFixed(8) : result.integral}
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg"><strong>Método:</strong> {result.method}</div>
            </div>
          </div>
        )}

        {graphData && (
          <div className="mt-8">
            <h3 className="text-2xl font-semibold mb-6 text-blue-800 flex items-center gap-2">
              <span>📈</span> Visualización de la Función y Aproximación
            </h3>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-lg">
              <ResponsiveContainer width="100%" height={500}>
                <AreaChart data={graphData.curveData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    scale="linear" 
                    domain={['dataMin', 'dataMax']}
                    label={{ value: 'x', position: 'insideBottom', offset: -5 }}
                    stroke="#4f46e5"
                  />
                  <YAxis 
                    label={{ value: 'f(x)', angle: -90, position: 'insideLeft' }}
                    stroke="#4f46e5"
                  />
                  <Tooltip 
                    formatter={(value, name) => [value.toFixed(6), name]}
                    labelFormatter={(x) => `x = ${x.toFixed(6)}`}
                    contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                  />
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

        <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">ℹ️ Información sobre la Regla del Trapecio</h4>
          <p className="text-sm text-blue-700 leading-relaxed">
            La regla del trapecio es un método de integración numérica que aproxima el área bajo una curva 
            dividiendo el intervalo en subintervalos y aproximando cada subintervalo con un trapecio. 
            La fórmula es: <strong>∫f(x)dx ≈ (h/2)[f(a) + 2∑f(xi) + f(b)]</strong>, donde h = (b-a)/n.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrapezoidMethod;