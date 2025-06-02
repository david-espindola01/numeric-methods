import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NavBar.css';

function Navbar() {
  return (
    <nav>
      <ul>
        <li><Link to="/fixed-point">Punto Fijo</Link></li>
        <li><Link to="/bisection">Bisección</Link></li>
        <li><Link to="/newton-raphson">Newton-Raphson</Link></li>
        <li><Link to="/secant">Secante</Link></li>
        <li><Link to="/jacobi">Jacobi</Link></li>
        <li><Link to={"/gauss-seidel"}>Gauss-Seidel</Link></li>
        <li><Link to={"/euler"}>Euler</Link></li>
        <li><Link to={"/romberg"}>Romberg</Link></li>
        <li><Link to={"/trapezoid"}>Trapecio</Link></li>
        <li><Link to={"/simpson"}>Simpson</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
