import Link from "next/link";
import Image from "next/image";

interface NavbarProps {
  activePage?: "home" | "software" | "support";
}

export function Navbar({ activePage }: NavbarProps) {
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
      </div>
    </nav>
  );
}
