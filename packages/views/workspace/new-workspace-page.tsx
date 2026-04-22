"use client";

import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@multica/ui/components/ui/button";
import type { Workspace } from "@multica/core/types";
import { useLogout } from "../auth";
import { DragStrip } from "../platform";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { useAppI18n } from "../i18n";

export function NewWorkspacePage({
  onSuccess,
  onBack,
}: {
  onSuccess: (workspace: Workspace) => void;
  onBack?: () => void;
}) {
  const logout = useLogout();
  const { t } = useAppI18n();

  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <DragStrip />
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-16 left-12 text-muted-foreground"
          onClick={onBack}
        >
          <ArrowLeft />
          {t.common.back}
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-16 right-12 text-muted-foreground hover:text-destructive"
        onClick={logout}
      >
        <LogOut />
        {t.workspace.logOut}
      </Button>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t.workspace.welcome}
            </h1>
            <p className="mt-3 text-muted-foreground">{t.workspace.intro}</p>
          </div>
          <CreateWorkspaceForm onSuccess={onSuccess} />
          <p className="text-center text-xs text-muted-foreground">
            {t.workspace.inviteLater}
          </p>
        </div>
      </div>
    </div>
  );
}
