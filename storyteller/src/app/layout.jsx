import './globals.css';
import Link from 'next/link';
import { Inter, Lora, Montserrat, Dancing_Script } from 'next/font/google';

// Load fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing-script',
});

export const metadata = {
  title: 'StoryTeller - Biblical Visual Novel',
  description: 'Experience biblical stories in Nigerian cultural context',
};

export default function RootLayout({ children }) {
  // Define header styles for better positioning and color with centered content
  const headerStyle = {
    top: 0,
    width: '100%',
    backgroundColor: 'var(--ink-dark)',
    borderBottom: '4px solid var(--gold-accent)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    // padding: '0.5rem 0', // Add vertical padding
    textAlign: 'center', // Center all text content
    display: 'flex',
    justifyContent: 'center', // Center flex items horizontally
    alignItems: 'center', // Center flex items vertically
    marginBottom: '2rem', // Add bottom margin for spacing
  };

  const headerContainerStyle = {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };

  // Define footer inline styles for guaranteed centering
  const footerStyle = {
    backgroundColor: 'var(--ink-dark)',
    padding: '0.5rem',
    width: '100%',
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };

  const footerContentStyle = {
    textAlign: 'center',
    width: '100%',
    maxWidth: '1200px'
  };

  const footerTextStyle = {
    fontFamily: 'var(--font-lora), Georgia, serif',
    color: 'var(--parchment)',
    textAlign: 'center'
  };

  return (
    <html lang="en">
      <body className={`${inter.variable} ${lora.variable} ${montserrat.variable} ${dancingScript.variable} min-h-screen flex flex-col`}>
        {/* Global Header with updated styling */}
        <header style={headerStyle}>
          <div style={headerContainerStyle}>
            <Link href="/" className="text-center">
              <h1 className={`text-4xl md:text-5xl font-dancing-script mb-2 text-bible-gold`} style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>StoryTeller</h1>
            </Link>
          </div>
        </header>
        
        <div className="flex-grow bg-bible-parchment bg-parchment-pattern pt-6">
          {children}
        </div>
        
        <footer style={footerStyle}>
          <div style={footerContentStyle}>
            <p style={footerTextStyle}>StoryTeller &copy; 2025 - Biblical visual novel with AI-generated imagery</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
