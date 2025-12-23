import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support - Sabrimex",
  description:
    "Contact Sabrimex support. We are here to help with your wholesale distribution or software questions.",
};

export default function SupportPage() {
  return (
    <>
      <Navbar activePage="support" />

      {/* Support Hero */}
      <section className="pt-32 pb-16 px-6 text-center bg-gradient-to-b from-white to-[#f5f5f7]">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#1d1d1f] mb-4">
          How can we help?
        </h1>
        <p className="text-lg text-[#86868b]">
          Support for Sabrimex Distribution Partners and POSUp Users.
        </p>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[740px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#1d1d1f] mb-3">
              Contact Support
            </h2>
            <p className="text-[#86868b]">
              Please fill out the form below or email us directly.
            </p>
          </div>

          <div className="contact-card mb-10">
            <h3 className="text-2xl font-semibold mb-3">Direct Contact</h3>
            <p className="text-white/80 mb-2">
              Email:{" "}
              <a
                href="mailto:admin@sabrimex.us"
                className="text-white underline hover:no-underline"
              >
                admin@sabrimex.us
              </a>
            </p>
            <p className="text-white/80">
              Phone:{" "}
              <a
                href="tel:6123664199"
                className="text-white underline hover:no-underline"
              >
                612-366-4199
              </a>
            </p>
          </div>

          <form
            action="mailto:admin@sabrimex.us"
            method="post"
            encType="text/plain"
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="name"
                className="block mb-2 font-semibold text-[#1d1d1f]"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full p-3 border border-[#d2d2d7] rounded-lg text-base focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#EDE9FE] transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block mb-2 font-semibold text-[#1d1d1f]"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full p-3 border border-[#d2d2d7] rounded-lg text-base focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#EDE9FE] transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block mb-2 font-semibold text-[#1d1d1f]"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                className="w-full p-3 border border-[#d2d2d7] rounded-lg text-base font-[inherit] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#EDE9FE] transition-all resize-y"
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center">
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-[#f5f5f7]">
        <div className="max-w-[740px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#1d1d1f]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <div className="info-card">
              <h3 className="text-xl font-semibold text-[#1d1d1f] mb-3">
                How do I reset my PosUp password?
              </h3>
              <p className="text-[#424245]">
                Currently, password resets are handled by our support team for
                security. Please submit a ticket above.
              </p>
            </div>

            <div className="info-card">
              <h3 className="text-xl font-semibold text-[#1d1d1f] mb-3">
                How do I become a wholesale partner?
              </h3>
              <p className="text-[#424245]">
                We serve businesses in Minnesota and Wisconsin. Improved
                coverage is coming soon. Contact us to apply.
              </p>
            </div>

            <div className="info-card">
              <h3 className="text-xl font-semibold text-[#1d1d1f] mb-3">
                Is PosUp data backed up?
              </h3>
              <p className="text-[#424245]">
                Yes, if you have Cloud Sync enabled, your data is securely
                stored and backed up in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer variant="simple" />
    </>
  );
}
