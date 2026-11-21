import { SiteHeader } from "@/components/site/SiteHeader";

export function AuthLayout({ title, description, subtitle, icon: Icon, children }) {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-lg items-center px-4 py-10">
        <section className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {Icon ? (
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
          ) : null}
          {title ? <h1 className="text-2xl font-semibold">{title}</h1> : null}
          {description || subtitle ? <p className="mt-2 text-sm text-muted-foreground">{description ?? subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </section>
      </main>
    </div>
  );
}