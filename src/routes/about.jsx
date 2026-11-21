import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Sprout } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">About OnionCare</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Supporting better-informed crop care</h1>
        <div className="oc-prose mt-8 text-muted-foreground">
          <p>
            OnionCare brings onion crop symptom references and practical growing information together for growers and agricultural administrators.
          </p>
          <p>
            Its guided tools are intended to help people describe what they observe, explore possible explanations, and decide when to ask for local expertise.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-6">
            <Sprout aria-hidden="true" className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">A reference, not a diagnosis</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Crop symptoms can have more than one cause. Use the information as a starting point and consult a qualified agricultural specialist for advice.
            </p>
          </article>
          <article className="rounded-xl border border-border bg-card p-6">
            <BookOpen aria-hidden="true" className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">Information for the field</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The project is designed to make onion crop guidance easier to find and discuss with local agricultural support.
            </p>
          </article>
        </div>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 font-medium text-primary hover:underline">
          Explore OnionCare <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
