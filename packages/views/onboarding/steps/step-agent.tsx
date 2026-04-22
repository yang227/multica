"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@multica/ui/components/ui/button";
import { useScrollFade } from "@multica/ui/hooks/use-scroll-fade";
import { cn } from "@multica/ui/lib/utils";
import { api } from "@multica/core/api";
import {
  recommendTemplate,
  type AgentTemplateId,
  type QuestionnaireAnswers,
} from "@multica/core/onboarding";
import type {
  Agent,
  AgentRuntime,
  CreateAgentRequest,
} from "@multica/core/types";
import { DragStrip } from "@multica/views/platform";
import { StepHeader } from "../components/step-header";
import { useAppI18n } from "../../i18n";

interface AgentTemplate {
  id: AgentTemplateId;
  label: string;
  defaultName: string;
  emoji: string;
  blurb: string;
  instructions: string;
}

function getTemplates(
  t: ReturnType<typeof useAppI18n>["t"],
): readonly AgentTemplate[] {
  return [
    {
      id: "coding",
      label: t.onboarding.templateCodingLabel,
      defaultName: "Atlas",
      emoji: "<>",
      blurb: t.onboarding.templateCodingBlurb,
      instructions:
        "You are a Coding Agent on a product team. Pick up coding issues, implement features, fix bugs, write tests, and open pull requests. Read the repository before you start, follow existing code conventions, and keep diffs focused. Ask for clarification when the acceptance criteria are ambiguous.",
    },
    {
      id: "planning",
      label: t.onboarding.templatePlanningLabel,
      defaultName: "Orion",
      emoji: "[]",
      blurb: t.onboarding.templatePlanningBlurb,
      instructions:
        "You are a Planning Agent. Turn loose ideas and open issues into scoped, ready-to-execute work: break them down into subtasks, write acceptance criteria, and propose owners and sequencing. Prefer clarity over speed. When blocked by missing context, ask one specific question rather than guessing.",
    },
    {
      id: "writing",
      label: t.onboarding.templateWritingLabel,
      defaultName: "Mira",
      emoji: "W",
      blurb: t.onboarding.templateWritingBlurb,
      instructions:
        "You are a Writing Agent. Draft documents, summarize long content, and research topics on the web when needed. Structure your output as finished prose a reader can use directly, not an outline. Cite sources when you draw from them. Match the tone the user establishes in the issue.",
    },
    {
      id: "assistant",
      label: t.onboarding.templateAssistantLabel,
      defaultName: "Vega",
      emoji: "*",
      blurb: t.onboarding.templateAssistantBlurb,
      instructions:
        "You are a general-purpose teammate. Handle varied tasks, light coding, writing, research, planning, and stay pragmatic about scope. When the task is ambiguous, ask one clarifying question before diving in. Default to short, useful outputs over exhaustive ones.",
    },
  ] as const;
}

export function StepAgent({
  runtime,
  questionnaire,
  onCreated,
  onBack,
}: {
  runtime: AgentRuntime;
  questionnaire: QuestionnaireAnswers;
  onCreated: (agent: Agent) => void | Promise<void>;
  onBack?: () => void;
}) {
  const { t } = useAppI18n();
  const templates = getTemplates(t);
  const templateById = Object.fromEntries(
    templates.map((template) => [template.id, template]),
  ) as Record<AgentTemplateId, AgentTemplate>;

  const recommendedId = recommendTemplate(questionnaire);
  const recommended = templateById[recommendedId];

  const [templateId, setTemplateId] = useState<AgentTemplateId>(recommendedId);
  const template = templateById[templateId];
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const req: CreateAgentRequest = {
        name: template.defaultName,
        description: template.blurb,
        instructions: template.instructions,
        runtime_id: runtime.id,
        visibility: "workspace",
      };
      const agent = await api.createAgent(req);
      await onCreated(agent);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t.agents.createFailed,
      );
      setCreating(false);
    }
  };

  const mainRef = useRef<HTMLElement>(null);
  const fadeStyle = useScrollFade(mainRef);

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
            <StepHeader currentStep="agent" />
          </div>
        </header>

        <main
          ref={mainRef}
          style={fadeStyle}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-[620px] px-6 py-10 sm:px-10 md:px-14 lg:px-0 lg:py-14">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {t.onboarding.firstAgentIntro}
            </div>
            <h1 className="text-balance font-serif text-[36px] font-medium leading-[1.1] tracking-tight text-foreground">
              {t.onboarding.firstAgentTitle}
            </h1>
            <p className="mt-4 text-[15.5px] leading-[1.55] text-foreground/80">
              {t.onboarding.firstAgentBodyPrefix}{" "}
              <strong className="font-medium text-foreground">
                {recommended.label}
              </strong>
              {t.onboarding.firstAgentBodySuffix}
            </p>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {templates.map((candidate) => (
                <TemplateCard
                  key={candidate.id}
                  template={candidate}
                  selected={templateId === candidate.id}
                  recommended={recommendedId === candidate.id}
                  onSelect={() => setTemplateId(candidate.id)}
                  recommendedLabel={t.onboarding.recommended}
                />
              ))}
            </div>
          </div>
        </main>

        <footer className="flex shrink-0 items-center justify-between gap-4 bg-background px-6 py-4 sm:px-10 md:px-14 lg:px-16">
          <span className="hidden text-xs text-muted-foreground sm:block">
            {t.onboarding.oneAgentEnough}
          </span>
          <Button size="lg" onClick={handleCreate} disabled={creating}>
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.onboarding.createAgentNamed(template.defaultName)}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </footer>
      </div>

      <aside className="hidden min-h-0 border-l bg-muted/40 lg:flex lg:flex-col">
        <DragStrip />
        <div className="min-h-0 flex-1 overflow-y-auto px-12 py-12">
          <AboutAgentsSide />
        </div>
      </aside>
    </div>
  );
}

function TemplateCard({
  template,
  selected,
  recommended,
  onSelect,
  recommendedLabel,
}: {
  template: AgentTemplate;
  selected: boolean;
  recommended: boolean;
  onSelect: () => void;
  recommendedLabel: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border bg-card px-4 py-4 text-left transition-all",
        selected
          ? "border-foreground shadow-[inset_0_0_0_1px_var(--color-foreground)]"
          : "hover:border-foreground/20 hover:bg-accent/30",
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/70 font-serif text-lg text-foreground/80"
        >
          {template.emoji}
        </span>
        {recommended && (
          <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand">
            {recommendedLabel}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium text-foreground">
          {template.label}
        </div>
        <p className="text-xs leading-snug text-muted-foreground">
          {template.blurb}
        </p>
      </div>
    </button>
  );
}

function AboutAgentsSide() {
  const { t } = useAppI18n();

  return (
    <div className="flex max-w-[380px] flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {t.onboarding.whatsAnAgent}
        </div>
        <h2 className="font-serif text-[22px] font-medium leading-[1.25] tracking-tight text-foreground">
          {t.onboarding.agentDefinition}
        </h2>
        <p className="text-[14px] leading-[1.6] text-foreground/80">
          {t.onboarding.agentDefinitionBody}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {t.onboarding.agentWaysToWork}
        </div>
        <div className="flex flex-col gap-4">
          <WayItem
            glyph="→"
            title={t.onboarding.agentWayAssignTitle}
            body={t.onboarding.agentWayAssignBody}
          />
          <WayItem
            glyph="@"
            title={t.onboarding.agentWayMentionTitle}
            body={t.onboarding.agentWayMentionBody}
          />
          <WayItem
            glyph="○"
            title={t.onboarding.agentWayChatTitle}
            body={t.onboarding.agentWayChatBody}
          />
          <WayItem
            glyph="↻"
            title={t.onboarding.agentWayAutopilotTitle}
            body={t.onboarding.agentWayAutopilotBody}
          />
        </div>
      </section>

      <p className="text-[13px] leading-[1.55] text-muted-foreground">
        {t.onboarding.addMoreAgentsHint}
      </p>
    </div>
  );
}

function WayItem({
  glyph,
  title,
  body,
}: {
  glyph: string;
  title: string;
  body: string;
}) {
  return (
    <div className="grid grid-cols-[22px_1fr] gap-3">
      <div
        aria-hidden
        className="flex h-[20px] w-[20px] items-center justify-center text-[14px] text-muted-foreground"
      >
        {glyph}
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-[14px] font-medium leading-tight text-foreground">
          {title}
        </div>
        <p className="text-[13px] leading-[1.5] text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  );
}
