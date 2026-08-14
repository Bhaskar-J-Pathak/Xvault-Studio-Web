"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Percent, Link2, DollarSign } from "lucide-react";

const PLATFORMS = ["YouTube", "Substack", "Blog", "Podcast", "Other"];

const AUDIENCE_SIZES = [
  "Under 1,000",
  "1,000 – 5,000",
  "5,000 – 20,000",
  "20,000 – 100,000",
  "100,000+",
];

export default function AffiliatesPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    platform: "",
    url: "",
    audienceSize: "",
    about: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/affiliates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900">
      {/* Nav */}
      <header className="border-b border-black/[0.06] bg-[#FAFAF8]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <Link
            href="/"
            className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            ← Xvault Studio
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-violet-600 mb-3">
            Affiliate Program
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-stone-900 leading-tight mb-5">
            Write about Xvault.<br className="hidden sm:block" /> Earn every month.
          </h1>
          <p className="text-stone-500 text-lg leading-relaxed max-w-xl">
            If you create content for writers (YouTube, Substack, a blog, a podcast) and you
            genuinely find Xvault useful, we would like to pay you for every writer you bring in.
          </p>
        </div>

        {/* Commission cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-14">
          <div className="rounded-2xl bg-white border border-black/[0.06] p-5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-3">
              <Percent size={15} className="text-violet-600" />
            </div>
            <p className="text-2xl font-semibold text-stone-900 mb-1">20%</p>
            <p className="text-sm text-stone-500 leading-relaxed">
              Recurring commission on every paid plan your referrals subscribe to.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-black/[0.06] p-5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-3">
              <DollarSign size={15} className="text-violet-600" />
            </div>
            <p className="text-2xl font-semibold text-stone-900 mb-1">Monthly</p>
            <p className="text-sm text-stone-500 leading-relaxed">
              Paid out every month via PayPal or bank transfer. No minimum threshold.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-black/[0.06] p-5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-3">
              <Link2 size={15} className="text-violet-600" />
            </div>
            <p className="text-2xl font-semibold text-stone-900 mb-1">No cap</p>
            <p className="text-sm text-stone-500 leading-relaxed">
              Refer as many writers as you like. No limit on earnings.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-14">
          <h2 className="font-display text-2xl font-semibold text-stone-900 mb-6">How it works</h2>
          <div className="space-y-5">
            {[
              {
                step: "01",
                title: "Apply below",
                body: "Tell us who you are, where you create, and roughly how many writers you reach. We review every application personally.",
              },
              {
                step: "02",
                title: "Get your link",
                body: "If approved, you get a unique tracking link and a free Xvault account so you can try it properly before recommending it.",
              },
              {
                step: "03",
                title: "Earn as long as they stay",
                body: "Every writer who subscribes through your link earns you 20% of their subscription, every month they remain active.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-5">
                <div className="text-xs font-mono font-semibold text-violet-400 w-6 shrink-0 pt-0.5">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-stone-900 mb-1">{title}</p>
                  <p className="text-stone-500 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What we look for */}
        <div className="mb-14 rounded-2xl bg-violet-50 border border-violet-200/60 p-7">
          <h2 className="font-display text-xl font-semibold text-stone-900 mb-4">
            What we look for
          </h2>
          <ul className="space-y-2.5">
            {[
              "Your audience is primarily writers: novelists, fiction writers, aspiring authors",
              "You create regularly and have an established presence (audience size is less important than relevance)",
              "You are willing to use Xvault genuinely before recommending it",
              "You produce content in English",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-stone-600">
                <Check size={14} className="text-violet-600 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-stone-400 mt-4 leading-relaxed">
            We do not require a minimum follower count. A Substack with 800 dedicated novelists
            is worth more to us than a general writing channel with 50,000 subscribers.
          </p>
        </div>

        {/* Application form */}
        <div className="mb-4">
          <h2 className="font-display text-2xl font-semibold text-stone-900 mb-2">
            Apply to join
          </h2>
          <p className="text-stone-500 text-sm mb-8">
            We review every application and reply within a few days.
          </p>

          {status === "success" ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200/60 p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <Check size={18} className="text-emerald-600" />
              </div>
              <p className="font-semibold text-stone-900 mb-1">Application received</p>
              <p className="text-stone-500 text-sm">
                We will review it and get back to you at the email you provided.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name + Email */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                    Your name
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition"
                  />
                </div>
              </div>

              {/* Platform + Audience size */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                    Primary platform
                  </label>
                  <select
                    required
                    value={form.platform}
                    onChange={set("platform")}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition appearance-none"
                  >
                    <option value="" disabled>Select platform</option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                    Approximate audience size
                  </label>
                  <select
                    required
                    value={form.audienceSize}
                    onChange={set("audienceSize")}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition appearance-none"
                  >
                    <option value="" disabled>Select range</option>
                    {AUDIENCE_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                  Link to your channel, newsletter, or website
                </label>
                <input
                  required
                  type="url"
                  value={form.url}
                  onChange={set("url")}
                  placeholder="https://your-channel-or-newsletter.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition"
                />
              </div>

              {/* About */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                  Tell us about your audience
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.about}
                  onChange={set("about")}
                  placeholder="What kind of writers follow you? What do you mostly write about? Why do you think Xvault would be relevant to them?"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition resize-none"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-500">
                  Something went wrong. Please try again or email us at hello@xvaultstudio.com.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {status === "loading" ? "Sending…" : <>Submit application <ArrowRight size={15} /></>}
              </button>
            </form>
          )}
        </div>

        {/* FAQ */}
        <div className="mt-16 pt-10 border-t border-stone-200 space-y-7">
          <h2 className="font-display text-xl font-semibold text-stone-900">Questions</h2>

          {[
            {
              q: "How is the commission tracked?",
              a: "You get a unique link with your referral code embedded. When someone signs up through your link and converts to a paid plan, that conversion is attributed to you.",
            },
            {
              q: "When does commission stop?",
              a: "You earn 20% of each billing cycle for as long as the subscriber stays active. If they cancel, the commission stops for that subscriber.",
            },
            {
              q: "Do I need a minimum audience size?",
              a: "No. We care more about how relevant your audience is than how large it is. A small newsletter of dedicated novelists is worth more than a large general writing channel.",
            },
            {
              q: "Do I need to disclose the affiliation?",
              a: "Yes, and we expect it. Disclose that you have an affiliate relationship with Xvault in any content where your link appears. This is both a legal requirement and the honest thing to do.",
            },
            {
              q: "What if I don't like Xvault after trying it?",
              a: "Then don't promote it. We'd rather you decline than recommend something you don't actually believe in. We'll give you a free account first so you can form a real opinion.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="font-semibold text-stone-800 mb-1.5 text-sm">{q}</p>
              <p className="text-stone-500 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
