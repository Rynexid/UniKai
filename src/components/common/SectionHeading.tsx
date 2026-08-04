interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export default function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="space-y-2">
      <p className="font-display text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
        {eyebrow}
      </p>
      <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
