"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import { Button } from "@multica/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@multica/ui/components/ui/dialog";
import { useScrollFade } from "@multica/ui/hooks/use-scroll-fade";
import { cn } from "@multica/ui/lib/utils";
import type { AgentRuntime } from "@multica/core/types";
import { DragStrip } from "@multica/views/platform";
import { StepHeader } from "../components/step-header";
import { RuntimeAsidePanel } from "../components/runtime-aside-panel";
import { CompactRuntimeRow } from "../components/compact-runtime-row";
import { useRuntimePicker } from "../components/use-runtime-picker";
import { CloudWaitlistExpand } from "../components/cloud-waitlist-expand";
import { useAppI18n } from "../../i18n";

type DialogState = "cli" | "cloud" | null;

const DESKTOP_DOWNLOAD_URL =
  "https://github.com/multica-ai/multica/releases/latest";

export function StepPlatformFork({
  wsId,
  onNext,
  onBack,
  cliInstructions,
}: {
  wsId: string;
  onNext: (runtime: AgentRuntime | null) => void | Promise<void>;
  onBack?: () => void;
  cliInstructions?: ReactNode;
}) {
  const { t } = useAppI18n();
  const mainRef = useRef<HTMLElement>(null);
  const fadeStyle = useScrollFade(mainRef);

  const [dialog, setDialog] = useState<DialogState>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const platform = navigator.platform || "";
    const userAgent = navigator.userAgent || "";
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS X/i.test(userAgent));
  }, []);

  const picker = useRuntimePicker(wsId);

  const pickDesktop = () => {
    window.open(DESKTOP_DOWNLOAD_URL, "_blank", "noopener,noreferrer");
    setDownloaded(true);
  };

  const handleCliConnect = () => {
    if (!picker.selected) return;
    setDialog(null);
    onNext(picker.selected);
  };

  const footerHint = (() => {
    if (waitlistSubmitted) return t.onboarding.runtimeFooterWaitlistHint;
    if (downloaded) return t.onboarding.runtimeFooterDownloadingHint;
    if (!isMac) return t.onboarding.runtimeFooterCliHint;
    return t.onboarding.runtimeFooterDefaultHint;
  })();

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
          <div className="mx-auto w-full max-w-[620px] px-6 py-10 sm:px-10 md:px-14 lg:px-0 lg:py-14">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {t.onboarding.runtimeStepTag}
            </div>
            <h1 className="text-balance font-serif text-[36px] font-medium leading-[1.1] tracking-tight text-foreground">
              {t.onboarding.runtimeTitle}
            </h1>
            <p className="mt-4 max-w-[560px] text-[15.5px] leading-[1.55] text-muted-foreground">
              {t.onboarding.runtimeBody}
            </p>

            <div className="mt-10 flex max-w-[560px] flex-col gap-3.5">
              <ForkPrimary
                onClick={pickDesktop}
                downloaded={downloaded}
                isMac={isMac}
              />

              <ForkAlt
                title={t.onboarding.installCliTitle}
                subtitle={t.onboarding.installCliBody}
                actionLabel={t.onboarding.showSteps}
                onAction={() => setDialog("cli")}
              />

              <ForkAlt
                title={t.onboarding.cloudRuntimeTitle}
                subtitle={t.onboarding.cloudRuntimeBody}
                actionLabel={
                  waitlistSubmitted
                    ? t.onboarding.onTheList
                    : t.onboarding.waitlistJoin
                }
                onAction={() => setDialog("cloud")}
              />
            </div>
          </div>
        </main>

        <footer className="flex shrink-0 items-center justify-between gap-4 bg-background px-6 py-4 sm:px-10 md:px-14 lg:px-16">
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {footerHint}
          </span>
          <Button variant="secondary" onClick={() => onNext(null)}>
            {t.onboarding.skipForNow}
          </Button>
        </footer>
      </div>

      <aside className="hidden min-h-0 border-l bg-muted/40 lg:flex lg:flex-col">
        <DragStrip />
        <div className="min-h-0 flex-1 overflow-y-auto px-12 py-12">
          <RuntimeAsidePanel />
        </div>
      </aside>

      <CliInstallDialog
        open={dialog === "cli"}
        onClose={() => setDialog(null)}
        onConnect={handleCliConnect}
        runtimes={picker.runtimes}
        selectedId={picker.selectedId}
        onSelect={picker.setSelectedId}
        hasRuntimes={picker.hasRuntimes}
        canConnect={picker.selected !== null}
        selectedName={picker.selected?.name ?? null}
        cliInstructions={cliInstructions}
      />

      <CloudWaitlistDialog
        open={dialog === "cloud"}
        onClose={() => setDialog(null)}
        submitted={waitlistSubmitted}
        onSubmitted={() => setWaitlistSubmitted(true)}
      />
    </div>
  );
}

function ForkPrimary({
  onClick,
  downloaded,
  isMac,
}: {
  onClick: () => void;
  downloaded: boolean;
  isMac: boolean;
}) {
  const { t } = useAppI18n();

  if (!isMac) {
    return (
      <div
        aria-disabled="true"
        className="flex cursor-not-allowed items-center justify-between gap-4 rounded-xl border bg-muted/40 px-6 py-5 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[17px] font-medium tracking-tight text-muted-foreground">
            <Download className="h-4 w-4" aria-hidden />
            {t.onboarding.desktopAppMacOnly}
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground/80">
            {t.onboarding.desktopAppMacOnlyBody}
          </div>
        </div>
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between gap-4 rounded-xl bg-foreground px-6 py-5 text-left text-background transition-transform",
        "hover:-translate-y-0.5",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[17px] font-medium tracking-tight">
          <Download className="h-4 w-4" aria-hidden />
          {downloaded
            ? t.onboarding.downloadingDesktop
            : t.onboarding.downloadDesktop}
        </div>
        <div className="mt-1 text-[13px] text-background/60">
          {downloaded
            ? t.onboarding.downloadingDesktopBody
            : t.onboarding.downloadDesktopBodyReady}
        </div>
      </div>
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-background/10 px-4 py-2 text-[13px] font-medium transition-colors group-hover:bg-background/20"
      >
        {t.onboarding.downloadDesktop}
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

function ForkAlt({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: ReactNode;
  actionLabel: ReactNode;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-5 py-4">
      <div className="min-w-0">
        <div className="text-[14.5px] font-medium text-foreground">{title}</div>
        <div className="mt-1 text-[12.5px] leading-[1.5] text-muted-foreground">
          {subtitle}
        </div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

function CliInstallDialog({
  open,
  onClose,
  onConnect,
  runtimes,
  selectedId,
  onSelect,
  hasRuntimes,
  canConnect,
  selectedName,
  cliInstructions,
}: {
  open: boolean;
  onClose: () => void;
  onConnect: () => void;
  runtimes: AgentRuntime[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hasRuntimes: boolean;
  canConnect: boolean;
  selectedName: string | null;
  cliInstructions?: ReactNode;
}) {
  const { t } = useAppI18n();

  return (
    <Dialog open={open} onOpenChange={(state) => !state && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t.onboarding.cliDialogTitle}</DialogTitle>
          <DialogDescription>{t.onboarding.cliDialogBody}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          {cliInstructions}

          {hasRuntimes ? (
            <>
              <div className="flex items-center gap-2 pt-1 text-sm">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="font-medium">
                  {t.onboarding.runtimeConnectedCount(runtimes.length)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {runtimes.map((runtime) => (
                  <CompactRuntimeRow
                    key={runtime.id}
                    runtime={runtime}
                    selected={runtime.id === selectedId}
                    onSelect={() => onSelect(runtime.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <CliWaitingStatus dialogOpen={open} />
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-3 sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {canConnect && selectedName
              ? t.onboarding.runtimeSelected(selectedName)
              : hasRuntimes
                ? t.onboarding.runtimePickAboveShort
                : t.onboarding.runtimeWaitingOnline}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button disabled={!canConnect} onClick={onConnect}>
              {t.onboarding.connectAndContinue}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function CliWaitingStatus({ dialogOpen }: { dialogOpen: boolean }) {
  const { t } = useAppI18n();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!dialogOpen) {
      setElapsed(0);
      return;
    }
    const intervalId = window.setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [dialogOpen]);

  const stage: "normal" | "midway" | "slow" | "stalled" =
    elapsed < 15
      ? "normal"
      : elapsed < 45
        ? "midway"
        : elapsed < 90
          ? "slow"
          : "stalled";

  const body =
    stage === "normal"
      ? t.onboarding.runtimeWaitingNormal
      : stage === "midway"
        ? t.onboarding.runtimeWaitingMidway
        : stage === "slow"
          ? t.onboarding.runtimeWaitingSlow
          : t.onboarding.runtimeWaitingStalled;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm">
        <span
          aria-hidden
          className="inline-block size-2 shrink-0 rounded-full bg-success animate-pulse"
        />
        <span className="font-medium text-foreground">
          {t.onboarding.runtimeListening}
        </span>
        <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
          {formatElapsed(elapsed)}
        </span>
      </div>

      <p
        aria-live="polite"
        className="text-[12.5px] leading-[1.55] text-muted-foreground"
      >
        {body}
      </p>
    </div>
  );
}

function CloudWaitlistDialog({
  open,
  onClose,
  submitted,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  submitted: boolean;
  onSubmitted: () => void;
}) {
  const { t } = useAppI18n();

  return (
    <Dialog open={open} onOpenChange={(state) => !state && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t.onboarding.emptyWaitlistTitle}</DialogTitle>
          <DialogDescription>{t.onboarding.waitlistBody}</DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          <CloudWaitlistExpand submitted={submitted} onSubmitted={onSubmitted} />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {submitted ? t.onboarding.close : t.common.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
