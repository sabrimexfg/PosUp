import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - PosUp by Sabrimex",
  description:
    "Terms of Service for PosUp by Sabrimex. Read our terms and conditions for using our point-of-sale application.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-16 px-6 text-center bg-gradient-to-b from-white to-[#f5f5f7]">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#1d1d1f] mb-4">
          Terms of Service
        </h1>
        <p className="text-lg text-[#86868b] mb-2">
          Please read these terms carefully before using PosUp.
        </p>
        <p className="text-sm text-[#86868b]">Last Updated: November 24, 2024</p>
      </section>

      {/* Main Content */}
      <main className="max-w-[740px] mx-auto py-20 px-6">
        <section className="mb-16 animate-fade-in">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            1. Acceptance of Terms
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            By accessing or using PosUp (&quot;the App&quot;), a product of
            Sabrimex, you agree to be bound by these Terms of Service
            (&quot;Terms&quot;). If you do not agree to these Terms, please do
            not use the App.
          </p>
          <p className="text-[17px] text-[#424245] leading-relaxed">
            We reserve the right to modify these Terms at any time. Your
            continued use of the App following any changes constitutes
            acceptance of the modified Terms.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            2. Description of Service
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            PosUp is a point-of-sale application designed for iOS devices that
            provides:
          </p>
          <ul className="space-y-3 mb-5">
            {[
              "Order management and processing",
              "Inventory tracking and management",
              "Customer relationship management",
              "Sales reporting and analytics",
              "Staff management with role-based permissions",
              "Receipt generation and printing",
              "Cloud synchronization and offline functionality",
            ].map((item) => (
              <li
                key={item}
                className="relative pl-6 text-[17px] text-[#424245]"
              >
                <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            3. Account Registration
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            To use PosUp, you must:
          </p>
          <ul className="space-y-3 mb-5">
            {[
              "Create an account using valid credentials",
              "Provide accurate and complete registration information",
              "Maintain the security of your account credentials",
              "Be at least 18 years of age or the legal age in your jurisdiction",
              "Accept responsibility for all activities under your account",
            ].map((item) => (
              <li
                key={item}
                className="relative pl-6 text-[17px] text-[#424245]"
              >
                <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-[17px] text-[#424245] leading-relaxed">
            You agree to notify us immediately of any unauthorized use of your
            account or any other security breach.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            4. Subscription and Payments
          </h2>
          <div className="info-card">
            <h3 className="text-xl font-semibold text-[#1d1d1f] mb-4">
              Billing Terms
            </h3>
            <ul className="space-y-3">
              {[
                "Subscription fees are billed in advance on a recurring basis (monthly or annually)",
                "All fees are non-refundable unless otherwise stated",
                "Prices are subject to change with reasonable notice",
                "You are responsible for all applicable taxes",
              ].map((item) => (
                <li
                  key={item}
                  className="relative pl-6 text-[17px] text-[#424245]"
                >
                  <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[17px] text-[#424245] leading-relaxed mt-5">
            Failure to pay fees may result in suspension or termination of your
            access to the App. You may cancel your subscription at any time, but
            no refunds will be provided for partial billing periods.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            5. Acceptable Use
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            You agree NOT to use PosUp to:
          </p>
          <ul className="space-y-3">
            {[
              "Violate any applicable laws or regulations",
              "Infringe on intellectual property rights of others",
              "Transmit malicious code, viruses, or harmful data",
              "Attempt to gain unauthorized access to our systems",
              "Interfere with the proper functioning of the App",
              "Engage in fraudulent transactions or activities",
              "Resell, sublicense, or redistribute the App without authorization",
              "Use the App for any illegal business activities",
            ].map((item) => (
              <li
                key={item}
                className="relative pl-6 text-[17px] text-[#424245]"
              >
                <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            6. Data and Content
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            <strong>Your Data:</strong> You retain ownership of all business
            data, customer information, and content you enter into PosUp. You
            grant us a limited license to store, process, and display your data
            solely for the purpose of providing the service.
          </p>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            <strong>Data Accuracy:</strong> You are responsible for the accuracy
            and legality of the data you input. We are not responsible for any
            errors in your business records, inventory counts, or financial
            calculations resulting from incorrect data entry.
          </p>
          <p className="text-[17px] text-[#424245] leading-relaxed">
            <strong>Backups:</strong> While we implement measures to protect
            your data, you are responsible for maintaining independent backups
            of critical business information.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            7. Intellectual Property
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            PosUp and all associated intellectual property, including but not
            limited to software, design, logos, and documentation, are owned by
            Sabrimex and protected by copyright, trademark, and other
            intellectual property laws.
          </p>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            You are granted a limited, non-exclusive, non-transferable license
            to use the App for your internal business purposes only.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            8. Disclaimer of Warranties
          </h2>
          <div className="info-card">
            <h3 className="text-xl font-semibold text-[#1d1d1f] mb-4">
              Important Notice
            </h3>
            <p className="text-[17px] text-[#424245] leading-relaxed">
              PosUp is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;
              without warranties of any kind, either express or implied,
              including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and
              non-infringement.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            9. Limitation of Liability
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            To the maximum extent permitted by law, Sabrimex and its officers,
            directors, employees, and agents shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages,
            loss of profits, revenue, data, or business opportunities.
          </p>
        </section>

        <section id="contact">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            10. Contact Information
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-6">
            If you have any questions about these Terms of Service, please
            contact us:
          </p>
          <div className="contact-card">
            <h3 className="text-2xl font-semibold mb-3">Get in Touch</h3>
            <p className="text-white/80 mb-4">
              Our team is ready to answer your questions.
            </p>
            <a
              href="mailto:admin@sabrimex.us"
              className="inline-block bg-white text-[#7C3AED] px-6 py-3 rounded-full font-medium hover:bg-[#f5f5f7] transition-colors"
            >
              admin@sabrimex.us
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
