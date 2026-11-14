"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  Mail,
  FileText,
  HelpCircle,
  X,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// 1. Contact Us Modal
function ContactModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText("support@datanarrator.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4a7ff7] flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contact Us</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">We are here to help you get the most out of DataNarrator</p>
          </div>
        </div>

        <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-zinc-200">Support Email:</span>
            <span className="font-mono text-[#4a7ff7]">support@datanarrator.com</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 text-slate-700 dark:text-zinc-200 font-medium hover:bg-slate-50 text-[11px] transition-colors cursor-pointer"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {sent ? (
          <div className="py-8 text-center text-emerald-600 dark:text-emerald-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-10 h-10" />
            <p className="font-semibold text-sm">Thank you! Your message has been received.</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-3.5 text-left text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex. Alex Morgan"
                className="w-full px-3.5 py-2.5 border rounded-xl outline-none border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7]"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full px-3.5 py-2.5 border rounded-xl outline-none border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7]"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Message
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your inquiry or question..."
                className="w-full px-3.5 py-2.5 border rounded-xl outline-none border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7] resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#4a7ff7] hover:bg-[#3870ec] active:scale-95 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// 2. Terms & Conditions Modal
function TermsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4a7ff7] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Terms &amp; Conditions</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Rules and guidelines for using the DataNarrator platform</p>
          </div>
        </div>

        <div className="overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-zinc-300 pr-2 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">1. Acceptance of Terms</h4>
            <p>By accessing or utilizing DataNarrator, you agree to comply with and be bound by these terms. If you disagree with any part, you may discontinue use of the platform.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">2. Data Ownership &amp; Privacy</h4>
            <p>You retain 100% full ownership, rights, and intellectual property over any datasets, spreadsheets, or files uploaded to DataNarrator. DataNarrator does not sell, license, or transfer your proprietary data to external parties.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">3. Permitted Platform Use</h4>
            <p>Users must not upload malicious files, violate copyright, or attempt to disrupt the integrity or security of the narrative generation pipeline.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">4. Availability &amp; Warranties</h4>
            <p>DataNarrator is provided &ldquo;as is&rdquo;. While we strive for 99.9% uptime and high accuracy in automated statistical evaluations, users should verify analytical outputs for critical financial or regulatory submissions.</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

// 3. Privacy Policy Modal
function PrivacyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Privacy Policy</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Our commitment to enterprise-grade data protection</p>
          </div>
        </div>

        <div className="overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-zinc-300 pr-2 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">1. Zero Training Policy</h4>
            <p>Your datasets and resulting stories are strictly private. DataNarrator never uses customer data to train foundation models or share insights across accounts.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">2. Encryption Standards</h4>
            <p>Data transmitted between your browser and our services is secured with TLS 1.3 encryption, and at-rest storage utilizes AES-256 standards.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">3. Local Session Control</h4>
            <p>Authentication and session parameters are safely isolated to your current browser session, giving you full control to terminate sessions at any time.</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// 4. Frequently Asked Questions Modal
function FAQModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const faqs = [
    {
      q: "How does DataNarrator clean and prepare messy datasets?",
      a: "Our Smart Cleaning Studio handles data normalization in three explicit pillars: (1) Missing Values unification with null, 0, or custom placeholders; (2) Inconsistent Formats resolution by showing all detected formats in each column for you to pick the target standard; and (3) Duplicate Columns handling via AI-suggested renaming for different data or one-click merging for repeated columns.",
    },
    {
      q: "What file formats does DataNarrator support?",
      a: "DataNarrator natively supports CSV, XLSX (Excel), and XLS tabular spreadsheets. Uploaded datasets are automatically parsed with schema validation and data quality diagnostics.",
    },
    {
      q: "How does AI transform raw data into narrative stories?",
      a: "Our engine performs automated statistical computation, discovers correlations and anomalies, generates appropriate visual charts, and composes executive textual synthesis explaining what the data means.",
    },
    {
      q: "Is our enterprise data safe and private?",
      a: "Yes. All uploaded data is encrypted in transit and at rest. Data is isolated to your session, and we never use your proprietary data to train third-party AI models.",
    },
    {
      q: "Can I export stories to PDF or share them with my team?",
      a: "Yes. Generated dashboards and narrative summaries can be customized, downloaded as publication-ready PDFs, or shared with teammates.",
    },
    {
      q: "How can I try DataNarrator right now?",
      a: "You can sign in using our demo credentials (admin / 123456) in the login card to experience the full workspace immediately.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4a7ff7] flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Everything you need to know about DataNarrator and how it handles your data.</p>
          </div>
        </div>

        <div className="overflow-y-auto space-y-3 pr-1 leading-relaxed">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100 hover:text-[#4a7ff7] dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="p-1 rounded-md bg-white dark:bg-zinc-700 text-slate-500 dark:text-zinc-400 shrink-0">
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-3.5 pt-1 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed border-t border-slate-200/50 dark:border-zinc-700/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// 5. Main AppFooter Component (Unified Across All Pages)
export function AppFooter({
  className = "",
}: {
  className?: string;
  variant?: "full" | "app";
}) {
  const [activeModal, setActiveModal] = useState<"contact" | "terms" | "privacy" | "faq" | null>(null);

  return (
    <>
      <footer
        className={`w-full border-t border-slate-200/90 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0c1017] text-slate-600 dark:text-slate-300 py-5 sm:py-6 shrink-0 transition-colors duration-200 ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7">
              <Image src="/logo.png" alt="DataNarrator" fill className="object-contain" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Data<span className="text-[#e99842]">Narrator</span>
            </span>
          </div>

          {/* Action Links: Contact Us, Terms & Conditions, Privacy Policy, Frequently Asked Questions */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setActiveModal("contact")}
              className="hover:text-[#4a7ff7] dark:hover:text-white transition-colors cursor-pointer"
            >
              Contact Us
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("terms")}
              className="hover:text-[#4a7ff7] dark:hover:text-white transition-colors cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="hover:text-[#4a7ff7] dark:hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("faq")}
              className="hover:text-[#4a7ff7] dark:hover:text-white transition-colors cursor-pointer"
            >
              Frequently Asked Questions
            </button>
          </div>

          {/* Security & Copyright */}
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>&copy; {new Date().getFullYear()} DataNarrator</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-[11px] shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Encrypted &bull; Secure</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <ContactModal isOpen={activeModal === "contact"} onClose={() => setActiveModal(null)} />
      <TermsModal isOpen={activeModal === "terms"} onClose={() => setActiveModal(null)} />
      <PrivacyModal isOpen={activeModal === "privacy"} onClose={() => setActiveModal(null)} />
      <FAQModal isOpen={activeModal === "faq"} onClose={() => setActiveModal(null)} />
    </>
  );
}

export default AppFooter;
