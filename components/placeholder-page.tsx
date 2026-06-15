'use client';

interface PlaceholderPageProps {
  title: string;
  description: string;
  message?: string;
  apiHint?: string;
}

export function PlaceholderPage({ title, description, message, apiHint }: PlaceholderPageProps) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground mb-6">{description}</p>
      <div className="bg-card border border-border rounded-lg p-6">
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
        {apiHint && (
          <p className="text-xs text-muted-foreground mt-3 font-mono bg-secondary px-3 py-2 rounded">
            {apiHint}
          </p>
        )}
      </div>
    </div>
  );
}
