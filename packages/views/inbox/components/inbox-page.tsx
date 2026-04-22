"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceId } from "@multica/core/hooks";
import { useWorkspacePaths } from "@multica/core/paths";
import {
  inboxListOptions,
  deduplicateInboxItems,
} from "@multica/core/inbox/queries";
import {
  useMarkInboxRead,
  useArchiveInbox,
  useMarkAllInboxRead,
  useArchiveAllInbox,
  useArchiveAllReadInbox,
  useArchiveCompletedInbox,
} from "@multica/core/inbox/mutations";
import { IssueDetail } from "../../issues/components";
import { useNavigation } from "../../navigation";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Inbox,
  CheckCheck,
  Archive,
  BookCheck,
  ListChecks,
  ArrowLeft,
} from "lucide-react";
import type { InboxItem } from "@multica/core/types";
import { Button } from "@multica/ui/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@multica/ui/components/ui/resizable";
import { Skeleton } from "@multica/ui/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@multica/ui/components/ui/dropdown-menu";
import { useIsMobile } from "@multica/ui/hooks/use-mobile";
import { PageHeader } from "../../layout/page-header";
import { InboxListItem, timeAgo } from "./inbox-list-item";
import { useAppI18n } from "../../i18n";

function getInboxTypeLabel(
  itemType: InboxItem["type"],
  item: InboxItem,
  t: ReturnType<typeof useAppI18n>["t"],
): string {
  if (itemType === "new_comment" && item.body) return item.body;

  switch (itemType) {
    case "issue_assigned":
      return t.inbox.assigned;
    case "unassigned":
      return t.inbox.unassigned;
    case "assignee_changed":
      return t.inbox.assigneeChanged;
    case "status_changed":
      return t.inbox.statusChanged;
    case "priority_changed":
      return t.inbox.priorityChanged;
    case "due_date_changed":
      return t.inbox.dueDateChanged;
    case "new_comment":
      return t.inbox.newComment;
    case "mentioned":
      return t.inbox.mentioned;
    case "review_requested":
      return t.inbox.reviewRequested;
    case "task_completed":
      return t.inbox.taskCompleted;
    case "task_failed":
      return t.inbox.taskFailed;
    case "agent_blocked":
      return t.inbox.agentBlocked;
    case "agent_completed":
      return t.inbox.agentCompleted;
    case "reaction_added":
      return t.inbox.reacted;
    default:
      return itemType;
  }
}

export function InboxPage() {
  const { t } = useAppI18n();
  const { searchParams, replace } = useNavigation();
  const urlIssue = searchParams.get("issue") ?? "";
  const wsPaths = useWorkspacePaths();

  const [selectedKey, setSelectedKeyState] = useState(() => urlIssue);

  useEffect(() => {
    setSelectedKeyState(urlIssue);
  }, [urlIssue]);

  const wsId = useWorkspaceId();
  const { data: rawItems = [], isLoading: loading } = useQuery(
    inboxListOptions(wsId),
  );
  const items = useMemo(() => deduplicateInboxItems(rawItems), [rawItems]);

  const selected = items.find((i) => (i.issue_id ?? i.id) === selectedKey) ?? null;

  const lastResolvedKeyRef = useRef<string>("");
  useEffect(() => {
    if (selected) lastResolvedKeyRef.current = selectedKey;
  }, [selected, selectedKey]);

  const setSelectedKey = useCallback(
    (key: string) => {
      setSelectedKeyState(key);
      const inboxPath = wsPaths.inbox();
      const url = key ? `${inboxPath}?issue=${key}` : inboxPath;
      replace(url);
    },
    [replace, wsPaths],
  );

  useEffect(() => {
    if (loading) return;
    if (!selectedKey) return;
    if (selected) return;
    if (lastResolvedKeyRef.current === selectedKey) {
      setSelectedKey("");
      return;
    }
    replace(wsPaths.issueDetail(selectedKey));
  }, [loading, selectedKey, selected, replace, wsPaths, setSelectedKey]);

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "multica_inbox_layout",
  });

  const isMobile = useIsMobile();
  const unreadCount = items.filter((i) => !i.read).length;

  const markReadMutation = useMarkInboxRead();
  const archiveMutation = useArchiveInbox();
  const markAllReadMutation = useMarkAllInboxRead();
  const archiveAllMutation = useArchiveAllInbox();
  const archiveAllReadMutation = useArchiveAllReadInbox();
  const archiveCompletedMutation = useArchiveCompletedInbox();

  const handleSelect = (item: InboxItem) => {
    setSelectedKey(item.issue_id ?? item.id);
    if (!item.read) {
      markReadMutation.mutate(item.id, {
        onError: () => toast.error(t.inbox.markReadFailed),
      });
    }
  };

  const handleArchive = (id: string) => {
    const archived = items.find((i) => i.id === id);
    if (archived && (archived.issue_id ?? archived.id) === selectedKey) {
      setSelectedKey("");
    }
    archiveMutation.mutate(id, {
      onError: () => toast.error(t.inbox.archiveFailed),
    });
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onError: () => toast.error(t.inbox.markAllReadFailed),
    });
  };

  const handleArchiveAll = () => {
    setSelectedKey("");
    archiveAllMutation.mutate(undefined, {
      onError: () => toast.error(t.inbox.archiveAllFailed),
    });
  };

  const handleArchiveAllRead = () => {
    const readKeys = items.filter((i) => i.read).map((i) => i.issue_id ?? i.id);
    if (readKeys.includes(selectedKey)) setSelectedKey("");
    archiveAllReadMutation.mutate(undefined, {
      onError: () => toast.error(t.inbox.archiveReadFailed),
    });
  };

  const handleArchiveCompleted = () => {
    setSelectedKey("");
    archiveCompletedMutation.mutate(undefined, {
      onError: () => toast.error(t.inbox.archiveCompletedFailed),
    });
  };

  const listHeader = (
    <PageHeader className="justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold">{t.inbox.title}</h1>
        {unreadCount > 0 && (
          <span className="text-xs text-muted-foreground">{unreadCount}</span>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuItem onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4" />
            {t.inbox.markAllAsRead}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleArchiveAll}>
            <Archive className="h-4 w-4" />
            {t.inbox.archiveAll}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchiveAllRead}>
            <BookCheck className="h-4 w-4" />
            {t.inbox.archiveAllRead}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchiveCompleted}>
            <ListChecks className="h-4 w-4" />
            {t.inbox.archiveCompleted}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </PageHeader>
  );

  const listBody =
    items.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Inbox className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm">{t.inbox.noNotifications}</p>
      </div>
    ) : (
      <div>
        {items.map((item) => (
          <InboxListItem
            key={item.id}
            item={item}
            isSelected={(item.issue_id ?? item.id) === selectedKey}
            onClick={() => handleSelect(item)}
            onArchive={() => handleArchive(item.id)}
          />
        ))}
      </div>
    );

  const detailContent = selected?.issue_id ? (
    <IssueDetail
      key={selected.issue_id}
      issueId={selected.issue_id}
      defaultSidebarOpen={false}
      layoutId="multica_inbox_issue_detail_layout"
      highlightCommentId={selected.details?.comment_id ?? undefined}
      onDelete={() => {
        setSelectedKey("");
      }}
    />
  ) : selected ? (
    <div className="p-6">
      <h2 className="text-lg font-semibold">{selected.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {getInboxTypeLabel(selected.type, selected, t)} · {timeAgo(selected.created_at)}
      </p>
      {selected.body && (
        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
          {selected.body}
        </div>
      )}
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleArchive(selected.id)}
        >
          <Archive className="mr-1.5 h-3.5 w-3.5" />
          {t.inbox.archiveAction}
        </Button>
      </div>
    </div>
  ) : null;

  if (isMobile) {
    if (loading) {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-12 shrink-0 items-center border-b px-4">
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex-1 min-h-0 space-y-1 overflow-y-auto p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selected) {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-12 shrink-0 items-center border-b px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedKey("")}
              className="gap-1.5 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.inbox.backToInbox}
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">{detailContent}</div>
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {listHeader}
        <div className="flex-1 min-h-0 overflow-y-auto">{listBody}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1 min-h-0"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
      >
        <ResizablePanel
          id="list"
          defaultSize={320}
          minSize={240}
          maxSize={480}
          groupResizeBehavior="preserve-pixel-size"
        >
          <div className="flex h-full flex-col border-r">
            <div className="flex h-12 shrink-0 items-center border-b px-4">
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex-1 min-h-0 space-y-1 overflow-y-auto p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="detail" minSize="40%">
          <div className="p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-4 h-4 w-32" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="flex-1 min-h-0"
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
    >
      <ResizablePanel
        id="list"
        defaultSize={320}
        minSize={240}
        maxSize={480}
        groupResizeBehavior="preserve-pixel-size"
      >
        <div className="flex h-full flex-col border-r">
          {listHeader}
          <div className="flex-1 min-h-0 overflow-y-auto">{listBody}</div>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="detail" minSize="40%">
        <div className="flex h-full min-h-0 flex-col">
          {detailContent ?? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Inbox className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm">
                {items.length === 0 ? t.inbox.emptyTitle : t.inbox.selectToView}
              </p>
            </div>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
