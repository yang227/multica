"use client";

import { type ReactNode, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  PenLine,
  Sparkles,
} from "lucide-react";
import { Button } from "@multica/ui/components/ui/button";
import { useScrollFade } from "@multica/ui/hooks/use-scroll-fade";
import type {
  QuestionnaireAnswers,
  Role,
  TeamSize,
  UseCase,
} from "@multica/core/onboarding";
import { DragStrip } from "@multica/views/platform";
import { StepHeader } from "../components/step-header";
import { OptionCard, OtherOptionCard } from "../components/option-card";
import { useAppI18n } from "../../i18n";

export function StepQuestionnaire({
  initial,
  onSubmit,
  onBack,
}: {
  initial: QuestionnaireAnswers;
  onSubmit: (answers: QuestionnaireAnswers) => void | Promise<void>;
  onBack?: () => void;
}) {
  const { t } = useAppI18n();
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(initial);
  const [submitting, setSubmitting] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const fadeStyle = useScrollFade(mainRef);

  const setTeamSize = (v: TeamSize) =>
    setAnswers((a) => ({
      ...a,
      team_size: v,
      team_size_other: v === "other" ? a.team_size_other : null,
    }));
  const setRole = (v: Role) =>
    setAnswers((a) => ({
      ...a,
      role: v,
      role_other: v === "other" ? a.role_other : null,
    }));
  const setUseCase = (v: UseCase) =>
    setAnswers((a) => ({
      ...a,
      use_case: v,
      use_case_other: v === "other" ? a.use_case_other : null,
    }));

  const answeredCount = useMemo(() => {
    const q1 =
      answers.team_size !== null &&
      (answers.team_size !== "other" ||
        (answers.team_size_other ?? "").trim() !== "");
    const q2 =
      answers.role !== null &&
      (answers.role !== "other" || (answers.role_other ?? "").trim() !== "");
    const q3 =
      answers.use_case !== null &&
      (answers.use_case !== "other" ||
        (answers.use_case_other ?? "").trim() !== "");
    return (q1 ? 1 : 0) + (q2 ? 1 : 0) + (q3 ? 1 : 0);
  }, [answers]);
  const canContinue = answeredCount === 3;

  const submit = async () => {
    if (!canContinue || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setSubmitting(false);
    }
  };

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
            <StepHeader currentStep="questionnaire" />
          </div>
        </header>

        <main
          ref={mainRef}
          style={fadeStyle}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-[620px] px-6 py-10 sm:px-10 md:px-14 lg:px-0 lg:py-14">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {t.onboarding.questionnaireIntro}
            </div>
            <h1 className="text-balance font-serif text-[36px] font-medium leading-[1.1] tracking-tight text-foreground">
              {t.onboarding.questionnaireTitle}
            </h1>

            <div className="mt-10 flex flex-col gap-7">
              <QuestionBlock
                num={1}
                question={t.onboarding.questionnaireQ1}
                ariaLabel={t.onboarding.questionnaireQ1}
              >
                <OptionCard
                  selected={answers.team_size === "solo"}
                  onSelect={() => setTeamSize("solo")}
                  label={t.onboarding.optionJustMe}
                />
                <OptionCard
                  selected={answers.team_size === "team"}
                  onSelect={() => setTeamSize("team")}
                  label={t.onboarding.optionTeam}
                />
                <OtherOptionCard
                  selected={answers.team_size === "other"}
                  onSelect={() => setTeamSize("other")}
                  otherValue={answers.team_size_other ?? ""}
                  onOtherChange={(v) =>
                    setAnswers((a) => ({ ...a, team_size_other: v }))
                  }
                  placeholder={t.onboarding.teamOtherPlaceholder}
                />
              </QuestionBlock>

              <QuestionBlock
                num={2}
                question={t.onboarding.questionnaireQ2}
                ariaLabel={t.onboarding.questionnaireQ2}
              >
                <OptionCard
                  selected={answers.role === "developer"}
                  onSelect={() => setRole("developer")}
                  label={t.onboarding.optionSoftwareDeveloper}
                />
                <OptionCard
                  selected={answers.role === "product_lead"}
                  onSelect={() => setRole("product_lead")}
                  label={t.onboarding.optionProductLead}
                />
                <OptionCard
                  selected={answers.role === "writer"}
                  onSelect={() => setRole("writer")}
                  label={t.onboarding.optionWriter}
                />
                <OptionCard
                  selected={answers.role === "founder"}
                  onSelect={() => setRole("founder")}
                  label={t.onboarding.optionFounder}
                />
                <OtherOptionCard
                  selected={answers.role === "other"}
                  onSelect={() => setRole("other")}
                  otherValue={answers.role_other ?? ""}
                  onOtherChange={(v) =>
                    setAnswers((a) => ({ ...a, role_other: v }))
                  }
                  placeholder={t.onboarding.roleOtherPlaceholder}
                />
              </QuestionBlock>

              <QuestionBlock
                num={3}
                question={t.onboarding.questionnaireQ3}
                ariaLabel={t.onboarding.questionnaireQ3}
              >
                <OptionCard
                  selected={answers.use_case === "coding"}
                  onSelect={() => setUseCase("coding")}
                  label={t.onboarding.optionWriteCode}
                />
                <OptionCard
                  selected={answers.use_case === "planning"}
                  onSelect={() => setUseCase("planning")}
                  label={t.onboarding.optionPlanProjects}
                />
                <OptionCard
                  selected={answers.use_case === "writing_research"}
                  onSelect={() => setUseCase("writing_research")}
                  label={t.onboarding.optionResearchWrite}
                />
                <OptionCard
                  selected={answers.use_case === "explore"}
                  onSelect={() => setUseCase("explore")}
                  label={t.onboarding.optionExplore}
                />
                <OtherOptionCard
                  selected={answers.use_case === "other"}
                  onSelect={() => setUseCase("other")}
                  otherValue={answers.use_case_other ?? ""}
                  onOtherChange={(v) =>
                    setAnswers((a) => ({ ...a, use_case_other: v }))
                  }
                  placeholder={t.onboarding.useCaseOtherPlaceholder}
                />
              </QuestionBlock>
            </div>
          </div>
        </main>

        <footer className="flex shrink-0 items-center justify-end gap-4 bg-background px-6 py-4 sm:px-10 md:px-14 lg:px-16">
          <span
            aria-live="polite"
            className="text-xs tabular-nums text-muted-foreground"
          >
            {t.onboarding.questionnaireAnswered(answeredCount)}
          </span>
          <Button size="lg" disabled={!canContinue || submitting} onClick={submit}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.common.continue}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </footer>
      </div>

      <aside className="hidden min-h-0 border-l bg-muted/40 lg:flex lg:flex-col">
        <DragStrip />
        <div className="min-h-0 flex-1 overflow-y-auto px-12 py-12">
          <WhyWeAsk />
        </div>
      </aside>
    </div>
  );
}

function QuestionBlock({
  num,
  question,
  ariaLabel,
  children,
}: {
  num: number;
  question: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <fieldset role="radiogroup" aria-label={ariaLabel} className="m-0 p-0">
      <legend className="mb-3 flex items-baseline gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          {String(num).padStart(2, "0")}
        </span>
        <span className="font-serif text-[22px] font-medium leading-tight tracking-tight text-foreground">
          {question}
        </span>
      </legend>
      <div className="flex flex-col gap-2">{children}</div>
    </fieldset>
  );
}

function WhyWeAsk() {
  const { t } = useAppI18n();

  return (
    <div className="flex max-w-[380px] flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {t.onboarding.whyThreeQuestions}
        </div>
        <h2 className="font-serif text-[22px] font-medium leading-[1.25] tracking-tight text-foreground">
          {t.onboarding.soYouLandRunning}
        </h2>
      </section>

      <section className="flex flex-col gap-4">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {t.onboarding.whatYouGet}
        </div>
        <div className="flex flex-col gap-4">
          <UnlockItem
            icon={<PenLine className="h-4 w-4" />}
            title={t.onboarding.starterProjectTitle}
            body={t.onboarding.starterProjectBody}
          />
          <UnlockItem
            icon={<Sparkles className="h-4 w-4" />}
            title={t.onboarding.headStartTitle}
            body={t.onboarding.headStartBody}
          />
        </div>
      </section>
    </div>
  );
}

function UnlockItem({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="grid grid-cols-[22px_1fr] gap-3">
      <div
        aria-hidden
        className="flex h-[20px] w-[20px] items-center justify-center text-muted-foreground"
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <div className="text-[13.5px] font-medium text-foreground">{title}</div>
        <div className="mt-1 text-[12.5px] leading-[1.55] text-muted-foreground">
          {body}
        </div>
      </div>
    </div>
  );
}
