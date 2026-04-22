"use client";

import { useMemo, useState, useEffect } from "react";
import { ListTodo } from "lucide-react";
import type { Agent, AgentTask, Issue } from "@multica/core/types";
import { Skeleton } from "@multica/ui/components/ui/skeleton";
import { api } from "@multica/core/api";
import { useWorkspaceId } from "@multica/core/hooks";
import { useWorkspacePaths } from "@multica/core/paths";
import { issueDetailOptions } from "@multica/core/issues/queries";
import { useQueries } from "@tanstack/react-query";
import { AppLink } from "../../../navigation";
import { taskStatusConfig } from "../../config";
import { useAppI18n } from "../../../i18n";

export function TasksTab({ agent }: { agent: Agent }) {
  const { t, formatDateTime } = useAppI18n();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const wsId = useWorkspaceId();
  const paths = useWorkspacePaths();

  useEffect(() => {
    setLoading(true);
    api
      .listAgentTasks(agent.id)
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [agent.id]);

  const issueIds = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.issue_id).filter((id) => id !== ""))),
    [tasks],
  );
  const issueQueries = useQueries({
    queries: issueIds.map((id) => issueDetailOptions(wsId, id)),
  });
  const issueMap = useMemo(() => {
    const map = new Map<string, Issue>();
    issueQueries.forEach((q, i) => {
      const id = issueIds[i]!;
      if (q.data) map.set(id, q.data);
    });
    return map;
  }, [issueQueries, issueIds]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <Skeleton className="h-4 w-4 rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const activeStatuses = ["running", "dispatched", "queued"];
  const sortedTasks = [...tasks].sort((a, b) => {
    const aActive = activeStatuses.indexOf(a.status);
    const bActive = activeStatuses.indexOf(b.status);
    const aIsActive = aActive !== -1;
    const bIsActive = bActive !== -1;
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;
    if (aIsActive && bIsActive) return aActive - bActive;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t.agents.taskQueueHeading}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{t.agents.taskQueueDescription}</p>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <ListTodo className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">{t.agents.noTasksInQueue}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.agents.noTasksDescription}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedTasks.map((task) => {
            const config = taskStatusConfig[task.status] ?? taskStatusConfig.queued!;
            const Icon = config.icon;
            const hasIssue = task.issue_id !== "";
            const issue = hasIssue ? issueMap.get(task.issue_id) : undefined;
            const isActive = task.status === "running" || task.status === "dispatched";
            const isRunning = task.status === "running";
            const rowClassName = `flex items-center gap-3 rounded-lg border px-4 py-3 transition-shadow hover:shadow-sm ${
              isRunning
                ? "border-success/40 bg-success/5"
                : task.status === "dispatched"
                  ? "border-info/40 bg-info/5"
                  : ""
            }`;

            let meta = t.agents.taskQueuedAt(formatDateTime(task.created_at));
            if (isRunning && task.started_at) meta = t.agents.taskStartedAt(formatDateTime(task.started_at));
            else if (task.status === "dispatched" && task.dispatched_at) meta = t.agents.taskDispatchedAt(formatDateTime(task.dispatched_at));
            else if (task.status === "completed" && task.completed_at) meta = t.agents.taskCompletedAt(formatDateTime(task.completed_at));
            else if (task.status === "failed" && task.completed_at) meta = t.agents.taskFailedAt(formatDateTime(task.completed_at));

            const content = (
              <>
                <Icon className={`h-4 w-4 shrink-0 ${config.color} ${isRunning ? "animate-spin" : ""}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {issue && <span className="shrink-0 text-xs font-mono text-muted-foreground">{issue.identifier}</span>}
                    <span className={`truncate text-sm ${isActive ? "font-medium" : ""}`}>
                      {issue?.title ?? (hasIssue ? t.agents.taskIssueFallback(task.issue_id.slice(0, 8)) : t.agents.taskWithoutLinkedIssue)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{meta}</div>
                </div>
                <span className={`shrink-0 text-xs font-medium ${config.color}`}>{config.label}</span>
              </>
            );

            if (!hasIssue) {
              return <div key={task.id} className={rowClassName}>{content}</div>;
            }

            return (
              <AppLink
                key={task.id}
                href={paths.issueDetail(task.issue_id)}
                className={`${rowClassName} text-foreground no-underline hover:no-underline`}
              >
                {content}
              </AppLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
