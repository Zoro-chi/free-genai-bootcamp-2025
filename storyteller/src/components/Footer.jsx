'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Added missing import for Link component

const Footer = () => {
  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const footerStyles = {
    container: {
      padding: '20px 0',
      marginTop: '40px',
      borderTop: '1px solid #d1c4a8', // bible-scroll color
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '20px',
      fontSize: '14px',
      color: '#666',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    column: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: isMobile ? 'center' : 'flex-start',
      gap: '10px',
      textAlign: isMobile ? 'center' : 'left',
    },
    title: {
      color: '#2c467a', // bible-royal color
      marginBottom: '10px',
      fontWeight: 600,
      fontSize: '16px',
    },
    link: {
      color: '#666',
      textDecoration: 'none',
      transition: 'color 0.2s',
      cursor: 'pointer',
    },
    copyright: {
      marginTop: '20px',
      width: '100%',
      textAlign: 'center',
      fontSize: '12px',
      color: '#888',
    }
  };

  return (
    <footer style={footerStyles.container}>
      <div style={footerStyles.column}>
        <h3 style={footerStyles.title}>Bible Navigation</h3>
        <a href="/read?book=Genesis&chapter=1" style={footerStyles.link}>Old Testament</a>
        <a href="/read?book=Matthew&chapter=1" style={footerStyles.link}>New Testament</a>
        <p className="text-bible-ink text-sm mb-4 md:mb-0">
          &copy; {new Date().getFullYear()} StoryTeller. All rights reserved.
        </p>
        
        <div className="flex space-x-4">
          <Link href="/terms" className="text-bible-ink hover:text-bible-royal text-xs">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-bible-ink hover:text-bible-royal text-xs">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
