import React from 'react';

const Loader = () => {
  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1050 
      }}
    >
      <div style={{ position: 'relative', width: '5rem', height: '5rem' }}>
        {/* Outer circle */}
        <div 
          style={{ 
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '4px solid transparent',
            borderTopColor: '#0d6efd', 
            borderBottomColor: '#0d6efd',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        
        {/* Middle circle */}
        <div 
          style={{ 
            position: 'absolute',
            width: '3.5rem',
            height: '3.5rem',
            margin: '0.75rem',
            borderRadius: '50%',
            border: '4px solid transparent',
            borderTopColor: '#6610f2',
            borderBottomColor: '#6610f2',
            animation: 'spin-reverse 0.7s linear infinite'
          }}
        ></div>
        
        {/* Inner circle */}
        <div 
          style={{ 
            position: 'absolute',
            width: '2rem',
            height: '2rem',
            margin: '1.5rem',
            borderRadius: '50%',
            border: '4px solid transparent',
            borderTopColor: '#20c997',
            borderBottomColor: '#20c997',
            animation: 'spin 0.5s linear infinite'
          }}
        ></div>
        
        {/* Center dot */}
        <div 
          style={{ 
            position: 'absolute',
            backgroundColor: 'white',
            borderRadius: '50%',
            width: '1rem',
            height: '1rem',
            top: '2rem',
            left: '2rem',
            animation: 'pulse 1s ease-in-out infinite'
          }}
        ></div>
      </div>
      
      {/* CSS animations */}
      <style >{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default Loader;