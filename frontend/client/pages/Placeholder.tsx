import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function PlaceholderPage({
  title,
  description,
  cta,
}: {
  title: string;
  description: ReactNode;
  cta?: { label: string; to: string };
}) {
  return (
    <section className="container py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-muted-foreground">{description}</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
          {cta && (
            <Button asChild variant="secondary">
              <Link to={cta.to}>{cta.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
