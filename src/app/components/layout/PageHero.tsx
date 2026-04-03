import { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../ui/utils';

interface HeroStat {
  label: string;
  value: string | number;
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  stats?: HeroStat[];
  className?: string;
  children?: ReactNode;
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  stats = [],
  className,
  children,
}: PageHeroProps) {
  return (
    <Card className={cn('relative overflow-hidden border-none bg-[linear-gradient(135deg,rgba(24,59,91,0.96),rgba(31,122,109,0.86))] text-white shadow-[0_30px_80px_rgba(24,59,91,0.28)]', className)}>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.26),transparent_45%)]" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
      <CardContent className="relative space-y-8 p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                {eyebrow}
              </p>
            )}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                {title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 md:text-base">
                {description}
              </p>
            </div>
          </div>

          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {actions}
            </div>
          )}
        </div>

        {(stats.length > 0 || children) && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            {stats.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.25rem] border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {children && (
              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4 text-sm text-white/85 backdrop-blur-sm">
                {children}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
