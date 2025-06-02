import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Componentes
import Navbar from './components/Navbar';

// Métodos numéricos
import FixedPoint from './methods/FixedPoint';
import Bisection from './methods/Bisection';
import NewtonRaphson from './methods/NewtonRaphson';
import Secant from './methods/Secant';
import Jacobi from './methods/Jacobi';
import GaussSeidel from './methods/GaussSeidel';
import Euler from './methods/Euler';
import Romberg from './methods/Romberg';
import Trapezoid from './methods/Trapezoid';
import Simpson from './methods/Simpson';
import './App.css';

function HomePage() {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1>🧮 Calculadora de Métodos Numéricos</h1>
        <p className="welcome-subtitle">
          Herramientas interactivas para resolver problemas matemáticos con precisión
        </p>
        
        <div className="welcome-description">
          <p>
            Bienvenido a nuestra plataforma de métodos numéricos. Aquí encontrarás 
            calculadoras especializadas para resolver diferentes tipos de ecuaciones 
            y problemas matemáticos de forma rápida y precisa.
          </p>
        </div>

        <div className="methods-categories">
          <div className="category">
            <h3>🎯 Ecuaciones No Lineales</h3>
            <p>Punto Fijo • Bisección • Newton-Raphson • Secante</p>
          </div>
          
          <div className="category">
            <h3>🔢 Sistemas de Ecuaciones</h3>
            <p>Jacobi • Gauss-Seidel</p>
          </div>
          
          <div className="category">
            <h3>📊 Integración y Ecuaciones Diferenciales</h3>
            <p>Euler • Romberg • Trapecio • Simpson</p>
          </div>
        </div>

        <div className="welcome-instructions">
          <p>
            <strong>💡 Cómo usar:</strong> Selecciona el método que necesitas desde la barra 
            de navegación superior. Cada calculadora incluye explicaciones detalladas y 
            ejemplos para ayudarte a obtener los mejores resultados.
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/fixed-point" element={<FixedPoint />} />
          <Route path="/bisection" element={<Bisection />} />
          <Route path="/newton-raphson" element={<NewtonRaphson />} />
          <Route path="/secant" element={<Secant />} />
          <Route path="/jacobi" element={<Jacobi />} />
          <Route path="/gauss-seidel" element={<GaussSeidel />} />
          <Route path="/euler" element={<Euler />} />
          <Route path="/romberg" element={<Romberg />} />
          <Route path="/trapezoid" element={<Trapezoid />} />
          <Route path="/simpson" element={<Simpson />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;