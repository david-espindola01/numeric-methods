import React, { useState } from 'react';
import { parse } from 'mathjs';
import '../styles/MathCalculator.css';

const MathCalculator = ({ onInsert, placeholder = "Insertar función..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [error, setError] = useState('');

  const functionButtons = [
    { label: 'sin', value: 'sin(', type: 'function' },
    { label: 'cos', value: 'cos(', type: 'function' },
    { label: 'tan', value: 'tan(', type: 'function' },
    { label: 'log', value: 'log(', type: 'function' },
    { label: 'ln', value: 'ln(', type: 'function' },
    { label: '√', value: 'sqrt(', type: 'function' },
    { label: 'x²', value: '**2', type: 'power' },
    { label: 'xⁿ', value: '**', type: 'power' },
    { label: '|x|', value: 'abs(', type: 'function' },
    { label: 'x', value: 'x', type: 'variable' },
    { label: 'y', value: 'y', type: 'variable' },
    { label: 'z', value: 'z', type: 'variable' },
  ];

  const parenthesisButtons = [
    { label: '(', value: '(', type: 'parenthesis' },
    { label: ')', value: ')', type: 'parenthesis' },
    { label: 'π', value: 'pi', type: 'constant' },
    { label: 'e', value: 'e', type: 'constant' },
  ];

  const mathButtons = [
    { label: '7', value: '7', type: 'number' },
    { label: '8', value: '8', type: 'number' },
    { label: '9', value: '9', type: 'number' },
    { label: '÷', value: '/', type: 'operator' },
    { label: '4', value: '4', type: 'number' },
    { label: '5', value: '5', type: 'number' },
    { label: '6', value: '6', type: 'number' },
    { label: '×', value: '*', type: 'operator' },
    { label: '1', value: '1', type: 'number' },
    { label: '2', value: '2', type: 'number' },
    { label: '3', value: '3', type: 'number' },
    { label: '−', value: '-', type: 'operator' },
    { label: '0', value: '0', type: 'number' },
    { label: '.', value: '.', type: 'number' },
    { label: '', value: '', type: 'empty' },
    { label: '+', value: '+', type: 'operator' },
  ];

  const controlButtons = [
    { label: '←', value: '←', type: 'move', title: 'Mover cursor a la izquierda' },
    { label: '→', value: '→', type: 'move', title: 'Mover cursor a la derecha' },
    { label: '⌫', value: '⌫', type: 'delete', title: 'Borrar carácter' },
    { label: 'DEL', value: 'DEL', type: 'control' },
  ];

  const preprocessExpression = (expr) => {
    const superscripts = {
      '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
      '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9'
    };
    return expr
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (match) => superscripts[match] || match)
      .replace(/\^/g, '**')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      // Solo inserta * entre número o ) y x, y, z
      .replace(/(\d|\))(?=[xyz])/g, '$1*');
  };

  const formatPreview = (expression) => {
    return expression
      .replace(/\^(\d+)/g, (match, exp) => {
        const superscripts = {
          '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
          '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
        };
        return exp.split('').map(digit => superscripts[digit] || digit).join('');
      })
      .replace(/\*\*(\d+)/g, (match, exp) => {
        const superscripts = {
          '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
          '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
        };
        return exp.split('').map(digit => superscripts[digit] || digit).join('');
      })
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/pi/g, 'π')
      .replace(/sqrt\(/g, '√(');
  };
<div className={`display-preview ${!currentInput ? 'empty-display' : ''}`}>
  {(() => {
    const left = formatPreview(currentInput.slice(0, cursorPos));
    const right = formatPreview(currentInput.slice(cursorPos));
    return (
      <>
        {left}
        <span style={{
          display: 'inline-block',
          width: '2px',
          height: '1em',
          background: '#333',
          verticalAlign: 'middle',
          margin: '0 1px'
        }} />
        {right || <span style={{ opacity: 0.5 }}> </span>}
      </>
    );
  })()}
</div>
  const validateInput = (input) => {
    // Convierte ** a ^ SOLO para validar con mathjs
    const mathjsInput = preprocessExpression(input).replace(/\*\*/g, '^');

    // Validación básica de paréntesis
    let stack = [];
    for (let char of mathjsInput) {
      if (char === '(') stack.push('(');
      if (char === ')') {
        if (!stack.length) return '¡Error: Falta paréntesis de apertura!';
        stack.pop();
      }
    }
    if (stack.length) return '¡Error: Falta paréntesis de cierre!';

    // Validación avanzada con mathjs
    try {
      parse(mathjsInput); // Ahora mathjs entiende la potencia
      return '';
    } catch (error) {
      return `Error de sintaxis: ${error.message.replace('Error: ', '')}`;
    }
  };

  const handleInsert = () => {
    const validationMsg = validateInput(currentInput);
    if (validationMsg) {
      setError(validationMsg);
      return;
    }
    if (currentInput) {
      const processedInput = preprocessExpression(currentInput);
      onInsert(processedInput);
      setCurrentInput('');
      setCursorPos(0);
      setIsOpen(false);
      setError('');
    }
  };

  const handleButtonClick = (value) => {
    setError('');
    if (value === 'DEL') {
      handleClear();
      setCursorPos(0);
    } else if (value === '⌫') {
      if (cursorPos > 0) {
        setCurrentInput(prev =>
          prev.slice(0, cursorPos - 1) + prev.slice(cursorPos)
        );
        setCursorPos(pos => pos - 1);
      }
    } else if (value === '←') {
      setCursorPos(pos => (pos > 0 ? pos - 1 : 0));
    } else if (value === '→') {
      setCursorPos(pos => (pos < currentInput.length ? pos + 1 : pos));
    } else if (value) {
      setCurrentInput(prev =>
        prev.slice(0, cursorPos) + value + prev.slice(cursorPos)
      );
      setCursorPos(pos => pos + value.length);
    }
  };

  const handleClear = () => {
    setCurrentInput('');
    setCursorPos(0);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setCurrentInput('');
      setCursorPos(0);
    }
  };

  const getButtonClass = (type) => {
    switch (type) {
      case 'number': return 'calc-button number-button';
      case 'operator': return 'calc-button operator-button';
      case 'function': return 'calc-button function-button';
      case 'power': return 'calc-button power-button';
      case 'constant': return 'calc-button constant-button';
      case 'control': return 'calc-button control-button';
      case 'move': return 'calc-button move-button';
      case 'delete': return 'calc-button delete-button';
      case 'variable': return 'calc-button variable-button';
      case 'parenthesis': return 'calc-button parenthesis-button';
      case 'empty': return 'empty-button';
      default: return 'calc-button number-button';
    }
  };

  return (
    <div className="math-calculator-container">
      <button
        type="button"
        onClick={handleToggle}
        className="toggle-button"
      >
        🧮 {placeholder}
      </button>

      {isOpen && (
        <div className="math-calculator-popup">
          <div className="math-calculator-display-wrapper">
            <div className="math-calculator-display">
              <div style={{ width: '100%' }}>
                {/* Display grande, visual bonito */}
                <div className={`display-preview ${!currentInput ? 'empty-display' : ''}`}>
                  {(() => {
                    const left = formatPreview(currentInput.slice(0, cursorPos));
                    const right = formatPreview(currentInput.slice(cursorPos));
                    return (
                      <>
                        {left}
                        <span style={{
                          display: 'inline-block',
                          width: '2px',
                          height: '1em',
                          background: '#333',
                          verticalAlign: 'middle',
                          margin: '0 1px'
                        }} />
                        {right || <span style={{ opacity: 0.5 }}> </span>}
                      </>
                    );
                  })()}
                </div>
                {/* Display pequeño, formato Python */}
                <div className="display-raw" style={{ fontSize: '0.85em', color: '#888', marginTop: '2px' }}>
                  {preprocessExpression(currentInput) || 'vacío'}
                </div>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="math-calculator-close-overlay"
            >
              ×
            </button>
          </div>

          <div className="flex-container">
            <div className="flex-2">
              <div className="control-buttons-row">
                {controlButtons.map((btn, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(btn.value)}
                    title={btn.title}
                    className={`${getButtonClass(btn.type)} control-button`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              
              <div className="button-grid grid-3-col">
                {functionButtons.map((btn, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(btn.value)}
                    className={getButtonClass(btn.type)}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <div className="button-grid grid-4-col" style={{ marginBottom: '8px' }}>
                {parenthesisButtons.map((btn, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(btn.value)}
                    className={getButtonClass(btn.type)}
                  >
                    {btn.label}
                  </button>
                ))}
                <div className="empty-button"></div>
              </div>

              <div className="button-grid grid-4-col">
                {mathButtons.map((btn, index) => {
                  if (btn.label === '.') {
                    return (
                      <React.Fragment key={index}>
                        <button
                          onClick={() => handleButtonClick(btn.value)}
                          className={getButtonClass(btn.type)}
                        >
                          {btn.label}
                        </button>
                        <button
                          onClick={handleInsert}
                          disabled={!currentInput}
                          className="insert-button"
                          style={{
                            minWidth: 0,
                            padding: 0,
                            fontSize: '14px',
                            margin: 0,
                            height: '48px',
                          }}
                        >
                          Insertar
                        </button>
                      </React.Fragment>
                    );
                  }
                  if (btn.type === 'empty') {
                    return null;
                  }
                  return (
                    <button
                      key={index}
                      onClick={() => handleButtonClick(btn.value)}
                      className={getButtonClass(btn.type)}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ color: 'red', margin: '8px 0', textAlign: 'center', fontWeight: 'bold' }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MathCalculator;