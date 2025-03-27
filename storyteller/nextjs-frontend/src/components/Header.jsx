"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiMenu,
  HiX,
  HiOutlineBookOpen,
  HiHome,
  HiInformationCircle,
} from "react-icons/hi";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { config } from "@/lib/config";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { theme } = useTheme();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Define all styles as objects for inline styling
  const styles = {
    header: {
      backgroundColor: theme === "dark" ? "#1a1a1a" : "#fff",
      borderBottom: `1px solid ${theme === "dark" ? "#333" : "#d1c4a8"}`,
      padding: "16px 0",
      width: "100vw", // Use viewport width instead of percentage
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxShadow:
        theme === "dark"
          ? "0 2px 8px rgba(0,0,0,0.3)"
          : "0 2px 8px rgba(0,0,0,0.1)",
      transition: "background-color 0.3s, border-color 0.3s",
      left: 0, // Ensure it's aligned to the left edge
      right: 0, // Ensure it's aligned to the right edge
    },
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%", // Ensure the container takes full width
      boxSizing: "border-box", // Include padding in width calculation
    },
    logoContainer: {
      display: "flex",
      alignItems: "center",
    },
    logo: {
      fontFamily: "var(--font-dancing-script)",
      fontSize: "28px",
      fontWeight: "bold",
      color: theme === "dark" ? "#e2c792" : "#2c467a",
      marginRight: "8px",
      textDecoration: "none",
    },
    menuButton: {
      display: isMobile ? "flex" : "none",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "8px",
      color: theme === "dark" ? "#e2c792" : "#2c467a",
    },
    nav: {
      display: isMobile ? (isMenuOpen ? "block" : "none") : "flex",
      position: isMobile ? "absolute" : "static",
      top: isMobile ? "64px" : "auto",
      left: 0,
      width: isMobile ? "100%" : "auto",
      backgroundColor: theme === "dark" ? "#1a1a1a" : "#fff",
      borderTop: isMobile
        ? `1px solid ${theme === "dark" ? "#333" : "#d1c4a8"}`
        : "none",
      boxShadow: isMobile
        ? theme === "dark"
          ? "0 4px 8px rgba(0,0,0,0.3)"
          : "0 4px 8px rgba(0,0,0,0.1)"
        : "none",
      padding: isMobile ? "16px" : 0,
      zIndex: 40,
    },
    navList: {
      display: "flex",
      listStyle: "none",
      margin: 0,
      padding: 0,
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "16px" : "24px",
    },
    navItem: {
      margin: 0,
    },
    navLink: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      color: theme === "dark" ? "#e2c792" : "#2c467a",
      textDecoration: "none",
      fontSize: "16px",
      fontWeight: 500,
      padding: "8px 0",
      borderBottom: "2px solid transparent",
      transition: "color 0.2s, border-color 0.2s",
    },
    activeNavLink: {
      borderBottom: `2px solid ${theme === "dark" ? "#e2c792" : "#2c467a"}`,
      fontWeight: 600,
    },
    rightContainer: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },
    icon: {
      width: "20px",
      height: "20px",
    },
  };

  // Helper function to combine styles
  const getNavLinkStyle = (path) => ({
    ...styles.navLink,
    ...(pathname === path ? styles.activeNavLink : {}),
  });

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.logoContainer}>
          <Link href="/" style={styles.logo}>
            StoryTeller
          </Link>
        </div>

        <div style={styles.rightContainer}>
          {config.features.darkMode && <ThemeToggle />}
        </div>

        <button
          style={styles.menuButton}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <HiX style={styles.icon} />
          ) : (
            <HiMenu style={styles.icon} />
          )}
        </button>

        <nav style={styles.nav}>
          <ul style={styles.navList}>
            <li style={styles.navItem}>
              <Link href="/" style={getNavLinkStyle("/")}>
                <HiHome style={styles.icon} />
                Home
              </Link>
            </li>
            <li style={styles.navItem}>
              <Link href="/read" style={getNavLinkStyle("/read")}>
                <HiOutlineBookOpen style={styles.icon} />
                Read
              </Link>
            </li>
            {/* <li style={styles.navItem}>
              <Link href="/about" style={getNavLinkStyle("/about")}>
                <HiInformationCircle style={styles.icon} />
                About
              </Link>
            </li> */}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
