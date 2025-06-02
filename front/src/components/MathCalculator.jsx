import React, { useState } from 'react';

const MathCalculator = ({ onInsert, placeholder = "Insertar función..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentInput, setCurrentInput] = useState('');

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
    { label: '+', value: '+', type: 'operator' },
  ];

  const functionButtons = [
    { label: 'sin', value: 'sin(', type: 'function' },
    { label: 'cos', value: 'cos(', type: 'function' },
    { label: 'tan', value: 'tan(', type: 'function' },
    { label: 'ln', value: 'ln(', type: 'function' },
    { label: 'log', value: 'log(', type: 'function' },
    { label: 'exp', value: 'exp(', type: 'function' },
    { label: 'sqrt', value: 'sqrt(', type: 'function' },
    { label: 'abs', value: 'abs(', type: 'function' },
    { label: 'x', value: 'x', type: 'variable' },
    { label: 'x²', value: '**2', type: 'power' },
    { label: 'x³', value: '**3', type: 'power' },
    { label: 'xⁿ', value: '**', type: 'power' },
    { label: '(', value: '(', type: 'parenthesis' },
    { label: ')', value: ')', type: 'parenthesis' },
    { label: 'π', value: 'pi', type: 'constant' },
    { label: 'e', value: 'e', type: 'constant' },
  ];

  const formatPreview = (expression) => {
    return expression
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

  const handleButtonClick = (value) => {
    setCurrentInput(prev => prev + value);
  };

  const handleClear = () => {
    setCurrentInput('');
  };

  const handleBackspace = () => {
    setCurrentInput(prev => prev.slice(0, -1));
  };

  const handleInsert = () => {
    onInsert(currentInput);
    setCurrentInput('');
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setCurrentInput('');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={handleToggle}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        }}
      >
        🧮 {placeholder}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '50px',
          left: '0',
          right: '0',
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 15px 50px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          width: '95%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #f8f9fa'
          }}>
            <h4 style={{ margin: 0, color: '#495057', fontSize: '20px' }}>Calculadora Matemática</h4>
            <button
              onClick={handleToggle}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6c757d'
              }}
            >
              ×
            </button>
          </div>

          {/* Input Display */}
          <div style={{
            background: '#f8f9fa',
            border: '2px solid #e9ecef',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            minHeight: '60px',
            fontSize: '20px',
            fontFamily: 'Cambria, "Times New Roman", serif',
            display: 'flex',
            alignItems: 'center',
            wordBreak: 'break-all'
          }}>
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>
                Vista previa matemática:
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {currentInput ? formatPreview(currentInput) : <span style={{ color: '#adb5bd' }}>Ingresa tu función aquí...</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px', fontFamily: 'monospace' }}>
                Código: {currentInput || 'vacío'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
            {/* Function Buttons */}
            <div>
              <h5 style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Funciones Matemáticas
              </h5>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px'
              }}>
                {functionButtons.map((btn, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(btn.value)}
                    style={{
                      padding: '12px 8px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      background: btn.type === 'function' ? '#e3f2fd' : 
                                 btn.type === 'power' ? '#fff3e0' :
                                 btn.type === 'constant' ? '#f3e5f5' : '#f8f9fa',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = btn.type === 'function' ? '#bbdefb' : 
                                                 btn.type === 'power' ? '#ffe0b2' :
                                                 btn.type === 'constant' ? '#e1bee7' : '#e9ecef';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = btn.type === 'function' ? '#e3f2fd' : 
                                                 btn.type === 'power' ? '#fff3e0' :
                                                 btn.type === 'constant' ? '#f3e5f5' : '#f8f9fa';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Number Pad */}
            <div>
              <h5 style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Números y Operadores
              </h5>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px'
              }}>
                {mathButtons.map((btn, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(btn.value)}
                    style={{
                      padding: '15px',
                      border: '1px solid #dee2e6',
                      borderRadius: '10px',
                      background: btn.type === 'number' ? '#ffffff' :
                                 btn.type === 'operator' ? '#e8f5e8' :
                                 btn.type === 'variable' ? '#fff8e1' : '#f8f9fa',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: '700',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = btn.type === 'number' ? '#f8f9fa' :
                                                 btn.type === 'operator' ? '#c8e6c9' :
                                                 btn.type === 'variable' ? '#ffecb3' : '#e9ecef';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = btn.type === 'number' ? '#ffffff' :
                                                 btn.type === 'operator' ? '#e8f5e8' :
                                                 btn.type === 'variable' ? '#fff8e1' : '#f8f9fa';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            marginTop: '25px'
          }}>
            <button
              onClick={handleClear}
              style={{
                flex: 1,
                maxWidth: '200px',
                padding: '15px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#c82333'}
              onMouseOut={(e) => e.target.style.background = '#dc3545'}
            >
              🗑️ Limpiar
            </button>
            <button
              onClick={handleBackspace}
              style={{
                flex: 1,
                maxWidth: '200px',
                padding: '15px',
                background: '#ffc107',
                color: '#212529',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#e0a800'}
              onMouseOut={(e) => e.target.style.background = '#ffc107'}
            >
              ⌫ Borrar
            </button>
            <button
              onClick={handleInsert}
              disabled={!currentInput}
              style={{
                flex: 2,
                maxWidth: '300px',
                padding: '15px',
                background: currentInput ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: currentInput ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (currentInput) e.target.style.background = '#218838';
              }}
              onMouseOut={(e) => {
                if (currentInput) e.target.style.background = '#28a745';
              }}
            >
              ✅ Insertar Función
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathCalculator;