"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useState, FormEvent } from "react";

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitStatus("success");
        e.currentTarget.reset();
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Navbar activePage="support" />

      {/* Support Hero */}
      <section className="pt-32 pb-16 px-6 text-center bg-gradient-to-b from-[#FEF3C7] to-[#FDE68A]">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#3D2314] mb-4">
          How can we help?
        </h1>
        <p className="text-lg text-[#5C3A2A]">
          Support for Sabrimex Distribution Partners and POSUp Users.
        </p>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[740px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#3D2314] mb-3">
              Contact Support
            </h2>
            <p className="text-[#A47149]">
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

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#A47149]/20">
            {submitStatus === "success" && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                Thank you! Your message has been sent successfully.
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                Sorry, there was an error sending your message. Please try again
                or email us directly.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 font-semibold text-[#3D2314]"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full p-3 border border-[#A47149]/30 rounded-lg text-base focus:outline-none focus:border-[#E85D04] focus:ring-2 focus:ring-[#FEF3C7] transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 font-semibold text-[#3D2314]"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full p-3 border border-[#A47149]/30 rounded-lg text-base focus:outline-none focus:border-[#E85D04] focus:ring-2 focus:ring-[#FEF3C7] transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block mb-2 font-semibold text-[#3D2314]"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full p-3 border border-[#A47149]/30 rounded-lg text-base font-[inherit] focus:outline-none focus:border-[#E85D04] focus:ring-2 focus:ring-[#FEF3C7] transition-all resize-y"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-[#FEF3C7]/50">
        <div className="max-w-[740px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#3D2314]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <div className="info-card">
              <h3 className="text-xl font-semibold text-[#3D2314] mb-3">
                How do I reset my PosUp password?
              </h3>
              <p className="text-[#5C3A2A]">
                Currently, password resets are handled by our support team for
                security. Please submit a ticket above.
              </p>
            </div>

            <div className="info-card">
              <h3 className="text-xl font-semibold text-[#3D2314] mb-3">
                How do I become a wholesale partner?
              </h3>
              <p className="text-[#5C3A2A]">
                We serve businesses in Minnesota and Wisconsin. Improved
                coverage is coming soon. Contact us to apply.
              </p>
            </div>

            <div className="info-card">
              <h3 className="text-xl font-semibold text-[#3D2314] mb-3">
                Is PosUp data backed up?
              </h3>
              <p className="text-[#5C3A2A]">
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
