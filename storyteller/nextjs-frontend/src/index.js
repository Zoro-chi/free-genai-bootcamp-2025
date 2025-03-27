import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Removed Amplify configuration since we're using local mocks during development

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Development helper messages
if (process.env.NODE_ENV === 'development') {
  console.log('📘 StoryTeller running in development mode');
  console.log('🧪 Using mock services instead of real APIs');
  console.log('🚀 Try navigating to: /?book=Matthew&chapter=5&lang=english');
  console.log('🔍 Or: /?book=Mark&chapter=6&lang=english (Feeding the 5000)');
}
