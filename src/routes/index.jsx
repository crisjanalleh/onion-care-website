import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, ClipboardCheck, Search, ShieldCheck, Sprout, Users } from "lucide-react";
import HeroSection from "@/components/site/HeroSection";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const STEPS = [
  {
    icon: Search,
    title: "Describe what you see",
    description: "Use a guided checklist to record visible changes to leaves, stems, bulbs, or seedlings.",
  },
  {
    icon: ClipboardCheck,
    title: "Review possible matches",
    description: "Compare your observations with common onion crop concerns and their reference information.",
  },
  {
    icon: Users,
    title: "Choose a next step",
    description: "Read practical guidance and contact an agricultural administrator when you need help.",
  },
];

const LOOKUP_AREAS = [
  {
    icon: Sprout,
    title: "Crop symptoms",
    description: "Look through visible signs affecting onion leaves, bulbs, roots, and young plants.",
  },
  {
    icon: Search,
    title: "Pests and disease concerns",
    description: "Explore reference material to help narrow down what may be affecting a crop.",
  },
  {
    icon: BookOpen,
    title: "Growing guidance",
    description: "Find practical information on crop care and prevention alongside symptom references.",
  },
];

function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <HeroSection />
      <main>
        <section id="how-it-works" className="scroll-mt-24 border-t border-border/70 bg-card px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">A clearer next step</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">How it works</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                OnionCare helps you organize crop observations and find relevant reference information.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, description }, index) => (
                <article key={title} className="rounded-xl border border-border bg-background p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step {index + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="library" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">Onion crop references</p>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">What you can look up</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Explore the kinds of observations and growing information OnionCare is designed to bring together.
                </p>
              </div>
              <Link to="/register" className="inline-flex min-h-11 items-center gap-2 self-start rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary sm:self-auto">
                Get started <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {LOOKUP_AREAS.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-xl border border-border bg-card p-6">
                  <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Reference results can help guide further observation, but they do not confirm a disease. Seek qualified local advice when a crop is at risk.
            </p>
          </div>
        </section>

        <section id="administrators" className="scroll-mt-24 border-y border-border/70 bg-secondary/60 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">For agricultural administrators</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                OnionCare is also intended to help agricultural staff share locally relevant crop information and support growers seeking guidance.
              </p>
            </div>
            <Link
              to="/login"
              search={{ returnTo: "/admin" }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Administrator sign in <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">About OnionCare</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Useful information for healthier onion crops</h2>
            </div>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                OnionCare brings symptom references and crop guidance into one place for growers and agricultural administrators.
              </p>
              <p>
                It is a decision-support resource, not a substitute for an in-person assessment or professional agricultural advice.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
                More about OnionCare <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
