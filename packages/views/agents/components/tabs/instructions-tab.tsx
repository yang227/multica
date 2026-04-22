"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import type { Agent } from "@multica/core/types";
import { Button } from "@multica/ui/components/ui/button";
import { useAppI18n } from "../../../i18n";

export function InstructionsTab({
  agent,
  onSave,
}: {
  agent: Agent;
  onSave: (instructions: string) => Promise<void>;
}) {
  const { t } = useAppI18n();
  const [value, setValue] = useState(agent.instructions ?? "");
  const [saving, setSaving] = useState(false);
  const isDirty = value !== (agent.instructions ?? "");

  useEffect(() => {
    setValue(agent.instructions ?? "");
  }, [agent.id, agent.instructions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value);
    } catch {
      // toast handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t.agents.instructionsHeading}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{t.agents.instructionsDescription}</p>
      </div>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t.agents.instructionsPlaceholder}
        className="min-h-[300px] w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {value.length > 0 ? t.agents.instructionCount(value.length) : t.agents.noInstructions}
        </span>
        <Button size="xs" onClick={handleSave} disabled={!isDirty || saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          {t.common.save}
        </Button>
      </div>
    </div>
  );
}
