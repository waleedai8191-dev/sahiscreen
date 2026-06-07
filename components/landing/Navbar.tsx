"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "AI Tech", href: "#ai-tech" },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "#security" },
    { label: "About", href: "#about" },
  ];

  return (
    <>
      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .navbar.scrolled {
          box-shadow: 0 1px 20px rgba(0, 0, 0, 0.08);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .navbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: #7C3AED;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-icon svg {
          width: 18px;
          height: 18px;
          color: white;
        }

        .logo-text {
          font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.3px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 36px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-links a {
          font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          transition: color 0.2s ease;
          letter-spacing: 0.1px;
        }

        .nav-links a:hover {
          color: #7C3AED;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-login {
          font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .btn-login:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .btn-get-started {
          font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: white;
          background: #7C3AED;
          border: none;
          cursor: pointer;
          padding: 9px 20px;
          border-radius: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
        }

        .btn-get-started:hover {
          background: #6d28d9;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
          transform: translateY(-1px);
        }

        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #0f172a;
        }

        /* Mobile menu */
        .mobile-menu {
          display: none;
          position: fixed;
          top: 68px;
          left: 0;
          right: 0;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          z-index: 99;
          padding: 16px 24px 24px;
          flex-direction: column;
          gap: 4px;
        }

        .mobile-menu.open {
          display: flex;
        }

        .mobile-menu a {
          font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
          transition: color 0.2s;
        }

        .mobile-menu a:hover {
          color: #7C3AED;
        }

        .mobile-menu-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }

        .mobile-menu-actions .btn-login {
          text-align: center;
          width: 100%;
          display: block;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .mobile-menu-actions .btn-get-started {
          text-align: center;
          width: 100%;
          display: block;
          padding: 12px;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          .nav-actions {
            display: none;
          }
          .mobile-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>

      <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link href="/" className="logo">
            <div className="logo-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
            </div>
            <span className="logo-text">SahiScreen</span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>

          {/* Desktop Actions */}
          <div className="nav-actions">
            <Link href="/login" className="btn-login">
              Login
            </Link>
            <Link href="/plans" className="btn-get-started">
              Get Started
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <div className="mobile-menu-actions">
          <Link
            href="/login"
            className="btn-login"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Login
          </Link>
          <Link
            href="/plans"
            className="btn-get-started"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Get Started
          </Link>
        </div>
      </div>
    </>
  );
}
