import React from 'react';

const LoadingIndicator = ({ 
  message = 'Loading...', 
  showProgress = false, 
  progress = 0,
  total = 1
}) => {
  const percentage = Math.min(100, Math.round((progress / total) * 100)) || 0;
  
  // Define all styles as objects for inline styling
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #d1c4a8', // bible-scroll color
      margin: '0 auto',
      maxWidth: '90%',
      width: '400px'
    },
    spinner: {
      height: '3rem',
      width: '3rem',
      borderRadius: '50%',
      border: '4px solid transparent',
      borderTopColor: '#2c467a', // bible-royal color
      borderBottomColor: '#2c467a', // bible-royal color
      animation: 'spin 1s linear infinite',
      marginBottom: '1rem'
    },
    messageText: {
      color: '#2c467a', // bible-royal color
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: '0.5rem',
      fontSize: '1rem'
    },
    progressContainer: {
      width: '100%',
      maxWidth: '24rem'
    },
    progressBarOuter: {
      backgroundColor: '#e2e8f0', // gray-200
      borderRadius: '9999px',
      height: '0.625rem',
      marginBottom: '0.25rem'
    },
    progressBarInner: {
      backgroundColor: '#2c467a', // bible-royal color
      height: '0.625rem',
      borderRadius: '9999px',
      transition: 'width 0.3s ease',
      width: `${percentage}%`
    },
    progressText: {
      fontSize: '0.75rem',
      color: '#718096', // gray-500
      textAlign: 'center'
    }
  };
  
  // Add keyframes for spinner animation to document head
  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
  
  return (
    <div style={styles.container}>
      {/* Spinner */}
      <div style={styles.spinner}></div>
      
      {/* Message */}
      <div style={styles.messageText}>
        {message}
      </div>
      
      {/* Progress bar */}
      {showProgress && (
        <div style={styles.progressContainer}>
          <div style={styles.progressBarOuter}>
            <div style={styles.progressBarInner}></div>
          </div>
          <div style={styles.progressText}>
            {progress} of {total} ({percentage}%)
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingIndicator;
