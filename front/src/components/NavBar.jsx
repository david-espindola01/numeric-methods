import React from 'react';
import { Link } from 'react-router-dom';
import {
  RiHome2Line,
  RiFocus3Line,
  RiScissorsCutLine,
  RiArrowDownLine,
  RiArrowUpDownLine,
  RiGridFill,
  RiGridLine,
  RiTimeLine,
  RiRulerLine,
  RiShapeLine,
  RiFunctionLine
} from 'react-icons/ri';
import '../styles/components/Navbar.css';

function Navbar() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/"><span className="icon"><RiHome2Line /></span><span className="text">Inicio</span></Link>
        </li>
        <li>
          <Link to="/fixed-point"><span className="icon"><RiFocus3Line /></span><span className="text">Punto Fijo</span></Link>
        </li>
        <li>
          <Link to="/bisection"><span className="icon"><RiScissorsCutLine /></span><span className="text">Bisección</span></Link>
        </li>
        <li>
          <Link to="/newton-raphson"><span className="icon"><RiArrowDownLine /></span><span className="text">Newton-Raphson</span></Link>
        </li>
        <li>
          <Link to="/secant"><span className="icon"><RiArrowUpDownLine /></span><span className="text">Secante</span></Link>
        </li>
        <li>
          <Link to="/jacobi"><span className="icon"><RiGridFill /></span><span className="text">Jacobi</span></Link>
        </li>
        <li>
          <Link to="/gauss-seidel"><span className="icon"><RiGridLine /></span><span className="text">Gauss-Seidel</span></Link>
        </li>
        <li>
          <Link to="/euler"><span className="icon"><RiTimeLine /></span><span className="text">Euler</span></Link>
        </li>
        <li>
          <Link to="/romberg"><span className="icon"><RiRulerLine /></span><span className="text">Romberg</span></Link>
        </li>
        <li>
          <Link to="/trapezoid"><span className="icon"><RiShapeLine /></span><span className="text">Trapecio</span></Link>
        </li>
        <li>
          <Link to="/simpson"><span className="icon"><RiFunctionLine /></span><span className="text">Simpson</span></Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;