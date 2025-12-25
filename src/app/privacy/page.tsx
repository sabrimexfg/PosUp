import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - PosUp by Sabrimex",
  description:
    "Privacy Policy for PosUp by Sabrimex. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-16 px-6 text-center bg-gradient-to-b from-white to-[#f5f5f7]">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#1d1d1f] mb-4">
          Privacy Policy
        </h1>
        <p className="text-lg text-[#86868b] mb-2">
          Your privacy is important to us.
        </p>
        <p className="text-sm text-[#86868b]">Last Updated: November 24, 2024</p>
      </section>

      {/* Main Content */}
      <main className="max-w-[740px] mx-auto py-20 px-6">
        <section className="mb-16 animate-fade-in">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            Introduction
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            Welcome to PosUp by Sabrimex. Sabrimex is a distribution company
            specializing in Mexican potato chips, and PosUp is our point-of-sale
            solution built from real-world business needs. We are committed to
            protecting your privacy and ensuring the security of your personal
            information. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our
            application.
          </p>
          <p className="text-[17px] text-[#424245] leading-relaxed">
            By using our services, you agree to the collection and use of
            information in accordance with this policy.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            Information We Collect
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            We may collect the following types of information to provide and
            improve our services:
          </p>

          <div className="info-card">
            <h3 className="text-xl font-semibold text-[#1d1d1f] mb-4">
              Business Information
            </h3>
            <p className="text-[17px] text-[#424245] leading-relaxed">
              Business name, address, contact details, and tax identification
              numbers required for transaction processing and compliance.
            </p>
          </div>

          <ul className="space-y-3 mt-5">
            <li className="relative pl-6 text-[17px] text-[#424245]">
              <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
              <strong>Transaction Data</strong> — Sales records, payment
              information, product inventory, and transaction history
            </li>
            <li className="relative pl-6 text-[17px] text-[#424245]">
              <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
              <strong>User Account Information</strong> — Employee names,
              usernames, and secure access credentials
            </li>
            <li className="relative pl-6 text-[17px] text-[#424245]">
              <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
              <strong>Device Information</strong> — Device identifiers,
              operating system, and app version
            </li>
            <li className="relative pl-6 text-[17px] text-[#424245]">
              <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
              <strong>Usage Data</strong> — How you interact with our
              application, features used, and diagnostic logs
            </li>
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            How We Use Your Information
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            We use the collected information for the following purposes:
          </p>
          <ul className="space-y-3">
            {[
              "To provide and maintain our POS services",
              "To process transactions and manage your inventory",
              "To generate sales reports and business analytics",
              "To improve and optimize our application experience",
              "To provide customer support and respond to inquiries",
              "To send important updates and service notifications",
              "To comply with legal and regulatory obligations",
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
            Data Storage & Security
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            We implement industry-leading security measures to protect your
            data:
          </p>

          <div className="info-card">
            <h3 className="text-xl font-semibold text-[#1d1d1f] mb-4">
              Our Security Practices
            </h3>
            <ul className="space-y-3">
              {[
                "End-to-end encryption of sensitive data in transit and at rest",
                "Secure authentication with Firebase Auth and Google Sign-In",
                "Regular security audits and vulnerability assessments",
                "Role-based access controls with 32+ granular permissions",
                "Offline-first architecture with secure local storage",
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
            Your data may be stored locally on your device using Core Data
            and/or on secure Firebase cloud servers, depending on your
            configuration preferences. We use Firestore for real-time cloud
            synchronization with automatic offline support.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            Data Sharing
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            We do not sell your personal information. We may share your
            information only in the following circumstances:
          </p>
          <ul className="space-y-3">
            {[
              "With your explicit consent",
              "With trusted service providers who assist in operating our application (Firebase, Google Cloud)",
              "To comply with legal requirements, court orders, or government requests",
              "To protect our rights, privacy, safety, or property",
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
            Your Rights
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-5">
            Depending on your location, you may have the following rights
            regarding your data:
          </p>
          <ul className="space-y-3">
            <li className="relative pl-6 text-[17px] text-[#424245]">
              <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
              <strong>Access</strong> — Request a copy of your personal data
            </li>
            <li className="relative pl-6 text-[17px] text-[#424245]">
              <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
              <strong>Correction</strong> — Request correction of inaccurate
              data
            </li>
            <li className="relative pl-6 text-[17px] text-[#424245]">
              <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
              <strong>Deletion</strong> — Request deletion of your personal data
            </li>
            <li className="relative pl-6 text-[17px] text-[#424245]">
              <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
              <strong>Portability</strong> — Request transfer of your data to
              another service
            </li>
            <li className="relative pl-6 text-[17px] text-[#424245]">
              <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-[#7C3AED] rounded-full" />
              <strong>Opt-out</strong> — Opt-out of certain data processing
              activities
            </li>
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            Data Retention
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed">
            We retain your information for as long as necessary to provide our
            services and fulfill the purposes outlined in this policy.
            Transaction records may be retained as required by applicable tax
            and accounting regulations. We use soft-delete functionality to
            maintain audit trails while respecting your deletion requests.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            Children&apos;s Privacy
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed">
            Our application is designed for business use and is not intended for
            individuals under the age of 18. We do not knowingly collect
            personal information from children.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            Policy Updates
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed">
            We may update this Privacy Policy from time to time to reflect
            changes in our practices or for legal, operational, or regulatory
            reasons. We will notify you of any material changes by posting the
            new Privacy Policy on this page and updating the &quot;Last
            Updated&quot; date.
          </p>
        </section>

        <section id="contact">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-6">
            Contact Us
          </h2>
          <p className="text-[17px] text-[#424245] leading-relaxed mb-6">
            If you have any questions about this Privacy Policy or our data
            practices, we&apos;re here to help.
          </p>
          <div className="contact-card">
            <h3 className="text-2xl font-semibold mb-3">Get in Touch</h3>
            <p className="text-white/80 mb-4">
              Our team is ready to answer your privacy-related questions.
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
