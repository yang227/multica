"use client";

import { useState } from "react";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import type { Agent } from "@multica/core/types";
import { Button } from "@multica/ui/components/ui/button";
import { Input } from "@multica/ui/components/ui/input";
import { Label } from "@multica/ui/components/ui/label";
import { toast } from "sonner";
import { useAppI18n } from "../../../i18n";

let nextEnvId = 0;

interface EnvEntry {
  id: number;
  key: string;
  value: string;
  visible: boolean;
}

function envMapToEntries(env: Record<string, string>): EnvEntry[] {
  return Object.entries(env).map(([key, value]) => ({
    id: nextEnvId++,
    key,
    value,
    visible: false,
  }));
}

function entriesToEnvMap(entries: EnvEntry[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const entry of entries) {
    const key = entry.key.trim();
    if (key) {
      map[key] = entry.value;
    }
  }
  return map;
}

export function EnvTab({
  agent,
  readOnly = false,
  onSave,
}: {
  agent: Agent;
  readOnly?: boolean;
  onSave: (updates: Partial<Agent>) => Promise<void>;
}) {
  const { t } = useAppI18n();
  const [envEntries, setEnvEntries] = useState<EnvEntry[]>(
    envMapToEntries(agent.custom_env ?? {}),
  );
  const [saving, setSaving] = useState(false);

  const currentEnvMap = entriesToEnvMap(envEntries);
  const originalEnvMap = agent.custom_env ?? {};
  const dirty = JSON.stringify(currentEnvMap) !== JSON.stringify(originalEnvMap);

  const addEnvEntry = () => {
    setEnvEntries([
      ...envEntries,
      { id: nextEnvId++, key: "", value: "", visible: true },
    ]);
  };

  const removeEnvEntry = (index: number) => {
    setEnvEntries(envEntries.filter((_, i) => i !== index));
  };

  const updateEnvEntry = (index: number, field: "key" | "value", val: string) => {
    setEnvEntries(
      envEntries.map((entry, i) => (i === index ? { ...entry, [field]: val } : entry)),
    );
  };

  const toggleEnvVisibility = (index: number) => {
    setEnvEntries(
      envEntries.map((entry, i) => (i === index ? { ...entry, visible: !entry.visible } : entry)),
    );
  };

  const handleSave = async () => {
    const keys = envEntries.filter((e) => e.key.trim()).map((e) => e.key.trim());
    const uniqueKeys = new Set(keys);
    if (uniqueKeys.size < keys.length) {
      toast.error(t.agents.envDuplicateKeys);
      return;
    }

    setSaving(true);
    try {
      await onSave({ custom_env: currentEnvMap });
      toast.success(t.agents.envSaved);
    } catch {
      toast.error(t.agents.envSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  if (readOnly) {
    return (
      <div className="max-w-lg space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">{t.agents.envLabel}</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.agents.envReadOnlyDescription}</p>
        </div>
        {envEntries.length > 0 ? (
          <div className="space-y-2">
            {envEntries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2">
                <Input value={entry.key} readOnly className="w-[40%] bg-muted font-mono text-xs" />
                <div className="relative flex-1">
                  <Input type="password" value="****" readOnly className="bg-muted pr-8 font-mono text-xs" />
                  <Lock className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs italic text-muted-foreground">{t.agents.noEnvConfigured}</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs text-muted-foreground">{t.agents.envLabel}</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.agents.envDescription}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addEnvEntry} className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" />
          {t.agents.addVariable}
        </Button>
      </div>
      {envEntries.length > 0 && (
        <div className="space-y-2">
          {envEntries.map((entry, index) => (
            <div key={entry.id} className="flex items-center gap-2">
              <Input
                value={entry.key}
                onChange={(e) => updateEnvEntry(index, "key", e.target.value)}
                placeholder="KEY"
                className="w-[40%] font-mono text-xs"
              />
              <div className="relative flex-1">
                <Input
                  type={entry.visible ? "text" : "password"}
                  value={entry.value}
                  onChange={(e) => updateEnvEntry(index, "value", e.target.value)}
                  placeholder="value"
                  className="pr-8 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => toggleEnvVisibility(index)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {entry.visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeEnvEntry(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
        {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
        {t.common.save}
      </Button>
    </div>
  );
}
