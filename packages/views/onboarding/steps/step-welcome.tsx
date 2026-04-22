"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@multica/ui/components/ui/button";
import { MulticaIcon } from "@multica/ui/components/common/multica-icon";
import { cn } from "@multica/ui/lib/utils";
import { DragStrip } from "@multica/views/platform";
import { STATUS_CONFIG } from "@multica/core/issues/config";
import type { IssueStatus } from "@multica/core/types";
import { StatusIcon } from "../../issues/components/status-icon";
import { ProviderLogo } from "../../runtimes/components/provider-logo";
import { useAppI18n } from "../../i18n";

export function StepWelcome({
  onNext,
  onSkip,
}: {
  onNext: () => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
}) {
  const { t } = useAppI18n();
  const [pending, setPending] = useState<"next" | "skip" | null>(null);

  const handleNext = async () => {
    if (pending) return;
    setPending("next");
    try {
      await onNext();
    } finally {
      setPending(null);
    }
  };

  const handleSkip = async () => {
    if (pending || !onSkip) return;
    setPending("skip");
    try {
      await onSkip();
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="animate-onboarding-enter grid h-full min-h-[640px] grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col">
        <DragStrip />
        <div className="flex flex-1 flex-col justify-center px-6 pb-12 sm:px-10 md:px-20 lg:px-20 xl:px-24">
          <div className="flex w-full max-w-[540px] flex-col gap-8">
            <div className="flex items-center gap-2.5">
              <MulticaIcon className="size-5 text-foreground" noSpin />
              <span className="font-serif text-xl font-medium tracking-tight">{t.onboarding.welcomeBrand}</span>
            </div>

            <h1 className="text-balance font-serif text-5xl font-medium leading-[1.04] tracking-tight sm:text-6xl">
              {t.onboarding.welcomeHeadline1}
              <br />
              <em className="italic text-brand">{t.onboarding.welcomeHeadline2}</em>
            </h1>

            <div className="flex flex-col gap-4">
              <p className="text-lg leading-relaxed text-foreground/85">{t.onboarding.welcomeBody}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{t.onboarding.welcomeMeta}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={handleNext} disabled={pending !== null}>
                {pending === "next" && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.onboarding.welcomeStart}
                <ArrowRight className="h-4 w-4" />
              </Button>
              {onSkip && (
                <Button size="lg" variant="ghost" onClick={handleSkip} disabled={pending !== null}>
                  {pending === "skip" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t.onboarding.welcomeSkip}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden border-l bg-muted/40 lg:flex lg:flex-col lg:overflow-hidden">
        <DragStrip />
        <div className="flex flex-1 flex-col items-center gap-7 px-8 py-8">
          <p className="max-w-[440px] text-balance text-center font-serif text-[15px] italic leading-snug text-muted-foreground">
            {t.onboarding.welcomeRightQuote}
          </p>
          <WelcomeIllustration />
        </div>
      </div>
    </div>
  );
}

function WelcomeIllustration() {
  const { t } = useAppI18n();

  return (
    <div className="flex w-full max-w-[460px] flex-col gap-3">
      <MockActivityCard
        actor={{ kind: "user", name: t.onboarding.welcomeCardUser, initial: "N" }}
        issueId="MCA-42"
        content={
          <>
            <Mention>@{t.onboarding.welcomeCardContentAgent}</Mention> {t.onboarding.welcomeCardPrompt1}{" "}
            <Mention>@{t.onboarding.welcomeCardResearchAgent}</Mention> {t.onboarding.welcomeCardPrompt2}
          </>
        }
      />
      <MockActivityCard
        className="-translate-x-5 -rotate-[1.2deg]"
        actor={{ kind: "agent", name: t.onboarding.welcomeCardContentAgent, provider: "codex" }}
        issueId="MCA-42"
        content={t.onboarding.welcomeCardReply}
        status="in_progress"
      />
      <MockActivityCard
        className="translate-x-8 rotate-[1.6deg]"
        actor={{ kind: "agent", name: t.onboarding.welcomeCardResearchAgent, provider: "hermes" }}
        issueId="MCA-38"
        content={t.onboarding.welcomeCardResearchSummary}
        status="done"
        timestamp={t.onboarding.welcomeCardAgo15m}
      />
      <MockActivityCard
        className="-translate-x-6 -rotate-[0.8deg]"
        actor={{ kind: "agent", name: t.onboarding.welcomeCardReviewAgent, provider: "openclaw" }}
        issueId="MCA-42"
        content={t.onboarding.welcomeCardReviewSummary}
        status="in_review"
      />
      <MockActivityCard
        className="translate-x-6 rotate-[1deg]"
        actor={{ kind: "agent", name: t.onboarding.welcomeCardCodingAgent, provider: "claude" }}
        issueId="MCA-35"
        content={
          <>
            {t.onboarding.welcomeCardCodingSummary} <Mention>@{t.onboarding.welcomeCardUser}</Mention>{" "}
            {t.onboarding.welcomeCardCodingSummary2}
          </>
        }
        status="done"
        timestamp={t.onboarding.welcomeCardJustNow}
      />
    </div>
  );
}

type ProviderName =
  | "claude"
  | "codex"
  | "opencode"
  | "openclaw"
  | "hermes"
  | "pi"
  | "copilot"
  | "cursor";

type ActivityActor =
  | { kind: "user"; name: string; initial: string }
  | { kind: "agent"; name: string; provider: ProviderName };

function MockActivityCard({
  actor,
  issueId,
  content,
  status,
  timestamp,
  className,
}: {
  actor: ActivityActor;
  issueId: string;
  content: React.ReactNode;
  status?: Extract<IssueStatus, "in_progress" | "done" | "in_review">;
  timestamp?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card px-4 py-3.5 shadow-sm",
        "transition-all duration-200 ease-out will-change-transform",
        "hover:-translate-y-0.5 hover:rotate-0 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <MockAvatar actor={actor} />
          <span className="truncate text-sm font-medium text-foreground">{actor.name}</span>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{issueId}</span>
      </div>

      <p className="mt-2.5 text-sm leading-snug text-foreground/85">{content}</p>

      {status && <StatusFooter status={status} timestamp={timestamp} />}
    </div>
  );
}

function MockAvatar({ actor }: { actor: ActivityActor }) {
  if (actor.kind === "user") {
    return (
      <div
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background"
      >
        {actor.initial}
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted/40 text-foreground"
    >
      <ProviderLogo provider={actor.provider} className="h-3.5 w-3.5" />
    </div>
  );
}

function StatusFooter({
  status,
  timestamp,
}: {
  status: IssueStatus;
  timestamp?: string;
}) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="mt-3 flex items-center gap-2 text-xs">
      <span className={cn("flex items-center gap-1.5 font-medium", cfg.iconColor)}>
        <StatusIcon status={status} className={cn("h-3.5 w-3.5", status === "in_progress" && "animate-pulse")} />
        {cfg.label}
      </span>
      {timestamp && (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{timestamp}</span>
        </>
      )}
    </div>
  );
}

function Mention({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-brand">{children}</span>;
}
