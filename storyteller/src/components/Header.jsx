'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { HiHome, HiBookOpen, HiMenu, HiX, HiBookmark } from 'react-icons/hi';
import ThemeToggle from './ThemeToggle';
import { config } from '@/lib/config';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <header className="biblical-header fixed top-0 left-0 w-full z-50 bg-bible-paper shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="font-dancing-script text-2xl font-bold text-bible-royal">
                StoryTeller
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive('/') 
                    ? 'text-white bg-bible-royal' 
                    : 'text-bible-royal hover:bg-bible-parchment'
                }`}
              >
                <HiHome className="mr-1 w-5 h-5" />
                Home
              </Link>
              <Link
                href="/read"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive('/read') 
                    ? 'text-white bg-bible-royal' 
                    : 'text-bible-royal hover:bg-bible-parchment'
                }`}
              >
                <HiBookOpen className="mr-1 w-5 h-5" />
                Read
              </Link>
              
              {config.features.bookmarking && (
                <Link
                  href="/bookmarks"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive('/bookmarks') 
                      ? 'text-white bg-bible-royal' 
                      : 'text-bible-royal hover:bg-bible-parchment'
                  }`}
                >
                  <HiBookmark className="mr-1 w-5 h-5" />
                  Bookmarks
                </Link>
              )}
              
              {/* Theme toggle for desktop */}
              {config.features.darkMode && (
                <ThemeToggle className="ml-2 text-bible-royal hover:bg-bible-parchment rounded-full" />
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {config.features.darkMode && (
              <ThemeToggle className="mr-2 text-bible-royal" />
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-bible-royal hover:text-white hover:bg-bible-royal"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <HiX className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <HiMenu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/') 
                    ? 'text-white bg-bible-royal' 
                    : 'text-bible-royal hover:bg-bible-parchment'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <HiHome className="mr-2 w-5 h-5" />
                  Home
                </div>
              </Link>
              <Link
                href="/read"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/read') 
                    ? 'text-white bg-bible-royal' 
                    : 'text-bible-royal hover:bg-bible-parchment'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <HiBookOpen className="mr-2 w-5 h-5" />
                  Read
                </div>
              </Link>
              
              {config.features.bookmarking && (
                <Link
                  href="/bookmarks"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/bookmarks') 
                      ? 'text-white bg-bible-royal' 
                      : 'text-bible-royal hover:bg-bible-parchment'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <HiBookmark className="mr-2 w-5 h-5" />
                    Bookmarks
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
