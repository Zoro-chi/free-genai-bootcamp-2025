'use client';

import { Inter, Lora, Montserrat, Dancing_Script } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';

// Define fonts
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter', 
  display: 'swap' 
});

const lora = Lora({ 
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap'
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap'
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing-script',
  display: 'swap'
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <title>StoryTeller - Biblical Visual Novel</title>
        <meta name="description" content="Biblical visual novel in Nigerian languages with AI-generated imagery" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} ${lora.variable} ${montserrat.variable} ${dancingScript.variable}`}>
        <ThemeProvider>
          <ErrorBoundary>
            <div className="App">
              <Header />
              <main className="pt-16 pb-12">
                {children}
              </main>
              <Footer />
            </div>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
