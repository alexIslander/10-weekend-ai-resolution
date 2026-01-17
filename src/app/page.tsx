import Link from "next/link";
import { Card } from "@/components/Card";

export default function HomePage() {
  return (
    <main className="space-y-16">
      <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 animate-fade-up">
          <p className="kicker">DualReveal</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-navy">
            Turn unspoken wishes into a shared reveal.
          </h1>
          <p className="text-lg text-navy/70">
            A private, guided quiz designed for couples. One partner purchases, the
            other answers once, and you receive a beautiful, organized reveal.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/purchase" className="btn-primary">
              Start the reveal
            </Link>
            <a href="#how" className="btn-secondary">
              How it works
            </a>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="badge">Private by design</span>
            <span className="badge">One-time link</span>
            <span className="badge">Takes 5 minutes</span>
          </div>
        </div>
        <div className="space-y-6">
          <Card className="animate-slide-in">
            <p className="text-sm uppercase tracking-[0.3em] text-mint-600">
              Inside the reveal
            </p>
            <h2 className="mt-4 text-2xl font-semibold">
              See what your partner actually wants.
            </h2>
            <p className="mt-3 text-sm text-navy/70">
              Eight questions, carefully worded for warmth and honesty. The answers
              arrive in a celebratory reveal view you can revisit any time.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Comfort rituals",
                "Weekend wishes",
                "Surprise ideas",
                "Support needs"
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-mint-200 bg-mint-50/60 px-4 py-3 text-sm"
                >
                  <span className="font-medium text-navy">{item}</span>
                  <span className="text-xs uppercase tracking-[0.25em] text-mint-600">
                    Reveal
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="bg-navy text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Designed for trust
            </p>
            <p className="mt-3 text-base text-white/80">
              No public feeds. No social sharing. Just the two of you, with the
              option to delete data after your reveal window.
            </p>
          </Card>
        </div>
      </section>

      <section id="how" className="space-y-8">
        <div className="space-y-3">
          <p className="kicker">How it works</p>
          <h2 className="section-title">Three gentle steps.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Purchase",
              text: "Enter your email, apply any coupon, and create the reveal."
            },
            {
              title: "Share",
              text: "Send the magic link to your partner. They only answer once."
            },
            {
              title: "Reveal",
              text: "Open the completed reveal and plan your next moment together."
            }
          ].map((step, index) => (
            <Card key={step.title} className="space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-mint-600">
                Step {index + 1}
              </p>
              <h3 className="text-xl font-semibold text-navy">{step.title}</h3>
              <p className="text-sm text-navy/70">{step.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="space-y-4">
          <p className="kicker">Details</p>
          <h2 className="section-title">Built for calm, not pressure.</h2>
          <p className="text-sm text-navy/70">
            DualReveal keeps the tone warm and respectful. Every answer stays
            private. The respondent can only submit once.
          </p>
        </Card>
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-navy">What you receive</h3>
          <ul className="space-y-3 text-sm text-navy/70">
            <li>Eight thoughtful prompts crafted for intimacy.</li>
            <li>A shareable dashboard with status tracking.</li>
            <li>A reveal view designed for clarity and celebration.</li>
          </ul>
          <Link href="/purchase" className="btn-primary w-fit">
            Begin now
          </Link>
        </Card>
      </section>
    </main>
  );
}
