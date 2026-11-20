const db = globalThis.__APP_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Image } from "@/components/ui/image";

const PORTRAIT =
  "https://media.db.com/images/public/6afff3a90ab09e159ce4e101/ab5070e91_illustration.png";

export default function HeroSection() {
  return (
    <section className="oc-hero" aria-label="OnionCare introduction">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="oc-hero__copy">
          <p className="oc-rise flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={2} />
            Decision support for onion growers
          </p>

          <h1 className="oc-rise oc-rise--2 font-display text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-[3.75rem]">
            Onion disease guidance, from first symptom to next step
          </h1>

          <p className="oc-rise oc-rise--2 max-w-xl text-[1.0625rem] leading-relaxed text-muted-foreground">
            Work through a short symptom checklist, see which diseases the pattern points to, read the
            guidance that has been reviewed for your crop, and reach the agricultural administrator
            assigned to your barangay.
          </p>

          <div className="oc-rise oc-rise--3 flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/register"
              className="inline-flex min-h-[48px] items-center gap-2.5 rounded-md bg-primary px-6 text-[0.8125rem] font-medium uppercase tracking-[0.06em] text-primary-foreground transition-colors hover:bg-[hsl(152_30%_28%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Start a diagnosis
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-md border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              See how it works
            </a>
          </div>

          <p className="oc-rise oc-rise--3 max-w-md border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground">
            The symptom checker is a guide, not a laboratory result, and it does not replace a
            qualified agricultural specialist.
          </p>
        </div>
      </div>

      <div className="oc-hero__media">
        <div className="oc-hero__strips" aria-hidden="true">
          <div className="oc-hero__track">
            <div className="oc-hero__strip" />
            <div className="oc-hero__strip" />
            <div className="oc-hero__strip" />
            <div className="oc-hero__strip" />
          </div>
        </div>
        <div className="oc-hero__portrait">
          <Image
            src={PORTRAIT}
            alt="A farmer standing in an onion field holding freshly harvested onions"
            className="h-full w-full"
            fittingType="fill"
            focalPointX={0.5}
            focalPointY={0.4}
          />
        </div>
      </div>
    </section>
  );
}