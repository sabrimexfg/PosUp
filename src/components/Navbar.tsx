"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface NavbarProps {
  activePage?: "home" | "software" | "support";
}

export function Navbar({ activePage }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-[#FEF3C7]/90 backdrop-blur-xl z-[1000] border-b border-[#A47149]/20">
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/Sabrimex.png"
            alt="Sabrimex Logo"
            width={90}
            height={90}
            className="h-[90px] w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
          <Link
            href="/"
            className={`text-[15px] font-medium transition-colors ${
              activePage === "home"
                ? "text-[#3D2314]"
                : "text-[#A47149] hover:text-[#3D2314]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/posup"
            className={`text-[15px] font-medium transition-colors ${
              activePage === "software"
                ? "text-[#3D2314]"
                : "text-[#A47149] hover:text-[#3D2314]"
            }`}
          >
            Software
          </Link>
          <Link
            href="/support"
            className={`text-[15px] font-medium transition-colors ${
              activePage === "support"
                ? "text-[#3D2314]"
                : "text-[#A47149] hover:text-[#3D2314]"
            }`}
          >
            Support
          </Link>
          <Link
            href="/dashboard"
            className="bg-[#E85D04] text-white px-5 py-2.5 rounded-full font-semibold text-[15px] hover:bg-[#C94D03] transition-all hover:scale-[1.02]"
          >
            Log In
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-6 h-0.5 bg-[#3D2314] transition-all duration-300 ${
              mobileMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-[#3D2314] transition-all duration-300 ${
              mobileMenuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-[#3D2314] transition-all duration-300 ${
              mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-20 left-0 right-0 bg-[#FEF3C7]/95 backdrop-blur-xl border-b border-[#A47149]/20 transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col px-6 py-4 gap-4">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-[17px] font-medium py-2 transition-colors ${
              activePage === "home"
                ? "text-[#3D2314]"
                : "text-[#A47149] hover:text-[#3D2314]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/posup"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-[17px] font-medium py-2 transition-colors ${
              activePage === "software"
                ? "text-[#3D2314]"
                : "text-[#A47149] hover:text-[#3D2314]"
            }`}
          >
            Software
          </Link>
          <Link
            href="/support"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-[17px] font-medium py-2 transition-colors ${
              activePage === "support"
                ? "text-[#3D2314]"
                : "text-[#A47149] hover:text-[#3D2314]"
            }`}
          >
            Support
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="bg-[#E85D04] text-white px-5 py-3 rounded-full font-semibold text-[17px] hover:bg-[#C94D03] transition-all text-center mt-2"
          >
            Log In
          </Link>
        </div>
      </div>
    </nav>
  );
}
