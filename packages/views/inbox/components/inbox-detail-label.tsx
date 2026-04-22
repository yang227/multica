"use client";

import { STATUS_CONFIG, PRIORITY_CONFIG } from "@multica/core/issues/config";
import { useActorName } from "@multica/core/workspace/hooks";
import { StatusIcon, PriorityIcon } from "../../issues/components";
import type { InboxItem, InboxItemType, IssueStatus, IssuePriority } from "@multica/core/types";
import { useAppI18n } from "../../i18n";

function shortDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function InboxDetailLabel({ item }: { item: InboxItem }) {
  const { t } = useAppI18n();
  const { getActorName } = useActorName();
  const details = item.details ?? {};
  const typeLabels: Record<InboxItemType, string> = {
    issue_assigned: t.inbox.assigned,
    unassigned: t.inbox.unassigned,
    assignee_changed: t.inbox.assigneeChanged,
    status_changed: t.inbox.statusChanged,
    priority_changed: t.inbox.priorityChanged,
    due_date_changed: t.inbox.dueDateChanged,
    new_comment: t.inbox.newComment,
    mentioned: t.inbox.mentioned,
    review_requested: t.inbox.reviewRequested,
    task_completed: t.inbox.taskCompleted,
    task_failed: t.inbox.taskFailed,
    agent_blocked: t.inbox.agentBlocked,
    agent_completed: t.inbox.agentCompleted,
    reaction_added: t.inbox.reacted,
  };

  switch (item.type) {
    case "status_changed": {
      if (!details.to) return <span>{typeLabels[item.type]}</span>;
      const label = STATUS_CONFIG[details.to as IssueStatus]?.label ?? details.to;
      return (
        <span className="inline-flex items-center gap-1">
          {t.inbox.detailSetStatusTo}
          <StatusIcon status={details.to as IssueStatus} className="h-3 w-3" />
          {label}
        </span>
      );
    }
    case "priority_changed": {
      if (!details.to) return <span>{typeLabels[item.type]}</span>;
      const label = PRIORITY_CONFIG[details.to as IssuePriority]?.label ?? details.to;
      return (
        <span className="inline-flex items-center gap-1">
          {t.inbox.detailSetPriorityTo}
          <PriorityIcon priority={details.to as IssuePriority} className="h-3 w-3" />
          {label}
        </span>
      );
    }
    case "issue_assigned": {
      if (details.new_assignee_id) {
        return <span>{t.inbox.detailAssignedTo} {getActorName(details.new_assignee_type ?? "member", details.new_assignee_id)}</span>;
      }
      return <span>{typeLabels[item.type]}</span>;
    }
    case "unassigned":
      return <span>{t.inbox.detailRemovedAssignee}</span>;
    case "assignee_changed": {
      if (details.new_assignee_id) {
        return <span>{t.inbox.detailAssignedTo} {getActorName(details.new_assignee_type ?? "member", details.new_assignee_id)}</span>;
      }
      return <span>{typeLabels[item.type]}</span>;
    }
    case "due_date_changed": {
      if (details.to) return <span>{t.inbox.detailSetDueDateTo} {shortDate(details.to)}</span>;
      return <span>{t.inbox.detailRemovedDueDate}</span>;
    }
    case "new_comment": {
      if (item.body) return <span>{item.body}</span>;
      return <span>{typeLabels[item.type]}</span>;
    }
    case "reaction_added": {
      const emoji = details.emoji;
      if (emoji) return <span>{t.inbox.detailReactedToComment(emoji)}</span>;
      return <span>{typeLabels[item.type]}</span>;
    }
    default:
      return <span>{typeLabels[item.type] ?? item.type}</span>;
  }
}
