"use client";

import { type ReactNode, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Bot,
  FolderKanban,
  Inbox,
  ListTodo,
  Lock,
  MoreHorizontal,
  Monitor,
  Plus,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@multica/ui/components/ui/button";
import { Input } from "@multica/ui/components/ui/input";
import { Label } from "@multica/ui/components/ui/label";
import { useScrollFade } from "@multica/ui/hooks/use-scroll-fade";
import { cn } from "@multica/ui/lib/utils";
import { useCreateWorkspace } from "@multica/core/workspace/mutations";
import type { Workspace } from "@multica/core/types";
import { DragStrip } from "@multica/views/platform";
import { StepHeader } from "../components/step-header";
import { RadioMark } from "../components/option-card";
import { WorkspaceAvatar } from "../../workspace/workspace-avatar";
import {
  WORKSPACE_SLUG_CONFLICT_ERROR,
  WORKSPACE_SLUG_FORMAT_ERROR,
  WORKSPACE_SLUG_REGEX,
  isWorkspaceSlugConflict,
  nameToWorkspaceSlug,
} from "../../workspace/slug";
import { useAppI18n } from "../../i18n";

function issuePrefix(slug: string): string {
  const head = slug.trim().replace(/[^a-z0-9]/g, "").slice(0, 4);
  return (head || "ws").toUpperCase();
}

export function StepWorkspace({
  existing,
  onCreated,
  onBack,
}: {
  existing?: Workspace | null;
  onCreated: (workspace: Workspace) => void | Promise<void>;
  onBack?: () => void;
}) {
  const { t } = useAppI18n();
  const mainRef = useRef<HTMLElement>(null);
  const fadeStyle = useScrollFade(mainRef);

  const reusing = existing ?? null;
  const [mode, setMode] = useState<"existing" | "create" | null>(null);
  const pickExisting = () =>
    setMode((m) => (m === "existing" ? null : "existing"));
  const pickCreate = () => setMode((m) => (m === "create" ? null : "create"));

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugServerError, setSlugServerError] = useState<string | null>(null);
  const slugTouched = useRef(false);

  const slugValidationError =
    slug.length > 0 && !WORKSPACE_SLUG_REGEX.test(slug)
      ? WORKSPACE_SLUG_FORMAT_ERROR
      : null;
  const slugError = slugValidationError ?? slugServerError;
  const canCreate =
    name.trim().length > 0 && slug.trim().length > 0 && !slugError;

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched.current) {
      setSlug(nameToWorkspaceSlug(value));
      setSlugServerError(null);
    }
  };

  const handleSlugChange = (value: string) => {
    slugTouched.current = true;
    setSlug(value);
    setSlugServerError(null);
  };

  const createWorkspace = useCreateWorkspace();

  const handleCreate = () => {
    if (!canCreate || createWorkspace.isPending) return;
    createWorkspace.mutate(
      { name: name.trim(), slug: slug.trim() },
      {
        onSuccess: onCreated,
        onError: (error) => {
          if (isWorkspaceSlugConflict(error)) {
            setSlugServerError(WORKSPACE_SLUG_CONFLICT_ERROR);
            toast.error(t.workspace.createChooseDifferentUrl);
            return;
          }
          toast.error(t.workspace.createFailed);
        },
      },
    );
  };

  const isCreating = createWorkspace.isPending;
  const creatingActive = !reusing || mode === "create";
  const existingActive = Boolean(reusing) && mode === "existing";

  let hint: string;
  let continueLabel: string;
  let continueDisabled: boolean;
  let onContinue: () => void;

  if (existingActive && reusing) {
    hint = t.onboarding.openingWorkspace(reusing.name);
    continueLabel = t.common.open;
    continueDisabled = isCreating;
    onContinue = () => onCreated(reusing);
  } else if (creatingActive) {
    if (isCreating) {
      hint = t.onboarding.creatingWorkspaceHint(
        name.trim() || t.onboarding.yourWorkspace,
      );
      continueLabel = t.workspace.createSubmitting;
      continueDisabled = true;
      onContinue = () => {};
    } else if (canCreate) {
      hint = t.onboarding.creatingWorkspaceHint(name.trim());
      continueLabel = t.onboarding.createWorkspaceAction;
      continueDisabled = false;
      onContinue = handleCreate;
    } else {
      hint = t.onboarding.createWorkspaceHint;
      continueLabel = t.onboarding.createWorkspaceAction;
      continueDisabled = true;
      onContinue = () => {};
    }
  } else {
    hint = t.onboarding.pickWorkspaceHint;
    continueLabel = t.common.continue;
    continueDisabled = true;
    onContinue = () => {};
  }

  const createFields = (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="ws-name"
          className="text-xs font-medium text-muted-foreground"
        >
          {t.onboarding.workspaceNameLabel}
        </Label>
        <Input
          id="ws-name"
          autoFocus
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={t.onboarding.workspaceNamePlaceholder}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="ws-slug"
          className="text-xs font-medium text-muted-foreground"
        >
          {t.onboarding.workspaceUrlLabel}
        </Label>
        <div className="flex items-center rounded-md border bg-muted transition-colors focus-within:border-foreground">
          <span className="select-none pl-3 font-mono text-sm text-muted-foreground">
            multica.ai/
          </span>
          <Input
            id="ws-slug"
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="acme"
            className="border-0 bg-transparent font-mono shadow-none focus-visible:ring-0"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        {slugError && <p className="text-xs text-destructive">{slugError}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-medium text-muted-foreground">
          {t.onboarding.issuePrefixLabel}
        </div>
        <div className="text-sm leading-[1.55] text-muted-foreground">
          {t.onboarding.issuePrefixBody(issuePrefix(slug))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-onboarding-enter grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px]">
      <div className="flex min-h-0 flex-col">
        <DragStrip />
        <header className="flex shrink-0 items-center gap-4 bg-background px-6 py-3 sm:px-10 md:px-14 lg:px-16">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isCreating}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t.common.back}
            </button>
          ) : (
            <span aria-hidden className="w-0" />
          )}
          <div className="flex-1">
            <StepHeader currentStep="workspace" />
          </div>
        </header>

        <main
          ref={mainRef}
          style={fadeStyle}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-[620px] px-6 py-10 sm:px-10 md:px-14 lg:px-0 lg:py-14">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {reusing ? t.onboarding.workspaceIntroExisting : t.onboarding.workspaceIntroNew}
            </div>
            <h1 className="text-balance font-serif text-[36px] font-medium leading-[1.1] tracking-tight text-foreground">
              {reusing
                ? t.onboarding.workspaceTitleExisting(reusing.name)
                : t.onboarding.workspaceTitleNew}
            </h1>
            <p className="mt-4 text-[15.5px] leading-[1.55] text-foreground/80">
              {reusing
                ? t.onboarding.workspaceBodyExisting
                : t.onboarding.workspaceBodyNew}
            </p>

            <div className="mt-10">
              {reusing ? (
                <div className="flex flex-col gap-3">
                  <ExistingWorkspaceCard
                    workspace={reusing}
                    selected={mode === "existing"}
                    onSelect={pickExisting}
                  />
                  <CreateNewWorkspaceCard
                    selected={mode === "create"}
                    onSelect={pickCreate}
                  >
                    {createFields}
                  </CreateNewWorkspaceCard>
                </div>
              ) : (
                createFields
              )}
            </div>
          </div>
        </main>

        <footer className="flex shrink-0 items-center justify-end gap-4 bg-background px-6 py-4 sm:px-10 md:px-14 lg:px-16">
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {hint}
          </span>
          <Button size="lg" disabled={continueDisabled} onClick={onContinue}>
            {continueLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </footer>
      </div>

      <aside className="hidden min-h-0 border-l bg-muted/40 lg:flex lg:flex-col">
        <DragStrip />
        <div className="min-h-0 flex-1 overflow-y-auto px-12 py-12">
          {reusing && mode !== "create" ? (
            <ExistingWorkspaceSide workspace={reusing} />
          ) : (
            <CreateWorkspaceSide />
          )}
        </div>
      </aside>
    </div>
  );
}

function ExistingWorkspaceCard({
  workspace,
  selected,
  onSelect,
}: {
  workspace: Workspace;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-lg border bg-card px-5 py-4 text-left transition-all",
        selected
          ? "border-foreground shadow-[inset_0_0_0_1px_var(--color-foreground)]"
          : "hover:border-foreground/20 hover:bg-accent/30",
      )}
    >
      <WorkspaceAvatar name={workspace.name} size="lg" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="truncate text-[14.5px] font-medium text-foreground">
          {workspace.name}
        </div>
        <div className="truncate font-mono text-xs text-muted-foreground">
          multica.ai/{workspace.slug}
        </div>
      </div>
      <RadioMark selected={selected} />
    </button>
  );
}

function CreateNewWorkspaceCard({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  const { t } = useAppI18n();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card transition-all",
        selected
          ? "border-foreground shadow-[inset_0_0_0_1px_var(--color-foreground)]"
          : "hover:border-foreground/20",
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        aria-expanded={selected}
        onClick={onSelect}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="truncate text-[14.5px] font-medium text-foreground">
            {t.onboarding.createNewWorkspace}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {t.onboarding.createNewWorkspaceBody}
          </div>
        </div>
        <RadioMark selected={selected} />
      </button>
      {selected && <div className="border-t px-5 py-5">{children}</div>}
    </div>
  );
}

function CreateWorkspaceSide() {
  const { t } = useAppI18n();

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {t.onboarding.whatLivesInside}
      </div>

      <WorkspacePreviewCard name={t.onboarding.yourWorkspace} slug="workspace" />

      <div className="mt-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {t.onboarding.thingsYouWillDo}
      </div>
      <div className="flex flex-col gap-3.5">
        <PerkRow>{t.onboarding.perkAssignIssues}</PerkRow>
        <PerkRow>{t.onboarding.perkChat}</PerkRow>
        <PerkRow>{t.onboarding.perkInvite}</PerkRow>
        <PerkRow>{t.onboarding.perkSwitch}</PerkRow>
      </div>
    </div>
  );
}

function ExistingWorkspaceSide({ workspace }: { workspace: Workspace }) {
  const { t } = useAppI18n();

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {t.onboarding.yourWorkspace}
      </div>

      <WorkspacePreviewCard name={workspace.name} slug={workspace.slug} />

      <div className="mt-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {t.onboarding.whatsNext}
      </div>
      <div className="flex flex-col gap-3.5">
        <PerkRow>{t.onboarding.perkConnectRuntime}</PerkRow>
        <PerkRow>{t.onboarding.perkCreateAgent}</PerkRow>
        <PerkRow>{t.onboarding.perkWatchAgent}</PerkRow>
      </div>
    </div>
  );
}

function WorkspacePreviewCard({
  name,
  slug,
}: {
  name: string;
  slug: string;
}) {
  const { t } = useAppI18n();

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="flex items-center gap-3 border-b px-4 py-3.5">
        <WorkspaceAvatar name={name} size="md" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="truncate text-[14px] font-medium text-foreground">
            {name}
          </div>
          <div className="truncate font-mono text-[11.5px] text-muted-foreground">
            multica.ai/{slug}
          </div>
        </div>
        <Lock
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
        />
      </div>
      <div className="flex flex-col">
        <EntityRow
          icon={<Inbox className="h-4 w-4" />}
          label={t.onboarding.entityInbox}
          meta={t.onboarding.entityInboxMeta}
        />
        <EntityRow
          icon={<ListTodo className="h-4 w-4" />}
          label={t.onboarding.entityIssues}
          meta={t.onboarding.entityIssuesMeta}
        />
        <EntityRow
          icon={<Bot className="h-4 w-4" />}
          label={t.onboarding.entityAgents}
          meta={t.onboarding.entityAgentsMeta}
        />
        <EntityRow
          icon={<FolderKanban className="h-4 w-4" />}
          label={t.onboarding.entityProjects}
          meta={t.onboarding.entityProjectsMeta}
        />
        <EntityRow
          icon={<Zap className="h-4 w-4" />}
          label={t.onboarding.entityAutopilot}
          meta={t.onboarding.entityAutopilotMeta}
        />
        <EntityRow
          icon={<Monitor className="h-4 w-4" />}
          label={t.onboarding.entityRuntimes}
          meta={t.onboarding.entityRuntimesMeta}
        />
        <EntityRow
          icon={<BookOpenText className="h-4 w-4" />}
          label={t.onboarding.entitySkills}
          meta={t.onboarding.entitySkillsMeta}
        />
        <EntityRow
          dim
          icon={<MoreHorizontal className="h-4 w-4" />}
          label={t.onboarding.entityMore}
          meta={t.onboarding.entityMoreMeta}
        />
      </div>
    </div>
  );
}

function EntityRow({
  icon,
  label,
  meta,
  dim,
}: {
  icon: ReactNode;
  label: string;
  meta: string;
  dim?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 [&:not(:last-child)]:border-b">
      <span
        aria-hidden
        className={cn(
          "shrink-0",
          dim ? "text-muted-foreground/60" : "text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "flex-1 text-[13.5px]",
          dim ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-[11.5px]",
          dim ? "text-muted-foreground/70" : "text-muted-foreground",
        )}
      >
        {meta}
      </span>
    </div>
  );
}

function PerkRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[18px_1fr] items-start gap-3">
      <span
        aria-hidden
        className="mt-[11px] h-px w-3 shrink-0 bg-muted-foreground/40"
      />
      <div className="text-[13.5px] leading-[1.55] text-foreground/85">
        {children}
      </div>
    </div>
  );
}
