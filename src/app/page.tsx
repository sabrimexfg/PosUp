import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sabrimex - Minnesota's Premier Snack Wholesaler",
  description:
    "Sabrimex is a leading wholesale distributor of authentic Mexican snacks, serving Minnesota and Wisconsin. We connect businesses with premium products.",
};

export default function HomePage() {
  return (
    <>
      <Navbar activePage="home" />

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 text-center bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(124,58,237,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="inline-flex items-center gap-2 bg-[#EDE9FE] text-[#7C3AED] px-4 py-2 rounded-full text-sm font-semibold mb-6">
          <span>🚛</span>
          <span>Serving MN & WI Since 2018</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-[#1d1d1f] mb-6 max-w-[900px] mx-auto">
          Minnesota&apos;s Premier{" "}
          <br />
          <span className="bg-gradient-to-r from-[#0F172A] to-[#334155] bg-clip-text text-transparent">
            Snack Wholesaler
          </span>
        </h1>

        <p className="text-lg md:text-xl text-[#86868b] max-w-[600px] mx-auto mb-10 leading-relaxed">
          Connecting local businesses with authentic, high-demand Mexican
          snacks. Reliability you can taste, service you can trust.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <Link href="/support" className="btn-primary">
            Become a Partner
          </Link>
          <Link href="/posup" className="btn-secondary">
            Check our Tech
          </Link>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="bg-white border-b border-[#d2d2d7] py-6">
        <div className="flex justify-center gap-10 flex-wrap max-w-[1200px] mx-auto px-6">
          <div className="flex items-center gap-3 font-medium text-[#424245]">
            <span className="text-2xl">📍</span>
            <span>Based in Minnesota</span>
          </div>
          <div className="flex items-center gap-3 font-medium text-[#424245]">
            <span className="text-2xl">🤝</span>
            <span>Trusted by 60+ Stores</span>
          </div>
          <div className="flex items-center gap-3 font-medium text-[#424245]">
            <span className="text-2xl">🚚</span>
            <span>Scheduled Deliveries</span>
          </div>
        </div>
      </section>

      {/* About / History */}
      <section id="about" className="bg-white py-24 px-6">
        <div className="max-w-[740px] mx-auto">
          <div className="text-center mb-14">
            <span className="section-label">Our Story</span>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight mb-5 leading-tight">
              More Than Just a Distributor
            </h2>
            <p className="text-lg text-[#86868b]">
              Fernando Gonzalez & Sabrimex LLC brings the authentic flavored
              potato snacks to the Midwest.
            </p>
          </div>
          <div className="text-center">
            <p className="text-[17px] text-[#424245] leading-relaxed">
              Sabrimex is a family-owned trade name of Fernando Gonzalez &
              Sabrimex LLC, a Minnesota Limited Liability Company. We understand
              the challenges of small business because we are one. From
              inventory headaches to delivery logistics, we&apos;ve lived it.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Bridge */}
      <section className="bg-[#111827] text-white py-24 px-6 overflow-hidden">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-14">
            <div className="flex-1 min-w-[300px]">
              <span className="section-label">Our Technology</span>
              <h2 className="text-3xl md:text-[42px] font-bold text-white mb-6 leading-tight">
                We&apos;re Building the Solution We Need
              </h2>
              <p className="text-lg text-[#94a3b8] mb-8">
                When existing software couldn&apos;t keep up with our wholesale
                demands, we started building our own.{" "}
                <strong className="text-white">PosUp</strong> is the result of
                years of on-the-ground experience—coming soon.
              </p>
              <ul className="space-y-4 mb-10">
                <li className="relative pl-7 text-lg text-[#e2e8f0]">
                  <span className="absolute left-0 text-[#7C3AED]">→</span>
                  Real-time Inventory Tracking
                </li>
                <li className="relative pl-7 text-lg text-[#e2e8f0]">
                  <span className="absolute left-0 text-[#7C3AED]">→</span>
                  Offline-First Reliability
                </li>
                <li className="relative pl-7 text-lg text-[#e2e8f0]">
                  <span className="absolute left-0 text-[#7C3AED]">→</span>
                  Built for Distributors & Retailers
                </li>
              </ul>
              <Link href="/posup" className="btn-primary">
                Explore POSUp
              </Link>
            </div>
            <div className="flex-1 flex justify-center min-w-[300px]">
              <Image
                src="/images/posup1.png"
                alt="PosUp App Icon"
                width={200}
                height={200}
                className="rounded-[40px] shadow-[0_20px_50px_rgba(124,58,237,0.3)]"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
