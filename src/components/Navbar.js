"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Mail, Home, Info } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo_trans.png"
              alt="Visuai Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="text-base font-semibold text-foreground">Visuai</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link href="/" className="nav-pill">
              Home
            </Link>
            <Link href="/about" className="nav-pill">
              About
            </Link>
            <a
              href="mailto:gregmaceachern98@gmail.com?subject=Issues%20Generating%20Book&body=-%20This%20was%20broken%3A%0A-%20This%20is%20how%20it%20should%20have%20worked%3A%0A-%20Images%20or%20console%20errors%20(optional)%3A"
              className="nav-pill inline-flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              <span>Issues?</span>
            </a>
          </div>

          <button
            type="button"
            onClick={toggleMenu}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted hover:bg-hover-surface hover:text-foreground md:hidden"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border bg-surface md:hidden">
          <div className="space-y-1 px-2 py-2">
            <Link href="/" className="nav-pill block" onClick={closeMenu}>
              <span className="flex items-center gap-3">
                <Home className="h-4 w-4" />
                Home
              </span>
            </Link>
            <Link href="/about" className="nav-pill block" onClick={closeMenu}>
              <span className="flex items-center gap-3">
                <Info className="h-4 w-4" />
                About
              </span>
            </Link>
            <a
              href="mailto:gregmaceachern98@gmail.com?subject=Issues%20Generating%20Book"
              className="nav-pill block"
              onClick={closeMenu}
            >
              <span className="flex items-center gap-3">
                <Mail className="h-4 w-4" />
                Issues?
              </span>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
