"use client";

import { useEffect, useState } from "react";
import { Save, LogOut } from "lucide-react";
import { Input } from "@multica/ui/components/ui/input";
import { Textarea } from "@multica/ui/components/ui/textarea";
import { Label } from "@multica/ui/components/ui/label";
import { Button } from "@multica/ui/components/ui/button";
import { Card, CardContent } from "@multica/ui/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@multica/ui/components/ui/alert-dialog";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@multica/core/auth";
import { useLeaveWorkspace, useDeleteWorkspace } from "@multica/core/workspace/mutations";
import { useWorkspaceId } from "@multica/core/hooks";
import {
  memberListOptions,
  workspaceKeys,
  workspaceListOptions,
} from "@multica/core/workspace/queries";
import { api } from "@multica/core/api";
import {
  resolvePostAuthDestination,
  useCurrentWorkspace,
  useHasOnboarded,
} from "@multica/core/paths";
import { setCurrentWorkspace } from "@multica/core/platform";
import type { Workspace } from "@multica/core/types";
import { useNavigation } from "../../navigation";
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog";
import { useAppI18n } from "../../i18n";

export function WorkspaceTab() {
  const { t } = useAppI18n();
  const user = useAuthStore((s) => s.user);
  const workspace = useCurrentWorkspace();
  const wsId = useWorkspaceId();
  const { data: members = [], isFetched: membersFetched } = useQuery(memberListOptions(wsId));
  const qc = useQueryClient();
  const leaveWorkspace = useLeaveWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const navigation = useNavigation();
  const hasOnboarded = useHasOnboarded();

  const navigateAwayFromCurrentWorkspace = () => {
    const cachedList =
      qc.getQueryData<Workspace[]>(workspaceListOptions().queryKey) ?? [];
    const remaining = cachedList.filter((w) => w.id !== workspace?.id);
    setCurrentWorkspace(null, null);
    navigation.push(resolvePostAuthDestination(remaining, hasOnboarded));
  };

  const [name, setName] = useState(workspace?.name ?? "");
  const [description, setDescription] = useState(workspace?.description ?? "");
  const [context, setContext] = useState(workspace?.context ?? "");
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    variant?: "destructive";
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const currentMember = members.find((m) => m.user_id === user?.id) ?? null;
  const canManageWorkspace = currentMember?.role === "owner" || currentMember?.role === "admin";
  const isOwner = currentMember?.role === "owner";
  const ownerCount = members.filter((m) => m.role === "owner").length;
  const isSoleOwner = isOwner && ownerCount <= 1;
  const isSoleMember = members.length <= 1;

  useEffect(() => {
    setName(workspace?.name ?? "");
    setDescription(workspace?.description ?? "");
    setContext(workspace?.context ?? "");
  }, [workspace]);

  const handleSave = async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      const updated = await api.updateWorkspace(workspace.id, {
        name,
        description,
        context,
      });
      qc.setQueryData(workspaceKeys.list(), (old: Workspace[] | undefined) =>
        old?.map((ws) => (ws.id === updated.id ? updated : ws)),
      );
      toast.success(t.workspace.generalSaved);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.workspace.generalSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveWorkspace = () => {
    if (!workspace) return;
    setConfirmAction({
      title: t.workspace.leaveTitle,
      description: t.workspace.leaveDescription(workspace.name),
      variant: "destructive",
      onConfirm: async () => {
        setActionId("leave");
        navigateAwayFromCurrentWorkspace();
        try {
          await leaveWorkspace.mutateAsync(workspace.id);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : t.workspace.leaveFailed);
        } finally {
          setActionId(null);
        }
      },
    });
  };

  const handleConfirmDelete = async () => {
    if (!workspace) return;
    setActionId("delete-workspace");
    setDeleteDialogOpen(false);
    navigateAwayFromCurrentWorkspace();
    try {
      await deleteWorkspace.mutateAsync(workspace.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.workspace.deleteFailed);
    } finally {
      setActionId(null);
    }
  };

  if (!workspace) return null;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">{t.workspace.generalHeading}</h2>

        <Card>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t.settings.nameLabel}</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canManageWorkspace}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t.workspace.descriptionLabel}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={!canManageWorkspace}
                className="mt-1 resize-none"
                placeholder={t.workspace.descriptionPlaceholder}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t.workspace.contextLabel}</Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
                disabled={!canManageWorkspace}
                className="mt-1 resize-none"
                placeholder={t.workspace.contextPlaceholder}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t.workspace.slugLabel}</Label>
              <div className="mt-1 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                {workspace.slug}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !name.trim() || !canManageWorkspace}
              >
                <Save className="h-3 w-3" />
                {saving ? t.common.saving : t.common.save}
              </Button>
            </div>
            {!canManageWorkspace && (
              <p className="text-xs text-muted-foreground">
                {t.workspace.onlyAdminsOwners}
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {membersFetched && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <LogOut className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{t.workspace.dangerZone}</h2>
          </div>

          <Card>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">{t.workspace.leaveTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {isSoleOwner
                      ? isSoleMember
                        ? t.workspace.onlyMemberDelete
                        : t.workspace.onlyOwnerPromote
                      : t.workspace.removeYourself}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeaveWorkspace}
                  disabled={actionId === "leave" || isSoleOwner}
                >
                  {actionId === "leave" ? t.workspace.leaving : t.workspace.leaveButton}
                </Button>
              </div>

              {isOwner && (
                <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-destructive">{t.workspace.deleteRowTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.workspace.deleteRowDescription}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={actionId === "delete-workspace"}
                  >
                    {actionId === "delete-workspace" ? t.workspace.deleting : t.workspace.deleteButton}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={(v) => { if (!v) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmAction?.variant === "destructive" ? "destructive" : "default"}
              onClick={async () => {
                await confirmAction?.onConfirm();
                setConfirmAction(null);
              }}
            >
              {t.common.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteWorkspaceDialog
        workspaceName={workspace.name}
        loading={actionId === "delete-workspace"}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (actionId === "delete-workspace" && !open) return;
          setDeleteDialogOpen(open);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
