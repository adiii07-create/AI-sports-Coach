import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  CloudUpload,
  Dumbbell,
  FileVideo,
  Footprints,
  Info,
  LoaderCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Upload,
  Video,
  X,
  Zap,
} from 'lucide-react';
import type { AnalysisResult, Activity as ActivityType, Metric, Sport } from '@workspace/api-client-react';
import {
  useAnalyzeVideo,
  useHealthCheck,
  useListActivities,
  useListSports,
  useUploadAnalysisVideo,
} from '@workspace/api-client-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const analysisStorageKey = 'ai-sports-coach:last-analysis';

const sportFallbacks: Sport[] = [
  { slug: 'badminton', name: 'Badminton', description: 'Build quick feet, clean movement, and calm rallies.', status: 'available', icon: 'badminton' },
  { slug: 'tennis', name: 'Tennis', description: 'A future home for rhythm, balance, and court coverage.', status: 'coming_soon', icon: 'tennis' },
  { slug: 'football', name: 'Football', description: 'A future home for sharper movement and first touch.', status: 'coming_soon', icon: 'football' },
];

const fallbackActivity: ActivityType = {
  slug: 'footwork-analysis',
  name: 'Footwork Analysis',
  description: 'See how your first step, split step, and recovery work together.',
  status: 'available',
  durationSeconds: 30,
  instructions: [
    'Set your phone on a stable surface, about waist height.',
    'Stand fully in frame with a little space above your head and below your feet.',
    'Perform six side-to-side movements at a steady, comfortable pace.',
    'Pause for one second at each outside position before returning to center.',
  ],
};

function saveAnalysis(result: AnalysisResult) {
  window.localStorage.setItem(analysisStorageKey, JSON.stringify(result));
}

function getSavedAnalysis(id: string) {
  try {
    const stored = window.localStorage.getItem(analysisStorageKey);
    if (!stored) return null;
    const result = JSON.parse(stored) as AnalysisResult;
    return result.id === id ? result : null;
  } catch {
    return null;
  }
}

function IconMark({ small = false }: { small?: boolean }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] ${small ? 'h-8 w-8' : 'h-10 w-10'}`}>
      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--sidebar))] bg-[hsl(var(--accent))]" />
      <Zap size={small ? 16 : 20} strokeWidth={2.8} />
    </div>
  );
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" data-testid="link-brand" className="focus-ring flex items-center gap-3">
      <IconMark small />
      <span className={`font-display text-lg font-bold tracking-[-0.04em] ${light ? 'text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--foreground))]'}`}>
        rally<span className="text-[hsl(var(--accent))]">/</span>coach
      </span>
    </Link>
  );
}

function TopBar({ dark = false }: { dark?: boolean }) {
  const [, setLocation] = useLocation();
  return (
    <header className={`flex items-center justify-between px-5 py-5 md:px-10 ${dark ? 'text-[hsl(var(--sidebar-foreground))]' : ''}`}>
      <Brand light={dark} />
      <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
        <Link href="/sports" data-testid="link-sports-nav" className="focus-ring opacity-75 transition-opacity hover:opacity-100">Explore sports</Link>
        <a href="#how-it-works" data-testid="link-how-it-works" className="focus-ring opacity-75 transition-opacity hover:opacity-100">How it works</a>
        <button onClick={() => setLocation('/sports')} data-testid="button-start-nav" className={`focus-ring rounded-full px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5 ${dark ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'}`}>
          Start training
        </button>
      </nav>
      <button onClick={() => setLocation('/sports')} data-testid="button-mobile-start" className={`focus-ring rounded-full p-2 md:hidden ${dark ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'}`} aria-label="Start training">
        <ArrowRight size={18} />
      </button>
    </header>
  );
}

function Shell({ children, hideHeader = false }: { children: ReactNode; hideHeader?: boolean }) {
  return (
    <div className="noise-overlay min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {!hideHeader && <TopBar />}
      <main>{children}</main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-[hsl(var(--border))] px-5 py-7 text-xs text-[hsl(var(--muted-foreground))] md:flex-row md:items-center md:justify-between md:px-10">
        <Brand />
        <span>Made for the reps between the big moments.</span>
      </footer>
    </div>
  );
}

function PageFrame({ children, eyebrow, title, description }: { children: ReactNode; eyebrow: string; title: ReactNode; description?: string }) {
  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 md:px-10 md:pt-16">
        <div className="animate-rise-in max-w-2xl">
          <p className="font-mono-app text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[.98] tracking-[-0.06em] md:text-6xl">{title}</h1>
          {description && <p className="mt-5 max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))] md:text-lg">{description}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </Shell>
  );
}

function LoadingState({ label = 'Loading your coaching space' }: { label?: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-3" data-testid="status-loading">
      {[1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-3xl bg-[hsl(var(--muted))]" />)}
      <p className="col-span-full flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]"><LoaderCircle size={15} className="animate-spin" />{label}</p>
    </div>
  );
}

function ErrorState({ onRetry, label = 'We could not load this just now.' }: { onRetry: () => void; label?: string }) {
  return (
    <div className="rounded-3xl border border-[hsl(var(--destructive)/.25)] bg-[hsl(var(--destructive)/.06)] p-8" data-testid="status-error">
      <CircleAlert className="text-[hsl(var(--destructive))]" size={24} />
      <h2 className="mt-4 font-display text-2xl font-bold">A small pause.</h2>
      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
      <button onClick={onRetry} data-testid="button-retry" className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-bold text-[hsl(var(--primary-foreground))]">
        <RotateCcw size={15} /> Try again
      </button>
    </div>
  );
}

function Home() {
  const [, setLocation] = useLocation();
  const health = useHealthCheck();
  return (
    <Shell hideHeader>
      <section className="relative overflow-hidden bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]">
        <div className="court-lines absolute inset-0 opacity-20" />
        <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-[hsl(var(--accent)/.12)] blur-3xl" />
        <TopBar dark />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 pt-14 md:grid-cols-[1.1fr_.9fr] md:px-10 md:pb-36 md:pt-20">
          <div className="animate-rise-in">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--sidebar-foreground)/.2)] px-3 py-1.5 font-mono-app text-[10px] uppercase tracking-[.16em] text-[hsl(var(--sidebar-foreground)/.68)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
              Coaching, in your corner
            </div>
            <h1 className="max-w-3xl font-display text-6xl font-bold leading-[.88] tracking-[-0.075em] md:text-8xl">
              Your next<br /><span className="text-[hsl(var(--accent))]">better rep.</span>
            </h1>
            <p className="mt-8 max-w-lg text-base leading-7 text-[hsl(var(--sidebar-foreground)/.68)] md:text-lg">
              Practical feedback for the practice you can do today. Point your phone at the court and build a clearer feel for your movement.
            </p>
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button onClick={() => setLocation('/sports')} data-testid="button-start-training" className="focus-ring group inline-flex items-center gap-3 rounded-full bg-[hsl(var(--accent))] px-5 py-3.5 text-sm font-bold text-[hsl(var(--accent-foreground))] transition-transform hover:-translate-y-1">
                Start with a drill <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
              <a href="#how-it-works" data-testid="link-learn-more" className="focus-ring text-sm font-medium text-[hsl(var(--sidebar-foreground)/.68)] underline decoration-[hsl(var(--accent)/.65)] underline-offset-4 hover:text-[hsl(var(--sidebar-foreground))]">See how it works</a>
            </div>
            <div className="mt-10 flex items-center gap-2 text-xs text-[hsl(var(--sidebar-foreground)/.48)]" data-testid="status-health">
              <span className={`h-2 w-2 rounded-full ${health.isError ? 'bg-[hsl(var(--destructive))]' : 'bg-[hsl(var(--accent))]'}`} />
              {health.isLoading ? 'Checking the coaching desk' : health.isError ? 'Coaching desk is resting' : 'Coaching desk is ready'}
            </div>
          </div>
          <div className="relative mx-auto h-[330px] w-full max-w-[430px] md:h-[440px]">
            <div className="absolute inset-x-8 top-5 bottom-5 rotate-[-7deg] rounded-[2.5rem] border border-[hsl(var(--sidebar-foreground)/.18)] bg-[hsl(var(--sidebar-accent)/.45)] p-4 shadow-2xl">
              <div className="relative flex h-full items-center justify-center overflow-hidden rounded-[1.8rem] border border-[hsl(var(--sidebar-foreground)/.12)] bg-[hsl(var(--accent)/.08)]">
                <div className="absolute inset-0 court-lines opacity-25" />
                <div className="relative h-44 w-44 rounded-full border-2 border-[hsl(var(--accent)/.75)]">
                  <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--accent))]" />
                  <div className="absolute left-[16%] top-[22%] h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />
                  <div className="absolute right-[12%] bottom-[19%] h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
                    <path d="M50 50 L18 27 M50 50 L86 78" fill="none" stroke="hsl(var(--accent))" strokeDasharray="2 3" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="absolute bottom-5 left-5 rounded-xl border border-[hsl(var(--sidebar-foreground)/.15)] bg-[hsl(var(--sidebar)/.75)] px-3 py-2 backdrop-blur">
                  <p className="font-mono-app text-[9px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/.5)]">movement map</p>
                  <p className="mt-1 font-display text-lg font-bold">Ready when you are.</p>
                </div>
              </div>
            </div>
            <div className="animate-float-drift absolute right-1 top-6 rounded-2xl border border-[hsl(var(--sidebar-foreground)/.15)] bg-[hsl(var(--sidebar-accent))] p-4 shadow-xl">
              <Footprints size={20} className="text-[hsl(var(--accent))]" />
              <p className="mt-2 font-mono-app text-[9px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/.5)]">focus today</p>
              <p className="mt-1 font-display text-xl font-bold">First step</p>
            </div>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28">
        <div className="grid gap-12 md:grid-cols-[.65fr_1.35fr]">
          <div>
            <p className="font-mono-app text-[11px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">A simpler kind of feedback</p>
            <h2 className="mt-4 max-w-sm font-display text-4xl font-bold leading-[.98] tracking-[-.06em] md:text-5xl">Practice is where progress gets real.</h2>
          </div>
          <div className="grid gap-0 border-t border-[hsl(var(--border))]">
            {[
              { n: '01', icon: Video, title: 'Choose one clear drill', copy: 'Start small. Pick the movement you want to understand, not everything at once.' },
              { n: '02', icon: CloudUpload, title: 'Record with your phone', copy: 'A short, steady clip is enough to get useful direction. No special kit required.' },
              { n: '03', icon: BarChart3, title: 'Leave with a next rep', copy: 'Get a readable snapshot of what is working and one thing worth trying next.' },
            ].map(({ n, icon: StepIcon, title, copy }) => (
              <div key={n} className="grid gap-4 border-b border-[hsl(var(--border))] py-6 sm:grid-cols-[60px_40px_1fr] sm:items-start">
                <span className="font-mono-app text-xs text-[hsl(var(--muted-foreground))]">{n}</span>
                <StepIcon size={21} className="text-[hsl(var(--primary))]" />
                <div><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-1 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">{copy}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-5 mb-20 rounded-[2rem] bg-[hsl(var(--accent))] px-6 py-12 md:mx-10 md:px-14 md:py-14">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div><p className="font-mono-app text-[10px] font-bold uppercase tracking-[.18em]">Start where you are</p><h2 className="mt-3 max-w-md font-display text-4xl font-bold leading-none tracking-[-.06em]">No coach? No problem. Begin with one rep.</h2></div>
          <button onClick={() => setLocation('/sports')} data-testid="button-cta-explore" className="focus-ring inline-flex items-center gap-3 self-start rounded-full bg-[hsl(var(--primary))] px-5 py-3.5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-1 md:self-end">Explore training <ChevronRight size={17} /></button>
        </div>
      </section>
    </Shell>
  );
}

function SportGlyph({ sport, size = 24 }: { sport: Sport; size?: number }) {
  const Icon = sport.slug === 'badminton' ? Footprints : sport.slug === 'tennis' ? Activity : Dumbbell;
  return <Icon size={size} strokeWidth={1.7} />;
}

function SportsPage() {
  const [, setLocation] = useLocation();
  const sportsQuery = useListSports();
  const sports = sportsQuery.data?.length ? sportsQuery.data : sportFallbacks;
  return (
    <PageFrame eyebrow="01 / choose your arena" title={<>Find your <span className="text-[hsl(var(--chart-2))]">starting line.</span></>} description="Every athlete starts with a place to move. Pick a sport and we’ll keep the first step clear.">
      {sportsQuery.isLoading ? <LoadingState label="Finding your sports" /> : sportsQuery.isError && !sportsQuery.data ? <ErrorState onRetry={() => sportsQuery.refetch()} /> : (
        <div className="grid gap-4 md:grid-cols-3" data-testid="list-sports">
          {sports.map((sport) => {
            const available = sport.status === 'available';
            return (
              <button key={sport.slug} disabled={!available} onClick={() => available && setLocation(`/sports/${sport.slug}`)} data-testid={`card-sport-${sport.slug}`} className={`focus-ring group relative min-h-[255px] overflow-hidden rounded-[1.7rem] border p-6 text-left transition-all ${available ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:-translate-y-1 hover:shadow-xl' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] opacity-80'}`}>
                <span className={`absolute right-6 top-6 rounded-full px-2.5 py-1 font-mono-app text-[9px] uppercase tracking-wider ${available ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>{available ? 'Live now' : 'Soon'}</span>
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${available ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--accent))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}><SportGlyph sport={sport} size={25} /></span>
                <span className="mt-16 block font-display text-3xl font-bold tracking-[-.05em]">{sport.name}</span>
                <span className={`mt-2 block max-w-[220px] text-sm leading-5 ${available ? 'text-[hsl(var(--primary-foreground)/.65)]' : 'text-[hsl(var(--muted-foreground))]'}`}>{sport.description}</span>
                <span className={`absolute bottom-6 right-6 transition-transform group-hover:translate-x-1 ${available ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--muted-foreground))]'}`}><ArrowRight size={21} /></span>
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-10 flex items-start gap-3 border-l-2 border-[hsl(var(--accent))] pl-4 text-sm text-[hsl(var(--muted-foreground))]" data-testid="text-sport-note"><Info size={16} className="mt-0.5 shrink-0" />We’re opening one movement library at a time, so every drill stays useful and easy to follow.</div>
    </PageFrame>
  );
}

function ActivityPage() {
  const params = useParams<{ sportSlug: string }>();
  const sportSlug = params.sportSlug ?? '';
  const [, setLocation] = useLocation();
  const query = useListActivities(sportSlug);
  const sport = sportFallbacks.find((item) => item.slug === sportSlug);
  const activities = query.data?.length ? query.data : sportSlug === 'badminton' ? [fallbackActivity] : [];
  return (
    <PageFrame eyebrow={`02 / ${sport?.name ?? sportSlug}`} title={<>Pick one <span className="text-[hsl(var(--chart-3))]">movement.</span></>} description="Short drills, useful feedback. Choose the session that matches what you want to feel better at today.">
      {query.isLoading ? <LoadingState label="Loading the drill library" /> : query.isError && !query.data ? <ErrorState onRetry={() => query.refetch()} /> : activities.length === 0 ? (
        <div className="rounded-[1.7rem] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center" data-testid="status-empty-activities"><Sparkles className="mx-auto text-[hsl(var(--chart-3))]" /><h2 className="mt-4 font-display text-2xl font-bold">This court is still being prepared.</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">There are no live drills for this sport yet. Try Badminton to explore the first coaching module.</p><Link href="/sports" data-testid="link-back-sports-empty" className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-bold text-[hsl(var(--primary-foreground))]">Back to sports <ArrowRight size={15} /></Link></div>
      ) : (
        <div className="grid gap-5 md:grid-cols-[1.2fr_.8fr]">
           {activities.map((activity) => (
             <button key={activity.slug} onClick={() => activity.status === 'available' && setLocation(`/sports/${sportSlug}/${activity.slug}/instructions`)} disabled={activity.status !== 'available'} data-testid={`card-activity-${activity.slug}`} className="focus-ring group rounded-[1.7rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7 text-left transition-all hover:-translate-y-1 hover:border-[hsl(var(--primary)/.35)] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 md:min-h-[300px]">
              <div className="flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"><Footprints size={25} /></span><span className="font-mono-app text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">{Math.round(activity.durationSeconds / 60) || 1} min drill</span></div>
              <h2 className="mt-16 font-display text-4xl font-bold leading-none tracking-[-.06em]">{activity.name}</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">{activity.description}</p>
               <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold">{activity.status === 'available' ? <>View recording guide <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></> : 'Analysis under development'}</span>
            </button>
          ))}
          <div className="rounded-[1.7rem] bg-[hsl(var(--sidebar))] p-7 text-[hsl(var(--sidebar-foreground))] md:min-h-[300px]"><Target size={25} className="text-[hsl(var(--accent))]" /><p className="mt-16 font-mono-app text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/.5)]">A good session</p><p className="mt-3 max-w-xs font-display text-3xl font-bold leading-none tracking-[-.05em]">Small enough to finish. Clear enough to repeat.</p></div>
        </div>
      )}
    </PageFrame>
  );
}

function Breadcrumbs({ sportSlug, activitySlug, current }: { sportSlug: string; activitySlug: string; current: string }) {
  return <div className="mb-8 flex flex-wrap items-center gap-2 font-mono-app text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]" data-testid="navigation-breadcrumbs"><Link href="/sports" data-testid="link-breadcrumb-sports" className="hover:text-[hsl(var(--foreground))]">Sports</Link><ChevronRight size={12} /><Link href={`/sports/${sportSlug}`} data-testid="link-breadcrumb-sport" className="hover:text-[hsl(var(--foreground))]">{sportSlug}</Link><ChevronRight size={12} /><span>{activitySlug.replaceAll('-', ' ')}</span><ChevronRight size={12} /><span className="text-[hsl(var(--foreground))]">{current}</span></div>;
}

function InstructionsPage() {
  const params = useParams<{ sportSlug: string; activitySlug: string }>();
  const activityQuery = useListActivities(params.sportSlug ?? '');
  const activity = activityQuery.data?.find((item) => item.slug === params.activitySlug) ?? fallbackActivity;
  const [, setLocation] = useLocation();
  const instructions = activity.instructions.length ? activity.instructions : fallbackActivity.instructions;
  if (activity.status !== 'available') {
    return (
      <PageFrame eyebrow="03 / coming soon" title={<>This module is <span className="text-[hsl(var(--chart-3))]">still growing.</span></>} description="We’re building each analysis carefully so the feedback stays grounded in real movement data.">
        <Breadcrumbs sportSlug={params.sportSlug ?? ''} activitySlug={params.activitySlug ?? ''} current="Under development" />
        <div className="rounded-[1.7rem] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10">
          <Sparkles className="text-[hsl(var(--chart-3))]" />
          <h2 className="mt-5 font-display text-3xl font-bold">Analysis under development</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">This activity is visible in the library, but it does not produce metrics or scores yet.</p>
          <button onClick={() => setLocation(`/sports/${params.sportSlug ?? 'badminton'}`)} className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-bold text-[hsl(var(--primary-foreground))]">Back to activities <ArrowRight size={15} /></button>
        </div>
      </PageFrame>
    );
  }
  return (
    <PageFrame eyebrow="03 / set up your shot" title={<>Make the frame <span className="text-[hsl(var(--chart-2))]">count.</span></>} description="A few small setup choices give your feedback more to work with. Take your time; there’s no perfect take.">
      <Breadcrumbs sportSlug={params.sportSlug ?? ''} activitySlug={params.activitySlug ?? ''} current="Instructions" />
      <div className="grid gap-6 md:grid-cols-[.8fr_1.2fr]">
        <div className="relative min-h-[300px] overflow-hidden rounded-[1.7rem] bg-[hsl(var(--sidebar))] p-7 text-[hsl(var(--sidebar-foreground))]">
          <div className="court-lines absolute inset-0 opacity-20" /><div className="relative"><span className="font-mono-app text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/.5)]">Before you record</span><h2 className="mt-5 max-w-xs font-display text-4xl font-bold leading-[.94] tracking-[-.06em]">Steady phone.<br />Full body.<br /><span className="text-[hsl(var(--accent))]">One clear rep.</span></h2><div className="absolute right-1 top-20 flex h-20 w-14 rotate-6 items-center justify-center rounded-lg border-2 border-[hsl(var(--accent))]"><Video size={22} className="text-[hsl(var(--accent))]" /></div></div>
        </div>
        <div className="rounded-[1.7rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-5"><div><p className="font-mono-app text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Recording checklist</p><h2 className="mt-2 font-display text-2xl font-bold">{activity.name}</h2></div><span className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--muted))] px-2.5 py-1.5 font-mono-app text-[10px] text-[hsl(var(--muted-foreground))]"><Clock3 size={13} /> {activity.durationSeconds}s</span></div>
          <ol className="mt-2">{instructions.map((instruction, index) => <li key={instruction} className="flex gap-4 border-b border-[hsl(var(--border))] py-5 last:border-b-0"><span className="font-mono-app text-xs text-[hsl(var(--chart-2))]">0{index + 1}</span><span className="text-sm leading-6">{instruction}</span></li>)}</ol>
          <button onClick={() => setLocation(`/sports/${params.sportSlug}/${params.activitySlug}/upload`)} data-testid="button-ready-to-record" className="focus-ring mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 py-3.5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5">I’m ready to record <ArrowRight size={17} /></button>
        </div>
      </div>
    </PageFrame>
  );
}

function UploadPage() {
  const params = useParams<{ sportSlug: string; activitySlug: string }>();
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activity = fallbackActivity;
  const mutation = useUploadAnalysisVideo({
    request: {
      headers: {
        'sportSlug': params.sportSlug ?? 'badminton',
        'activitySlug': params.activitySlug ?? activity.slug,
      },
    },
  });
  const chooseFile = (selected: File | undefined) => {
    setValidation(null);
    if (!selected) return;
    if (!selected.type.startsWith('video/')) { setFile(null); setValidation('Choose a video file so we can check the clip metadata.'); return; }
    if (selected.size > 250 * 1024 * 1024) { setFile(null); setValidation('That clip is over 250 MB. A shorter clip will be easier to work with.'); return; }
    setFile(selected);
  };
  const submit = () => {
    if (!file) { setValidation('Add a video first, then we can start the check.'); return; }
    mutation.mutate({ data: file }, {
      onSuccess: (result) => { saveAnalysis(result); setLocation(`/analysis/${result.id}`); },
    });
  };
  return (
    <PageFrame eyebrow="04 / bring your rep" title={<>Upload a <span className="text-[hsl(var(--chart-3))]">short clip.</span></>} description="Upload a 5–60 second clip. We’ll detect your pose, measure the movement, and show the evidence behind any score.">
      <Breadcrumbs sportSlug={params.sportSlug ?? ''} activitySlug={params.activitySlug ?? ''} current="Upload" />
      <div className="mx-auto max-w-3xl">
        <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} data-testid="input-video-file" />
        <button onClick={() => inputRef.current?.click()} data-testid="button-choose-video" className={`focus-ring group relative flex min-h-[280px] w-full flex-col items-center justify-center overflow-hidden rounded-[1.7rem] border-2 border-dashed p-8 text-center transition-colors ${file ? 'border-[hsl(var(--chart-2))] bg-[hsl(var(--chart-2)/.07)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/.45)] hover:bg-[hsl(var(--muted)/.45)]'}`}>
          <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${file ? 'bg-[hsl(var(--chart-2))] text-[hsl(var(--card))]' : 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'}`}>{file ? <Check size={31} /> : <CloudUpload size={31} />}</span>
          <span className="mt-5 font-display text-2xl font-bold">{file ? file.name : 'Drop your video here'}</span>
          <span className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · Ready to check` : 'or tap to choose from your phone · MP4, MOV, or WebM'}</span>
          {!file && <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-4 py-2 text-xs font-bold"><Upload size={14} /> Choose video</span>}
        </button>
        {validation && <div className="mt-4 flex items-center gap-2 text-sm text-[hsl(var(--destructive))]" data-testid="status-upload-validation"><CircleAlert size={16} />{validation}</div>}
         {mutation.isError && <div className="mt-4 flex items-center gap-2 text-sm text-[hsl(var(--destructive))]" data-testid="status-upload-error"><CircleAlert size={16} />{mutation.error instanceof Error ? mutation.error.message : 'We couldn’t process that clip. Please try again.'}</div>}
         <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[hsl(var(--muted))] p-4 text-xs leading-5 text-[hsl(var(--muted-foreground))]" data-testid="text-upload-disclaimer"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[hsl(var(--chart-2))]" /><span><strong className="text-[hsl(var(--foreground))]">Honest by design.</strong> Your video is processed temporarily. Scores only appear when enough real body landmarks are detected.</span></div>
        <button onClick={submit} disabled={mutation.isPending} data-testid="button-submit-video" className="focus-ring mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 py-4 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
          {mutation.isPending ? <><LoaderCircle size={17} className="animate-spin" /> Checking clip…</> : <>Start analysis <ArrowRight size={17} /></>}
        </button>
      </div>
    </PageFrame>
  );
}

function ScoreRing({ score }: { score: number | null }) {
  const safeScore = score ?? 0;
  const dash = `${Math.max(0, Math.min(100, safeScore)) * 2.64} 264`;
  return <div className="relative h-44 w-44" data-testid="metric-overall-score"><svg viewBox="0 0 100 100" className="h-full w-full -rotate-90"><circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="7" /><circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--accent))" strokeDasharray={dash} strokeLinecap="round" strokeWidth="7" /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-5xl font-bold tracking-[-.08em]">{score ?? '—'}</span>{score !== null && <span className="font-mono-app text-[9px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">out of 100</span>}</div></div>;
}

function MetricRow({ metric }: { metric: Metric }) {
  const value = metric.value === null ? 'Not measured' : `${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`;
  const score = metric.score === null ? null : metric.score;
  return <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[hsl(var(--border))] py-4 last:border-b-0" data-testid={`metric-row-${metric.key}`}><div><div className="flex items-center gap-2"><p className="text-sm font-bold">{metric.label}</p>{metric.status === 'measured' ? <BadgeCheck size={15} className="text-[hsl(var(--chart-2))]" /> : <Info size={14} className="text-[hsl(var(--muted-foreground))]" />}</div><p className="mt-1 font-mono-app text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{value}</p></div><div className="text-right"><p className="font-display text-2xl font-bold">{score ?? '—'}</p><div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full rounded-full bg-[hsl(var(--chart-2))]" style={{ width: `${score ?? 0}%` }} /></div></div></div>;
}

function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const result = id ? getSavedAnalysis(id) : null;
  const [, setLocation] = useLocation();
  if (!result) return <PageFrame eyebrow="analysis / not found" title={<>This rep got <span className="text-[hsl(var(--chart-3))]">away.</span></>} description="We couldn’t find a saved result for this analysis on this device. Upload a new clip to begin again."><div className="rounded-[1.7rem] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10"><FileVideo className="text-[hsl(var(--chart-3))]" /><h2 className="mt-5 font-display text-2xl font-bold">No saved result here.</h2><p className="mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">Results stay with the browser that started the check, so your practice notes stay close to you.</p><button onClick={() => setLocation('/sports')} data-testid="button-start-new-analysis" className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-bold text-[hsl(var(--primary-foreground))]">Start a new analysis <ArrowRight size={15} /></button></div></PageFrame>;
  const unavailable = result.status === 'processing_unavailable' || result.status === 'insufficient_data';
  return (
    <PageFrame eyebrow={`analysis / ${result.activitySlug.replaceAll('-', ' ')}`} title={unavailable ? <>A clear next step, <span className="text-[hsl(var(--chart-3))] not-italic">not a fake score.</span></> : <>Here’s what your <span className="text-[hsl(var(--chart-2))]">movement says.</span></>} description={result.note}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[hsl(var(--border))] pb-7"><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${unavailable ? 'bg-[hsl(var(--chart-3))]' : 'bg-[hsl(var(--chart-2))]'}`} /><span className="font-mono-app text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">{unavailable ? 'Processing unavailable' : 'Analysis ready'}</span></div><span className="font-mono-app text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">ID {result.id.slice(0, 8)}</span></div>
       {unavailable ? <div className="mt-8 grid gap-6 md:grid-cols-[1fr_.8fr]"><div className="rounded-[1.7rem] bg-[hsl(var(--sidebar))] p-8 text-[hsl(var(--sidebar-foreground))]"><CircleAlert className="text-[hsl(var(--accent))]" size={27} /><h2 className="mt-7 max-w-sm font-display text-4xl font-bold leading-none tracking-[-.06em]">Your clip needs<br /><span className="text-[hsl(var(--accent))]">a clearer take.</span></h2><p className="mt-5 max-w-md text-sm leading-6 text-[hsl(var(--sidebar-foreground)/.63)]">{result.note || 'Insufficient video data for reliable analysis.'}</p><button onClick={() => setLocation('/sports')} data-testid="button-practice-another" className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--accent))] px-4 py-3 text-sm font-bold text-[hsl(var(--accent-foreground))]">Upload another video <ArrowRight size={15} /></button></div><div className="rounded-[1.7rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8"><p className="font-mono-app text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Detection report</p><h3 className="mt-4 font-display text-2xl font-bold">No score was generated.</h3><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Use the recording guide and try again with one full body in frame.</p></div></div> : <><div className="mt-8 grid gap-6 md:grid-cols-[.7fr_1.3fr]"><div className="flex flex-col items-center justify-center rounded-[1.7rem] bg-[hsl(var(--primary))] p-8 text-[hsl(var(--primary-foreground))]"><p className="font-mono-app text-[10px] uppercase tracking-widest text-[hsl(var(--primary-foreground)/.58)]">Overall score</p><ScoreRing score={result.overallScore} /></div><div className="rounded-[1.7rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7"><div className="flex items-center justify-between"><h2 className="font-display text-2xl font-bold">Your movement markers</h2><BarChart3 size={21} className="text-[hsl(var(--chart-2))]" /></div><div className="mt-3">{result.metrics.map((metric) => <MetricRow key={metric.key} metric={metric} />)}</div></div></div><div className="mt-6 grid gap-6 md:grid-cols-2"><InsightCard title="What’s working" icon={Trophy} items={result.strengths} tone="green" /><InsightCard title="Try this next" icon={Target} items={result.improvements} tone="yellow" /></div><div className="mt-6 rounded-[1.7rem] bg-[hsl(var(--accent))] p-7"><p className="font-mono-app text-[10px] font-bold uppercase tracking-widest">Coach’s note</p><div className="mt-3 flex gap-4"><Sparkles size={21} /><p className="max-w-2xl font-display text-2xl font-bold leading-tight tracking-[-.04em]">{result.feedback[0] ?? 'Keep the next rep simple and repeatable.'}</p></div></div></>}<div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_.8fr]"><div className="rounded-[1.7rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7"><div className="flex items-center justify-between"><h2 className="font-display text-2xl font-bold">Processing evidence</h2><ShieldCheck size={21} className="text-[hsl(var(--chart-2))]" /></div><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">{[['Duration', result.videoDurationSeconds === null ? '—' : `${result.videoDurationSeconds}s`], ['Frames', result.framesProcessed], ['Valid poses', result.validPoseFrames], ['Detection', result.detectionStatus.replaceAll('_', ' ')]].map(([label, value]) => <div key={label} className="rounded-2xl bg-[hsl(var(--muted))] p-3"><p className="font-mono-app text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{label}</p><p className="mt-2 text-sm font-bold">{value}</p></div>)}</div></div>{result.processedVideoUrl && <div className="overflow-hidden rounded-[1.7rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))]"><video controls playsInline className="aspect-video w-full bg-black" src={result.processedVideoUrl} /><p className="p-4 text-xs text-[hsl(var(--muted-foreground))]">Pose landmarks and tracked ankles are overlaid on the processed clip.</p></div>}</div></PageFrame>
  );
}

function InsightCard({ title, icon: InsightIcon, items, tone }: { title: string; icon: typeof Trophy; items: string[]; tone: 'green' | 'yellow' }) {
  return <div className={`rounded-[1.7rem] border p-7 ${tone === 'green' ? 'border-[hsl(var(--chart-2)/.22)] bg-[hsl(var(--chart-2)/.07)]' : 'border-[hsl(var(--accent)/.5)] bg-[hsl(var(--accent)/.18)]'}`}><div className="flex items-center gap-3"><InsightIcon size={21} /><h2 className="font-display text-2xl font-bold">{title}</h2></div><ul className="mt-5 space-y-3">{(items.length ? items : ['Keep showing up for the next rep.']).map((item) => <li key={item} className="flex gap-3 text-sm leading-6"><Check size={16} className="mt-1 shrink-0" />{item}</li>)}</ul></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/sports" component={SportsPage} /><Route path="/sports/:sportSlug" component={ActivityPage} /><Route path="/sports/:sportSlug/:activitySlug/instructions" component={InstructionsPage} /><Route path="/sports/:sportSlug/:activitySlug/upload" component={UploadPage} /><Route path="/analysis/:id" component={AnalysisPage} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;