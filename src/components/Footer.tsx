import Link from "next/link";
import Image from "next/image";

interface FooterProps {
  variant?: "full" | "simple";
}

export function Footer({ variant = "full" }: FooterProps) {
  if (variant === "simple") {
    return (
      <footer className="bg-[#3D2314] py-12 px-6 text-white text-center">
        <div className="max-w-[1200px] mx-auto">
          <p className="text-[13px] text-[#D4A574]">
            &copy; 2025 Sabrimex. All rights reserved.
          </p>
          <p className="text-[13px] text-[#D4A574] mt-2">
            Sabrimex is a trade name of Fernando Gonzalez &amp; Sabrimex LLC.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-[#3D2314] py-[60px] px-6 text-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start flex-wrap gap-10 mb-12 pb-12 border-b border-[#A47149]/30">
          <div className="max-w-[300px]">
            <div className="mb-4">
              <Image
                src="/images/Sabrimex.png"
                alt="Sabrimex Logo"
                width={120}
                height={120}
                className="h-[120px] w-auto"
              />
            </div>
            <p className="text-[14px] text-[#D4A574] leading-relaxed">
              Authentic snack distribution for the modern retailer.
            </p>
            <div className="mt-6 text-[14px] text-[#D4A574]">
              <p>
                <strong className="text-[#FEF3C7]">Headquarters:</strong>
                <br />
                739 2nd Street Ne Hopkins
                <br />
                Minneapolis, MN 55343
              </p>
              <p className="mt-4">
                <strong className="text-[#FEF3C7]">Phone:</strong>
                <br />
                612-366-4199
              </p>
            </div>
          </div>

          <div className="flex gap-20 flex-wrap">
            <div>
              <h4 className="text-[14px] font-semibold uppercase tracking-wider text-[#A47149] mb-5">
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/"
                    className="text-[15px] text-[#FEF3C7] hover:text-[#E85D04] transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#about"
                    className="text-[15px] text-[#FEF3C7] hover:text-[#E85D04] transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="text-[15px] text-[#FEF3C7] hover:text-[#E85D04] transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[14px] font-semibold uppercase tracking-wider text-[#A47149] mb-5">
                Software
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/posup"
                    className="text-[15px] text-[#FEF3C7] hover:text-[#E85D04] transition-colors"
                  >
                    PosUp
                  </Link>
                </li>
                <li>
                  <Link
                    href="/posup#features"
                    className="text-[15px] text-[#FEF3C7] hover:text-[#E85D04] transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="text-[15px] text-[#FEF3C7] hover:text-[#E85D04] transition-colors"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[14px] font-semibold uppercase tracking-wider text-[#A47149] mb-5">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/privacy"
                    className="text-[15px] text-[#FEF3C7] hover:text-[#E85D04] transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-[15px] text-[#FEF3C7] hover:text-[#E85D04] transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[13px] text-[#A47149]">
            &copy; 2025 Sabrimex. All rights reserved.
          </p>
          <p className="text-[13px] text-[#A47149]">
            Sabrimex is a trade name of Fernando Gonzalez &amp; Sabrimex LLC, a
            Minnesota Limited Liability Company.
          </p>
        </div>
      </div>
    </footer>
  );
}
