"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@multica/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@multica/ui/components/ui/dialog";
import { cn } from "@multica/ui/lib/utils";
import { useScrollFade } from "@multica/ui/hooks/use-scroll-fade";
import type { AgentRuntime } from "@multica/core/types";
import { DragStrip } from "@multica/views/platform";
import { StepHeader } from "../components/step-header";
import { RuntimeAsidePanel } from "../components/runtime-aside-panel";
import { useRuntimePicker } from "../components/use-runtime-picker";
import { CloudWaitlistExpand } from "../components/cloud-waitlist-expand";
import { ProviderLogo } from "../../runtimes/components/provider-logo";
import { useAppI18n } from "../../i18n";

export function StepRuntimeConnect({
  wsId,
  onNext,
  onBack,
}: {
  wsId: string;
  onNext: (runtime: AgentRuntime | null) => void | Promise<void>;
  onBack?: () => void;
}) {
  const { runtimes, selected, selectedId, setSelectedId } =
    useRuntimePicker(wsId);

  return (
    <FancyView
      runtimes={runtimes}
      selected={selected}
      selectedId={selectedId}
      setSelectedId={setSelectedId}
      onNext={onNext}
      onBack={onBack}
    />
  );
}

type Phase = "scanning" | "found" | "empty";

const EMPTY_TIMEOUT_MS = 5000;

function FancyView({
  runtimes,
  selected,
  selectedId,
  setSelectedId,
  onNext,
  onBack,
}: {
  runtimes: AgentRuntime[];
  selected: AgentRuntime | null;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  onNext: (runtime: AgentRuntime | null) => void | Promise<void>;
  onBack?: () => void;
}) {
  const { t } = useAppI18n();
  const mainRef = useRef<HTMLElement>(null);
  const fadeStyle = useScrollFade(mainRef);

  const [hasTimedOut, setHasTimedOut] = useState(false);
  useEffect(() => {
    if (runtimes.length > 0) return;
    const timeoutId = window.setTimeout(
      () => setHasTimedOut(true),
      EMPTY_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [runtimes.length]);

  const phase: Phase =
    runtimes.length > 0 ? "found" : hasTimedOut ? "empty" : "scanning";

  const onlineCount = runtimes.filter((runtime) => runtime.status === "online").length;
  const [submitting, setSubmitting] = useState(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const handleSkip = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onNext(null);
    } finally {
      setSubmitting(false);
    }
  };

  const canContinue = phase === "found" && selected !== null;
  const handleContinue = async () => {
    if (!canContinue || submitting) return;
    setSubmitting(true);
    try {
      await onNext(selected);
    } finally {
      setSubmitting(false);
    }
  };

  const footerHint =
    phase === "found" && selected
      ? t.onboarding.runtimeSelected(selected.name)
      : phase === "found"
        ? t.onboarding.runtimePickAbove
        : phase === "scanning"
          ? t.onboarding.runtimeWaitingFirstResult
          : waitlistSubmitted
            ? t.onboarding.runtimeWaitlistSkipHint
            : t.onboarding.runtimeSkipOrWaitlist;

  return (
    <div className="animate-onboarding-enter grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px]">
      <div className="flex min-h-0 flex-col">
        <DragStrip />
        <header className="flex shrink-0 items-center gap-4 bg-background px-6 py-3 sm:px-10 md:px-14 lg:px-16">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t.common.back}
            </button>
          ) : (
            <span aria-hidden className="w-0" />
          )}
          <div className="flex-1">
            <StepHeader currentStep="runtime" />
          </div>
        </header>

        <main
          ref={mainRef}
          style={fadeStyle}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div
            key={phase}
            className="animate-onboarding-enter mx-auto w-full max-w-[620px] px-6 py-10 sm:px-10 md:px-14 lg:px-0 lg:py-14"
          >
            {phase === "scanning" && <ScanningView />}
            {phase === "found" && (
              <FoundView
                runtimes={runtimes}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onlineCount={onlineCount}
              />
            )}
            {phase === "empty" && (
              <EmptyView
                waitlistSubmitted={waitlistSubmitted}
                onWaitlistSubmitted={() => setWaitlistSubmitted(true)}
                onSkip={handleSkip}
              />
            )}
          </div>
        </main>

        <footer className="flex shrink-0 items-center justify-end gap-4 bg-background px-6 py-4 sm:px-10 md:px-14 lg:px-16">
          <span
            aria-live="polite"
            className="mr-auto text-xs text-muted-foreground"
          >
            {footerHint}
          </span>
          <Button variant="secondary" disabled={submitting} onClick={handleSkip}>
            {t.onboarding.skipForNow}
          </Button>
          <Button
            size="lg"
            disabled={!canContinue || submitting}
            onClick={handleContinue}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.common.continue}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </footer>
      </div>

      <aside className="hidden min-h-0 border-l bg-muted/40 lg:flex lg:flex-col">
        <DragStrip />
        <div className="min-h-0 flex-1 overflow-y-auto px-12 py-12">
          <RuntimeAsidePanel />
        </div>
      </aside>
    </div>
  );
}

function ScanningView() {
  const { t } = useAppI18n();

  return (
    <div>
      <h1 className="text-balance font-serif text-[36px] font-medium leading-[1.1] tracking-tight text-foreground">
        {t.onboarding.runtimeLookingTitle}
      </h1>
      <p className="mt-4 max-w-[560px] text-[15.5px] leading-[1.55] text-muted-foreground">
        {t.onboarding.runtimeLookingBody}
      </p>
      <div className="mt-10 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <SkeletonRuntimeCard />
        <SkeletonRuntimeCard />
      </div>
    </div>
  );
}

function FoundView({
  runtimes,
  selectedId,
  onSelect,
  onlineCount,
}: {
  runtimes: AgentRuntime[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onlineCount: number;
}) {
  const { t } = useAppI18n();
  const total = runtimes.length;
  const statusLabel =
    onlineCount === total
      ? t.onboarding.runtimeAllOnline
      : onlineCount === 0
        ? t.onboarding.runtimeNoneOnline
        : t.onboarding.runtimeOnlineCount(onlineCount);
  const statusTone =
    onlineCount === 0 ? "text-muted-foreground" : "text-success";

  return (
    <div>
      <h1 className="text-balance font-serif text-[36px] font-medium leading-[1.1] tracking-tight text-foreground">
        {t.onboarding.runtimeFoundTitle}
      </h1>
      <p className="mt-4 max-w-[560px] text-[15.5px] leading-[1.55] text-muted-foreground">
        {t.onboarding.runtimeFoundBody}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-muted/60 px-4 py-2.5 text-xs">
        <span className="font-semibold text-foreground">
          {total} runtime{total === 1 ? "" : "s"}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className={cn("flex items-center gap-1", statusTone)}>
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              onlineCount === 0 ? "bg-muted-foreground/40" : "bg-success",
            )}
            aria-hidden
          />
          {statusLabel}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {runtimes.map((runtime) => (
          <RuntimeCard
            key={runtime.id}
            runtime={runtime}
            selected={runtime.id === selectedId}
            onSelect={() => onSelect(runtime.id)}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyView({
  waitlistSubmitted,
  onWaitlistSubmitted,
  onSkip,
}: {
  waitlistSubmitted: boolean;
  onWaitlistSubmitted: () => void;
  onSkip: () => void;
}) {
  const { t } = useAppI18n();
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <div>
      <h1 className="text-balance font-serif text-[36px] font-medium leading-[1.1] tracking-tight text-foreground">
        {t.onboarding.noSupportedToolsTitle}
      </h1>
      <p className="mt-4 max-w-[560px] text-[15.5px] leading-[1.55] text-muted-foreground">
        {t.onboarding.noSupportedToolsBody}
      </p>

      <div className="mt-10 flex flex-col gap-3.5">
        <EmptyCard
          title={t.onboarding.emptySkipTitle}
          subtitle={t.onboarding.emptySkipBody}
          actionLabel={t.onboarding.skipForNow}
          onAction={onSkip}
        />

        <EmptyCard
          title={t.onboarding.emptyWaitlistTitle}
          subtitle={t.onboarding.emptyWaitlistBody}
          actionLabel={
            waitlistSubmitted
              ? t.onboarding.onTheWaitlist
              : t.onboarding.waitlistJoin
          }
          onAction={() => setWaitlistOpen(true)}
        />
      </div>

      <Dialog
        open={waitlistOpen}
        onOpenChange={(open) => {
          if (!open) setWaitlistOpen(false);
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t.onboarding.emptyWaitlistTitle}</DialogTitle>
            <DialogDescription>{t.onboarding.waitlistBody}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto pt-2">
            <CloudWaitlistExpand
              submitted={waitlistSubmitted}
              onSubmitted={onWaitlistSubmitted}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setWaitlistOpen(false)}>
              {waitlistSubmitted ? t.onboarding.close : t.common.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyCard({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAction}
      className="group flex items-center justify-between gap-4 rounded-lg border bg-card px-5 py-4 text-left transition-colors hover:border-foreground/30 hover:bg-muted/30"
    >
      <div className="min-w-0">
        <div className="text-[14.5px] font-medium text-foreground">{title}</div>
        <p className="mt-1 text-[12.5px] leading-[1.55] text-muted-foreground">
          {subtitle}
        </p>
      </div>
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors group-hover:border-foreground group-hover:bg-foreground group-hover:text-background"
      >
        {actionLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

function RuntimeCard({
  runtime,
  selected,
  onSelect,
}: {
  runtime: AgentRuntime;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useAppI18n();
  const online = runtime.status === "online";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors",
        selected
          ? "border-foreground shadow-[inset_0_0_0_1px_var(--color-foreground)]"
          : "hover:border-foreground/20",
      )}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/30">
        <ProviderLogo provider={runtime.provider} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {runtime.name}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              online ? "bg-success" : "bg-muted-foreground/40",
            )}
            aria-hidden
          />
          {online ? t.onboarding.online : t.onboarding.offline}
        </div>
      </div>
      <RadioMark selected={selected} />
    </button>
  );
}

function SkeletonRuntimeCard() {
  return (
    <div
      aria-hidden
      className="flex animate-pulse items-center gap-3 rounded-lg border bg-card p-4"
    >
      <div className="h-7 w-7 shrink-0 rounded-md bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-2.5 w-16 rounded bg-muted/70" />
      </div>
      <div className="h-4 w-4 shrink-0 rounded-full border-[1.5px] border-muted" />
    </div>
  );
}

function RadioMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-block h-4 w-4 shrink-0 rounded-full border-[1.5px] transition-colors",
        selected ? "border-foreground" : "border-border",
      )}
    >
      {selected && (
        <span className="absolute inset-[3px] rounded-full bg-foreground" />
      )}
    </span>
  );
}
