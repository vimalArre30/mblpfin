"use client";

import Link from "next/link";
import { useState } from "react";
import { BRAND, NAV_LINKS, LINKS } from "@/lib/constants";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <nav className="max-w-content mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-playfair text-xl font-bold text-ink tracking-tight hover:text-navy transition-colors"
        >
          {BRAND.name}
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="font-inter text-sm text-body hover:text-navy transition-colors font-medium"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden lg:block">
          <Button href={LINKS.youtube} variant="primary" external>
            Watch on YouTube
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-surface-gray transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span
            className={`block w-5 h-0.5 bg-ink transition-all duration-300 ${
              open ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-ink transition-all duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-ink transition-all duration-300 ${
              open ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border bg-white">
          <div className="max-w-content mx-auto px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-inter text-base text-body hover:text-navy transition-colors font-medium py-1"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <Button href={LINKS.youtube} variant="primary" external className="w-full">
                Watch on YouTube
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
