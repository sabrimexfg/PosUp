import Link from "next/link";
import Image from "next/image";

interface NavbarProps {
  activePage?: "home" | "software" | "support";
}

export function Navbar({ activePage }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white/85 backdrop-blur-xl z-[1000] border-b border-black/[0.08]">
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
        <div className="hidden md:flex gap-8 items-center">
          <Link
            href="/"
            className={`text-[15px] font-medium transition-colors ${
              activePage === "home"
                ? "text-[#1d1d1f]"
                : "text-[#86868b] hover:text-[#1d1d1f]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/posup"
            className={`text-[15px] font-medium transition-colors ${
              activePage === "software"
                ? "text-[#1d1d1f]"
                : "text-[#86868b] hover:text-[#1d1d1f]"
            }`}
          >
            Software
          </Link>
          <Link
            href="/support"
            className={`text-[15px] font-medium transition-colors ${
              activePage === "support"
                ? "text-[#1d1d1f]"
                : "text-[#86868b] hover:text-[#1d1d1f]"
            }`}
          >
            Support
          </Link>
          <Link
            href="/dashboard"
            className="bg-[#7C3AED] text-white px-5 py-2.5 rounded-full font-semibold text-[15px] hover:bg-[#6D28D9] transition-all hover:scale-[1.02]"
          >
            Log In
          </Link>
        </div>
      </div>
    </nav>
  );
}
