import React, { useState, useEffect } from 'react';

const LoadingIndicator = ({ 
  message = 'Loading...', 
  showProgress = false, 
  progress = 0,
  total = 1
}) => {
  // Calculate percentage
  const percentage = Math.min(100, Math.round((progress / total) * 100)) || 0;
  
  // Animation for the spinner dots
  const [dots, setDots] = useState('.');
  
  useEffect(() => {
    // Create a simple animation for the loading dots
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.';
        if (prev === '..') return '...';
        if (prev === '.') return '..';
        return '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'relative',
      padding: '20px',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid #d1c4a8',
      maxWidth: '400px',
      width: '100%',
      margin: '0 auto',
      zIndex: 1000,
      textAlign: 'center'
    }}>
      {/* Loading message and animated dots */}
      <div style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        color: '#2c467a',
        marginBottom: '16px'
      }}>
        {message}{dots}
      </div>
      
      {/* Manual spinner implementation */}
      <div style={{ 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#2c467a',
          margin: '0 4px',
          opacity: dots === '.' ? 1 : 0.3,
          transition: 'opacity 0.3s ease'
        }}></div>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#2c467a',
          margin: '0 4px',
          opacity: dots === '..' ? 1 : 0.3,
          transition: 'opacity 0.3s ease'
        }}></div>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#2c467a',
          margin: '0 4px',
          opacity: dots === '...' ? 1 : 0.3,
          transition: 'opacity 0.3s ease'
        }}></div>
      </div>
      
      {/* Progress indicator */}
      {showProgress && (
        <div>
          <div style={{
            height: '8px',
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              height: '100%',
              width: `${percentage}%`,
              backgroundColor: '#2c467a',
              transition: 'width 0.5s ease-out'
            }}></div>
          </div>
          
          <div style={{
            fontSize: '14px',
            color: '#666',
            margin: '4px 0'
          }}>
            {progress} of {total} ({percentage}%)
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingIndicator;
