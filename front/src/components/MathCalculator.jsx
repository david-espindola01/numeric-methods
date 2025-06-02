import React, { useState } from 'react';

const MathCalculator = ({ onInsert, placeholder = "Insertar función..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentInput, setCurrentInput] = useState('');

  const functionButtons = [
    { label: 'sin', value: 'sin(', type: 'function' },
    { label: 'cos', value: 'cos(', type: 'function' },
    { label: 'tan', value: 'tan(', type: 'function' },
    { label: 'log', value: 'log(', type: 'function' },
    { label: 'ln', value: 'ln(', type: 'function' },
    { label: '√', value: 'sqrt(', type: 'function' },
    { label: 'x²', value: '**2', type: 'power' },
    { label: 'x³', value: '**3', type: 'power' },
    { label: 'xⁿ', value: '**', type: 'power' },
    { label: '|x|', value: 'abs(', type: 'function' },
    { label: 'e', value: 'e', type: 'constant' },
    { label: 'a/b', value: '/', type: 'operator' },
    // Variables
    { label: 'x', value: 'x', type: 'variable' },
    { label: 'y', value: 'y', type: 'variable' },
    { label: 'z', value: 'z', type: 'variable' },
  ];

  const parenthesisButtons = [
    { label: '(', value: '(', type: 'parenthesis' },
    { label: ')', value: ')', type: 'parenthesis' },
    { label: 'π', value: 'pi', type: 'constant' },
  ];

  const mathButtons = [
    { label: '7', value: '7', type: 'number' },
    { label: '8', value: '8', type: 'number' },
    { label: '9', value: '9', type: 'number' },
    { label: 'DEL', value: 'DEL', type: 'control' },
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
    // Espacio vacío donde estaba el =
    { label: '', value: '', type: 'empty' },
    { label: '+', value: '+', type: 'operator' },
  ];

  const controlButtons = [
    { label: '←', value: '←', type: 'move', title: 'Mover cursor a la izquierda' },
    { label: '→', value: '→', type: 'move', title: 'Mover cursor a la derecha' },
    { label: '⌫', value: '⌫', type: 'delete', title: 'Borrar carácter' },
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
    if (value === 'DEL') {
      handleClear();
    } else if (value === '⌫') {
      handleBackspace();
    } else if (value === '←' || value === '→') {
      // Implement cursor movement logic here if needed
    } else if (value) {
      setCurrentInput(prev => prev + value);
    }
  };

  const handleClear = () => {
    setCurrentInput('');
  };

  const handleBackspace = () => {
    setCurrentInput(prev => prev.slice(0, -1));
  };

  const handleInsert = () => {
    if (currentInput) {
      onInsert(currentInput);
      setCurrentInput('');
      setIsOpen(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setCurrentInput('');
    }
  };

  const getButtonStyle = (type) => {
    const baseStyle = {
      padding: '12px 8px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '40px'
    };

    switch (type) {
      case 'number':
        return { ...baseStyle, background: '#f5f5f5', color: '#333' };
      case 'operator':
        return { ...baseStyle, background: '#e3f2fd', color: '#1976d2' };
      case 'function':
        return { ...baseStyle, background: '#f1f8e9', color: '#689f38' };
      case 'power':
        return { ...baseStyle, background: '#fff3e0', color: '#fb8c00' };
      case 'constant':
        return { ...baseStyle, background: '#f3e5f5', color: '#8e24aa' };
      case 'control':
        return { ...baseStyle, background: '#ffebee', color: '#d32f2f' };
      case 'move':
        return { ...baseStyle, background: '#e0e0e0', color: '#616161' };
      case 'delete':
        return { ...baseStyle, background: '#ffccbc', color: '#e64a19' };
      case 'variable':
        return { ...baseStyle, background: '#e8eaf6', color: '#3949ab' };
      case 'parenthesis':
        return { ...baseStyle, background: '#e0f7fa', color: '#00acc1' };
      case 'empty':
        return { ...baseStyle, background: 'transparent', boxShadow: 'none', cursor: 'default' };
      default:
        return { ...baseStyle, background: '#f5f5f5', color: '#333' };
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={handleToggle}
        style={{
          background: 'linear-gradient(135deg, #455A64 0%, #263238 100%)',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
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
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          width: '95%',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
            paddingBottom: '10px',
            borderBottom: '1px solid #f5f5f5'
          }}>
            <h4 style={{ margin: 0, color: '#424242', fontSize: '18px', fontWeight: '500' }}>Calculadora Matemática</h4>
            <button
              onClick={handleToggle}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#757575'
              }}
            >
              ×
            </button>
          </div>

          {/* Input Display */}
          <div style={{
            background: '#fafafa',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            padding: '15px',
            marginBottom: '15px',
            minHeight: '60px',
            fontSize: '18px',
            fontFamily: 'Cambria, "Times New Roman", serif',
            display: 'flex',
            alignItems: 'center',
            wordBreak: 'break-all'
          }}>
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#212121' }}>
                {currentInput ? formatPreview(currentInput) : <span style={{ color: '#bdbdbd' }}>Ingresa tu función aquí...</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '5px', fontFamily: 'monospace' }}>
                {currentInput || 'vacío'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            {/* Left Block - Functions */}
            <div style={{ flex: 1 }}>
              {/* Control Buttons */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '10px'
              }}>
                {controlButtons.map((btn, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(btn.value)}
                    title={btn.title}
                    style={{
                      ...getButtonStyle(btn.type),
                      flex: 1,
                      padding: '10px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              
              {/* Function Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                {functionButtons.map((btn, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(btn.value)}
                    style={{
                      ...getButtonStyle(btn.type),
                      padding: '12px 8px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Block - Numbers */}
            <div style={{ flex: 1 }}>
              {/* Parenthesis row moved up */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '8px'
              }}>
                {parenthesisButtons.map((btn, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(btn.value)}
                    style={{
                      ...getButtonStyle(btn.type),
                      padding: '12px 8px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
                {/* Empty space to maintain grid */}
                <div style={getButtonStyle('empty')}></div>
              </div>

              {/* Numbers grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px'
              }}>
                {mathButtons.map((btn, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(btn.value)}
                    style={{
                      ...getButtonStyle(btn.type),
                      padding: '12px 8px',
                      visibility: btn.type === 'empty' ? 'hidden' : 'visible'
                    }}
                    onMouseOver={(e) => {
                      if (btn.type !== 'empty') {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (btn.type !== 'empty') {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      }
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Insert Button - spans full width below numbers */}
              <button
                onClick={handleInsert}
                disabled={!currentInput}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: currentInput ? '#5C6BC0' : '#B0BEC5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentInput ? 'pointer' : 'not-allowed',
                  fontWeight: '500',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                  marginTop: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                  if (currentInput) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 3px 8px rgba(0,0,0,0.2)';
                    e.target.style.background = '#3949AB';
                  }
                }}
                onMouseOut={(e) => {
                  if (currentInput) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    e.target.style.background = '#5C6BC0';
                  }
                }}
              >
                Insertar Función
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathCalculator;