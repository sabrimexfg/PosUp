import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PosUp by Sabrimex - Complete Point of Sale Solution for iOS",
  description:
    "PosUp is a powerful, intuitive point-of-sale app for iOS. Manage sales, inventory, customers, and staff with real-time analytics and offline support. Built by Sabrimex.",
};

const features = [
  {
    icon: "💳",
    title: "Order Management",
    description:
      "Create and manage orders with ease. Support for modifiers, returns, credits, and multiple payment methods.",
    items: [
      "Custom item modifiers & toppings",
      "Draft order auto-save",
      "Digital signature capture",
      "Cash, card, check & digital payments",
    ],
  },
  {
    icon: "📦",
    title: "Inventory Control",
    description:
      "Track stock levels in real-time with automatic alerts and comprehensive cost tracking.",
    items: [
      "Min/max stock level alerts",
      "Cost of goods (COGS) tracking",
      "Category organization",
      "Low stock notifications",
    ],
  },
  {
    icon: "👥",
    title: "Customer Management",
    description:
      "Build lasting relationships with detailed customer profiles, history, and personalized pricing.",
    items: [
      "Complete order history",
      "Custom pricing rules per customer",
      "Customer analytics & insights",
      "Contact management",
    ],
  },
  {
    icon: "📊",
    title: "Reports & Analytics",
    description:
      "Make data-driven decisions with comprehensive reports on sales, profits, and expenses.",
    items: [
      "Real-time sales dashboard",
      "Profit margin analysis",
      "Expense tracking & categorization",
      "PDF export & sharing",
    ],
  },
  {
    icon: "👨‍💼",
    title: "Staff Management",
    description:
      "Control access with granular permissions. Track who does what with complete audit trails.",
    items: [
      "32+ granular permissions",
      "Role-based access control",
      "Staff activity tracking",
      "Secure authentication",
    ],
  },
  {
    icon: "🖨️",
    title: "Receipt Printing",
    description:
      "Professional thermal receipt printing with Bluetooth support and multiple formats.",
    items: [
      "ESCPOS & CPCL formats",
      "Bluetooth printer support",
      "Email & share receipts",
      "Custom receipt templates",
    ],
  },
];

const capabilities = [
  { number: "81", title: "Swift Files", description: "Comprehensive codebase" },
  {
    number: "9",
    title: "Data Models",
    description: "Complete business coverage",
  },
  {
    number: "100%",
    title: "Offline Support",
    description: "Works without internet",
  },
  {
    number: "Real-time",
    title: "Cloud Sync",
    description: "Multi-device synchronization",
  },
  {
    number: "ML",
    title: "Predictions",
    description: "AI-powered sales forecasting",
  },
  {
    number: "Secure",
    title: "Authentication",
    description: "Firebase Auth & Google Sign-In",
  },
];

const techStack = [
  { name: "SwiftUI", description: "Modern declarative UI framework" },
  { name: "Combine", description: "Reactive data binding" },
  { name: "Firebase", description: "Cloud backend & authentication" },
  { name: "Core Data", description: "Local data persistence" },
  { name: "MVVM", description: "Clean architecture pattern" },
  { name: "Core Bluetooth", description: "Printer connectivity" },
];

const useCases = [
  {
    icon: "🏪",
    title: "Retail Stores",
    description:
      "Manage inventory, track sales, and handle customer transactions with ease. Perfect for boutiques, convenience stores, and specialty shops.",
  },
  {
    icon: "🍽️",
    title: "Restaurants & Cafes",
    description:
      "Handle orders with modifiers, manage tabs, and print kitchen tickets. Ideal for quick service and casual dining establishments.",
  },
  {
    icon: "💼",
    title: "Service Providers",
    description:
      "Invoice clients, track expenses, and manage customer relationships. Great for consultants, freelancers, and service businesses.",
  },
];

export default function PosUpPage() {
  return (
    <>
      <Navbar activePage="software" />

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 text-center bg-gradient-to-b from-white to-[#f5f5f7] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(124,58,237,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="inline-flex items-center gap-2 bg-[#EDE9FE] text-[#7C3AED] px-4 py-2 rounded-full text-sm font-semibold mb-6">
          <span>🚀</span>
          <span>Coming Soon to iOS</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-[#1d1d1f] mb-6 max-w-[900px] mx-auto">
          The Complete{" "}
          <span className="gradient-text">Point of Sale</span> Solution
        </h1>

        <p className="text-lg md:text-xl text-[#86868b] max-w-[600px] mx-auto mb-10 leading-relaxed">
          Powerful, intuitive POS system for iOS. Manage sales, inventory,
          customers, and staff with real-time analytics and seamless offline
          support.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <Link href="/support" className="btn-primary">
            Get Notified at Launch
          </Link>
          <a href="#features" className="btn-secondary">
            Explore Features
          </a>
        </div>

        <div className="flex justify-center gap-16 flex-wrap">
          <div className="text-center">
            <div className="text-5xl font-extrabold text-[#1d1d1f] tracking-tight">
              29K+
            </div>
            <div className="text-sm text-[#86868b] font-medium uppercase tracking-wider mt-1">
              Lines of Code
            </div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-extrabold text-[#1d1d1f] tracking-tight">
              45+
            </div>
            <div className="text-sm text-[#86868b] font-medium uppercase tracking-wider mt-1">
              Screens
            </div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-extrabold text-[#1d1d1f] tracking-tight">
              32+
            </div>
            <div className="text-sm text-[#86868b] font-medium uppercase tracking-wider mt-1">
              Permissions
            </div>
          </div>
        </div>

        <div className="mt-10 text-sm text-[#86868b]">
          <Link
            href="/"
            className="hover:text-[#1d1d1f] transition-colors"
          >
            Built with ❤️ by <strong className="text-[#1d1d1f]">Sabrimex</strong>
          </Link>
        </div>
      </section>

      {/* App Screenshots Section */}
      <section className="py-24 px-6 bg-[#111827] overflow-hidden">
        <div className="text-center max-w-[700px] mx-auto mb-16">
          <span className="section-label">App Preview</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5 leading-tight">
            See It In Action
          </h2>
          <p className="text-lg text-white/70">
            A glimpse into the powerful features that make PosUp the complete business solution.
          </p>
        </div>

        <div className="flex gap-6 justify-center flex-wrap max-w-[1400px] mx-auto">
          {/* Screenshot placeholders - replace src with actual screenshots */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 rounded-[32px] blur-xl group-hover:blur-2xl transition-all" />
            <Image
              src="/images/app/screenshot6.png"
              alt="PosUp Dashboard"
              width={280}
              height={560}
              className="relative rounded-[32px] shadow-2xl border border-white/10 hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="relative group mt-12">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 rounded-[32px] blur-xl group-hover:blur-2xl transition-all" />
            <Image
              src="/images/app/screenshot2.png"
              alt="PosUp Inventory"
              width={280}
              height={560}
              className="relative rounded-[32px] shadow-2xl border border-white/10 hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 rounded-[32px] blur-xl group-hover:blur-2xl transition-all" />
            <Image
              src="/images/app/screenshot3.png"
              alt="PosUp Orders"
              width={280}
              height={560}
              className="relative rounded-[32px] shadow-2xl border border-white/10 hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="relative group mt-12">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 rounded-[32px] blur-xl group-hover:blur-2xl transition-all" />
            <Image
              src="/images/app/screenshot4.png"
              alt="PosUp Reports"
              width={280}
              height={560}
              className="relative rounded-[32px] shadow-2xl border border-white/10 hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="text-center max-w-[700px] mx-auto mb-16">
          <span className="section-label">Features</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight mb-5 leading-tight">
            Everything You Need to Run Your Business
          </h2>
          <p className="text-lg text-[#86868b]">
            PosUp provides a complete suite of tools to manage every aspect of
            your business operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
          {features.map((feature) => (
            <div key={feature.title} className="feature-card">
              <div className="w-14 h-14 bg-gradient-to-br from-[#7C3AED] to-[#EC4899] rounded-2xl flex items-center justify-center mb-6 text-3xl">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-3">
                {feature.title}
              </h3>
              <p className="text-[#86868b] leading-relaxed mb-5">
                {feature.description}
              </p>
              <ul className="space-y-2.5">
                {feature.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[15px] text-[#424245]"
                  >
                    <span className="text-[#10B981] font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 px-6 bg-[#f5f5f7]">
        <div className="text-center max-w-[700px] mx-auto mb-16">
          <span className="section-label">Capabilities</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight mb-5 leading-tight">
            Built for Scale
          </h2>
          <p className="text-lg text-[#86868b]">
            PosUp is engineered to handle everything from small shops to growing
            multi-location businesses.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-[1200px] mx-auto">
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="bg-white rounded-[20px] p-8 text-center hover:-translate-y-0.5 transition-transform"
            >
              <div className="text-4xl font-extrabold gradient-text mb-2">
                {cap.number}
              </div>
              <h4 className="text-lg font-semibold text-[#1d1d1f] mb-2">
                {cap.title}
              </h4>
              <p className="text-sm text-[#86868b]">{cap.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24 px-6 bg-[#1d1d1f] text-white">
        <div className="text-center max-w-[700px] mx-auto mb-16">
          <span className="section-label">Technology</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5 leading-tight">
            Modern Architecture
          </h2>
          <p className="text-lg text-white/70">
            Built with cutting-edge iOS technologies for performance,
            reliability, and security.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
          {techStack.map((tech) => (
            <div
              key={tech.name}
              className="bg-white/5 border border-white/10 rounded-2xl p-7 text-center hover:bg-white/[0.08] hover:border-[#7C3AED]/50 transition-all"
            >
              <h4 className="text-lg font-semibold mb-2">{tech.name}</h4>
              <p className="text-sm text-white/60">{tech.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 px-6 bg-white">
        <div className="text-center max-w-[700px] mx-auto mb-16">
          <span className="section-label">Use Cases</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight mb-5 leading-tight">
            Perfect For Your Business
          </h2>
          <p className="text-lg text-[#86868b]">
            PosUp adapts to various business types and sizes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1000px] mx-auto">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="bg-gradient-to-br from-[#EDE9FE] to-[#FDF4FF] rounded-3xl p-10 text-center"
            >
              <div className="text-5xl mb-5">{useCase.icon}</div>
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">
                {useCase.title}
              </h3>
              <p className="text-[15px] text-[#86868b] leading-relaxed">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-6 bg-[#f5f5f7]">
        <div className="text-center max-w-[700px] mx-auto mb-10">
          <span className="section-label">About</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight mb-5 leading-tight">
            Created from Experience
          </h2>
        </div>

        <div className="max-w-[800px] mx-auto text-center">
          <p className="text-lg text-[#424245] leading-relaxed mb-6">
            PosUp was built by{" "}
            <Link href="/" className="text-[#7C3AED] hover:underline">
              Sabrimex
            </Link>
            , a distribution company that needed better tools.
          </p>
          <p className="text-lg text-[#424245] leading-relaxed mb-8">
            Features like custom customer pricing, detailed profit tracking,
            granular staff permissions, and offline-first reliability
            aren&apos;t afterthoughts—they&apos;re core capabilities we needed
            to run our business effectively.
          </p>

          <Link href="/" className="inline-flex flex-col items-center gap-4">
            <Image
              src="/images/Sabrimex.png"
              alt="Sabrimex Logo"
              width={140}
              height={140}
              className="h-[140px] w-auto drop-shadow-lg"
            />
            <span className="text-sm text-[#86868b] font-semibold uppercase tracking-widest">
              Built by Sabrimex
            </span>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-center text-white">
        <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">
          Ready to Transform Your Business?
        </h2>
        <p className="text-xl opacity-90 max-w-[500px] mx-auto mb-10">
          Be among the first to experience PosUp when it launches.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/support"
            className="bg-white text-[#7C3AED] px-8 py-4 rounded-full text-lg font-semibold hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all"
          >
            Get Early Access
          </Link>
          <Link
            href="/support"
            className="bg-transparent text-white px-8 py-4 rounded-full text-lg font-semibold border-2 border-white/40 hover:bg-white/10 hover:border-white transition-all"
          >
            Contact Us
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
