import './globals.css';
import { Inter, Lora, Montserrat } from 'next/font/google';

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

export const metadata = {
  title: 'StoryTeller - Biblical Visual Novel',
  description: 'Experience biblical stories in Nigerian cultural context',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${lora.variable} ${montserrat.variable}`}>
        {children}
      </body>
    </html>
  );
}
