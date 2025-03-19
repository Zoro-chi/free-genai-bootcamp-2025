'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

const Footer = () => {
  const { theme } = useTheme();
  
  return (
    <footer className="bg-bible-paper border-t border-bible-scroll">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="mb-8 md:mb-0">
            <h2 className="text-lg font-bold font-biblical text-bible-royal mb-4">StoryTeller</h2>
            <p className="text-bible-ink text-sm">
              Biblical visual novels in Nigerian languages with AI-generated imagery to 
              enhance the experience of reading the Bible in native languages.
            </p>
          </div>
          
          <div className="mb-8 md:mb-0">
            <h3 className="text-md font-bold font-biblical text-bible-royal mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-bible-ink hover:text-bible-royal text-sm">
                  Our Mission
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-bible-ink hover:text-bible-royal text-sm">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-bible-ink hover:text-bible-royal text-sm">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-md font-bold font-biblical text-bible-royal mb-4">Languages</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/read?lang=english" className="text-bible-ink hover:text-bible-royal text-sm">
                  English
                </Link>
              </li>
              <li>
                <Link href="/read?lang=yoruba" className="text-bible-ink hover:text-bible-royal text-sm">
                  Yoruba
                </Link>
              </li>
              <li>
                <Link href="/read?lang=igbo" className="text-bible-ink hover:text-bible-royal text-sm">
                  Igbo
                </Link>
              </li>
              <li>
                <Link href="/read?lang=pidgin" className="text-bible-ink hover:text-bible-royal text-sm">
                  Nigerian Pidgin
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-bible-scroll mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
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
      </div>
    </footer>
  );
};

export default Footer;
