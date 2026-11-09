"use client";
import {
  date,
  label,
  useSales,
  useSalesMutation,
  type Entity,
  type SalesContext,
} from "@/lib/sales";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Avatar,
  Back,
  Badge,
  Button,
  Card,
  DataState,
  DetailRows,
  Empty,
  Field,
  FormModal,
  Metric,
  Metrics,
  Modal,
  PageTitle,
  SearchBox,
  Select,
  Table,
  Tabs,
  Timeline,
} from "./ui";
export function TasksPage({
  id,
  team = false,
}: {
  id?: string;
  team?: boolean;
}) {
  const [view, setView] = useState("My Tasks"),
    [filter, setFilter] = useState("Today"),
    [day, setDay] = useState<{ member: Entity; date: string }>(),
    q = useSales<Entity[]>(
      `/tasks${team && view === "Team View" ? "?team=true" : ""}`,
    ),
    ctx = useSales<SalesContext>("/context"),
    leads = useSales<Entity[]>(`/leads${team ? "?team=true" : ""}`),
    m = useSalesMutation(),
    router = useRouter(),
    p = useSearchParams(),
    [edit, setEdit] = useState(false),
    [defer, setDefer] = useState<Entity>();
  const tasks = q.data || [],
    task = tasks.find((t) => t._id === id),
    creating = id === "new",
    open = tasks.filter((t) => !["done", "cancelled"].includes(t.status || "")),
    overdue = open.filter((t) => t.dueDate && new Date(t.dueDate) < new Date()),
    rows = tasks.filter((t) =>
      filter === "Completed"
        ? t.status === "done"
        : filter === "Upcoming"
          ? open.includes(t) &&
            !!t.dueDate &&
            new Date(t.dueDate).toDateString() !== new Date().toDateString() &&
            new Date(t.dueDate) > new Date()
          : filter === "Overdue"
            ? overdue.includes(t)
            : open.includes(t) &&
              (!t.dueDate ||
                new Date(t.dueDate).toDateString() ===
                  new Date().toDateString()),
    );
  const now = new Date(),
    week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + i);
      return d;
    });
  const form = (
    <>
      <Field
        label="Task title"
        name="title"
        required
        defaultValue={task?.title}
      />
      <Field
        label="Priority"
        name="priority"
        defaultValue={task?.priority || "medium"}
        options={["low", "medium", "high", "urgent"].map((x) => ({
          value: x,
          label: label(x),
        }))}
      />
      <Field
        label="Due date"
        name="dueDate"
        type="datetime-local"
        defaultValue={task?.dueDate?.slice(0, 16)}
      />
      {!task && (
        <Field
          label="Linked Lead"
          name="lead_id"
          defaultValue={p.get("lead") || ""}
          options={(leads.data || []).map((l) => ({
            value: l._id,
            label: l.company || l.name || "Lead",
          }))}
        />
      )}
      <Field
        label="Description / expected outcome"
        name="description"
        type="textarea"
        defaultValue={task?.description}
      />
      {team && !task && (
        <Field
          label="Assign to"
          name="assignee_id"
          options={(ctx.data?.members || []).map((x) => ({
            value: x.user_id || "",
            label: x.name || "Partner",
          }))}
        />
      )}
    </>
  );
  async function save(b: Record<string, string>) {
    const clean = Object.fromEntries(
      Object.entries(b).filter(([, v]) => v !== ""),
    );
    await m.mutateAsync({
      path: task ? `/tasks/${task._id}` : "/tasks",
      method: task ? "patch" : "post",
      body: clean,
    });
    router.push(team ? "/team/tasks" : "/tasks");
  }
  if (creating)
    return (
      <>
        <Back href={team ? "/team/tasks" : "/tasks"}>Back to Tasks</Back>
        <PageTitle
          title={team ? "Create & assign task" : "Create personal task"}
          description="Make the owner, expected outcome and due time clear."
        />
        <div className="nv-grid">
          <Card title="Task setup">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await save(
                  Object.fromEntries(new FormData(e.currentTarget)) as Record<
                    string,
                    string
                  >,
                );
              }}
            >
              <div className="nv-form-grid">{form}</div>
              <div className="nv-form-actions">
                <Button href="/tasks">Cancel</Button>
                <Button type="submit" primary disabled={m.isPending}>
                  Create task
                </Button>
              </div>
            </form>
          </Card>
          <div className="nv-stack">
            <Card title="Create with Kora">
              <p className="nv-caption">
                Prepare a clear task description from the current commercial
                context.
              </p>
              <Button href="/assistant?prompt=Help%20me%20prepare%20a%20clear%20follow-up%20task">
                <Sparkles size={13} />
                Open Assistant
              </Button>
            </Card>
            <Card title="How personal tasks work">
              <DetailRows
                rows={[
                  ["Owner", "You, by default"],
                  ["Source", "Manual"],
                  ["Domain changes", "Explicit separate action"],
                  [
                    "Team assignment",
                    team ? "Direct reports only" : "Sales Team Lead",
                  ],
                ]}
              />
            </Card>
          </div>
        </div>
      </>
    );
  return (
    <>
      {id ? (
        <Back href={team ? "/team/tasks" : "/tasks"}>Back to Tasks</Back>
      ) : null}
      <PageTitle
        title={task ? task.title || "Task" : "Tasks"}
        description={
          task
            ? "Stay focused on the outcome and keep the next step clear."
            : "Your accountable work, connected to the right records."
        }
        action={
          task ? (
            <>
              <Badge>{task.status}</Badge>
              <Button onClick={() => setEdit(true)}>Edit task</Button>
            </>
          ) : (
            <Button href={team ? "/team/tasks/new" : "/tasks/new"}>
              <Plus size={13} />
              {team ? "Create & Assign" : "Create task"}
            </Button>
          )
        }
      />
      {team && !id && (
        <Tabs
          items={["My Tasks", "Team View"]}
          active={view}
          onChange={setView}
        />
      )}
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {task ? (
          <div className="nv-grid">
            <div className="nv-stack">
              <Card title="Task overview">
                <DetailRows
                  rows={[
                    ["Status", <Badge key="s">{task.status}</Badge>],
                    ["Priority", label(task.priority)],
                    ["Due", date(task.dueDate)],
                    ["Source", label(task.source)],
                  ]}
                />
                <p className="nv-note">
                  {task.description || "No description added."}
                </p>
                <div className="nv-form-actions">
                  <Select
                    value={task.status || "todo"}
                    onChange={(status) => {
                      if (status === "deferred") setDefer(task);
                      else
                        m.mutate({
                          path: `/tasks/${task._id}`,
                          method: "patch",
                          body: { status },
                        });
                    }}
                    options={[
                      "todo",
                      "in_progress",
                      "blocked",
                      "deferred",
                      "done",
                      "cancelled",
                    ]}
                  />
                </div>
              </Card>
              <Card title="Checklist">
                {task.subtasks?.length ? (
                  task.subtasks.map((s, i) => (
                    <div className="nv-list-row" key={i}>
                      <button
                        className={`nv-task-check ${s.done ? "done" : ""}`}
                        aria-label={`Toggle ${s.title}`}
                        onClick={() =>
                          m.mutate({
                            path: `/tasks/${task._id}`,
                            method: "patch",
                            body: {
                              subtasks: task.subtasks?.map((v, j) =>
                                j === i ? { ...v, done: !v.done } : v,
                              ),
                            },
                          })
                        }
                      >
                        {s.done && <Check size={11} />}
                      </button>
                      <div>
                        <strong>{s.title}</strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="nv-caption">
                    No checklist items. Add expected outcomes in the
                    description.
                  </p>
                )}
              </Card>
              <Card title="Notes & activity">
                <Timeline
                  items={(task.history || []).map((h) => ({
                    title: label(h.status),
                    description: h.reason,
                    date: date(h.at),
                  }))}
                />
              </Card>
            </div>
            <div className="nv-stack">
              <Card title="Linked work">
                {task.links?.length ? (
                  task.links.map((l, i) => (
                    <Link
                      key={i}
                      className="nv-list-row"
                      href={l.type === "lead" ? `/leads/${l.ref}` : "/tasks"}
                    >
                      <FileText size={14} />
                      <div>
                        <strong>{l.label}</strong>
                        <small>{label(l.type)}</small>
                      </div>
                      <ArrowRight size={13} />
                    </Link>
                  ))
                ) : (
                  <p className="nv-caption">
                    This is a personal task without a linked commercial record.
                  </p>
                )}
              </Card>
              <Card title="Work on this with Kora">
                <p className="nv-caption">
                  Turn context into a useful draft or a proposed next step.
                </p>
                <Button
                  href={`/assistant?prompt=${encodeURIComponent(`Help me work on this task: ${task.title}`)}`}
                >
                  <Sparkles size={13} />
                  Ask Kora
                </Button>
              </Card>
            </div>
          </div>
        ) : id ? (
          <Empty
            title="Task not found"
            description="The Task may be unavailable in your current scope."
          />
        ) : (
          <>
            <Metrics>
              <Metric
                label="Open"
                value={open.length}
                detail="Actionable personal work"
              />
              <Metric
                label="Due / overdue"
                value={overdue.length}
                detail="Needs your attention"
              />
              <Metric
                label="Blocked"
                value={tasks.filter((t) => t.status === "blocked").length}
              />
              <Metric
                label="Completed"
                value={tasks.filter((t) => t.status === "done").length}
              />
            </Metrics>
            {view === "Team View" ? (
              <Card title="Direct team · week view">
                <div className="nv-table-scroll">
                  <table className="nv-table nv-team-week">
                    <thead>
                      <tr>
                        <th>Sales Partner</th>
                        {week.map((d) => (
                          <th key={d.toISOString()}>
                            {d.toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                            })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ctx.data?.members.map((member) => (
                        <tr key={member._id}>
                          <td>
                            <div className="nv-inline">
                              <Avatar name={member.name} small />
                              <strong>{member.name}</strong>
                            </div>
                          </td>
                          {week.map((d) => {
                            const dayTasks = tasks.filter(
                              (t) =>
                                t.assignee_id === member.user_id &&
                                t.dueDate?.slice(0, 10) ===
                                  d.toISOString().slice(0, 10),
                            );
                            return (
                              <td key={d.toISOString()}>
                                <button
                                  className="nv-stage-tile"
                                  onClick={() =>
                                    setDay({
                                      member,
                                      date: d.toISOString().slice(0, 10),
                                    })
                                  }
                                >
                                  <strong>{dayTasks.length}</strong>
                                  <small>
                                    {
                                      dayTasks.filter(
                                        (t) => t.status === "done",
                                      ).length
                                    }{" "}
                                    complete
                                  </small>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!ctx.data?.members.length && (
                  <Empty title="No direct team members" />
                )}
              </Card>
            ) : (
              <>
                <Tabs
                  items={["Today", "Upcoming", "Overdue", "Completed"]}
                  active={filter}
                  onChange={setFilter}
                />
                <div className="nv-grid">
                  <Card title={filter === "Today" ? "Your work list" : filter}>
                    {rows.length ? (
                      rows.map((t) => (
                        <div className="nv-list-row" key={t._id}>
                          <button
                            className={`nv-task-check ${t.status === "done" ? "done" : ""}`}
                            aria-label={`Complete ${t.title}`}
                            onClick={() =>
                              m.mutate({
                                path: `/tasks/${t._id}`,
                                method: "patch",
                                body: {
                                  status: t.status === "done" ? "todo" : "done",
                                },
                              })
                            }
                          >
                            {t.status === "done" && <Check size={11} />}
                          </button>
                          <div>
                            <Link href={`/tasks/${t._id}`}>
                              <strong>{t.title}</strong>
                            </Link>
                            <small>
                              {date(t.dueDate)} · {label(t.priority)}
                            </small>
                          </div>
                          <Badge>{t.status}</Badge>
                        </div>
                      ))
                    ) : (
                      <Empty
                        title="You're up to date"
                        description="No Tasks in this view. Plan your next accountable follow-up."
                      />
                    )}
                  </Card>
                  <Card title="Today's focus">
                    <DetailRows
                      rows={[
                        ["Open work", open.length],
                        [
                          "High priority",
                          open.filter((t) =>
                            ["high", "urgent"].includes(t.priority || ""),
                          ).length,
                        ],
                        [
                          "Deferred",
                          tasks.filter((t) => t.status === "deferred").length,
                        ],
                        [
                          "Assigned by team",
                          tasks.filter((t) => t.assignedBy).length,
                        ],
                      ]}
                    />
                    <Button href="/calendar">Open Calendar</Button>
                  </Card>
                </div>
              </>
            )}
          </>
        )}
      </DataState>
      <FormModal
        open={edit}
        onClose={() => setEdit(false)}
        title="Edit task"
        onSubmit={save}
      >
        {form}
      </FormModal>
      <FormModal
        open={!!defer}
        onClose={() => setDefer(undefined)}
        title="Defer task"
        onSubmit={(b) =>
          m.mutateAsync({
            path: `/tasks/${defer?._id}`,
            method: "patch",
            body: { ...b, status: "deferred" },
          })
        }
      >
        <Field
          label="New due date"
          name="dueDate"
          type="datetime-local"
          required
        />
        <Field label="Reason" name="reason" type="textarea" />
      </FormModal>
      <Modal
        open={!!day}
        onClose={() => setDay(undefined)}
        title={`${day?.member.name} · ${date(day?.date)}`}
      >
        <div>
          {tasks
            .filter(
              (t) =>
                t.assignee_id === day?.member.user_id &&
                t.dueDate?.slice(0, 10) === day?.date,
            )
            .map((t) => (
              <Link
                href={`/tasks/${t._id}`}
                className="nv-list-row"
                key={t._id}
              >
                <div>
                  <strong>{t.title}</strong>
                </div>
                <Badge>{t.status}</Badge>
              </Link>
            ))}
        </div>
        <Button href="/team/tasks/new">Create & Assign</Button>
      </Modal>
    </>
  );
}
export function WorkflowsPage({ actions = false }: { actions?: boolean }) {
  const templates = useSales<Entity[]>("/workflows"),
    runs = useSales<Entity[]>("/runs"),
    leads = useSales<Entity[]>("/leads"),
    [tab, setTab] = useState(actions ? "Activity" : "Start workflows"),
    [search, setSearch] = useState(""),
    [chosen, setChosen] = useState<Entity>(),
    [run, setRun] = useState<Entity>(),
    m = useSalesMutation();
  const icons = [Target, CalendarCheck, FileText, Users, Sparkles, Wallet];
  return (
    <>
      <PageTitle
        title={actions ? "Actions" : "Workflows"}
        description={
          actions
            ? "Controlled single operations, with preview and traceable results."
            : "Start a guided sales workflow and keep the handoffs accountable."
        }
        action={
          <Tabs
            items={["Start workflows", "Activity"]}
            active={tab}
            onChange={setTab}
          />
        }
      />
      <div className="nv-toolbar">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search workflows or activity..."
        />
      </div>
      <DataState
        pending={templates.isPending || runs.isPending}
        error={templates.error || runs.error}
        retry={() => {
          templates.refetch();
          runs.refetch();
        }}
      >
        {tab === "Start workflows" ? (
          <Card
            title="Your sales workflows"
            description="Prepared around the commercial work you can perform."
          >
            <div className="nv-course-grid">
              {templates.data
                ?.filter((t) =>
                  t.name?.toLowerCase().includes(search.toLowerCase()),
                )
                .map((t, i) => {
                  const Icon = icons[i % icons.length];
                  return (
                    <button
                      key={t.key}
                      className="nv-card-choice"
                      onClick={() => setChosen(t)}
                    >
                      <Icon size={22} />
                      <span className="nv-eyebrow">{t.category}</span>
                      <strong>{t.name}</strong>
                      <p>{t.description}</p>
                      <span className="nv-caption">Start workflow →</span>
                    </button>
                  );
                })}
            </div>
          </Card>
        ) : (
          <Card
            title="Recent workflows"
            description="Review drafts, results and canonical source references."
          >
            <Table headers={["Workflow", "Status", "Started", "Reference", ""]}>
              {runs.data
                ?.filter((r) =>
                  r.name?.toLowerCase().includes(search.toLowerCase()),
                )
                .map((r) => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.name}</strong>
                      <small>{r.run_code}</small>
                    </td>
                    <td>
                      <Badge>{r.status}</Badge>
                    </td>
                    <td>{date(r.createdAt)}</td>
                    <td>{r.input?.lead_id || "Personal workflow"}</td>
                    <td>
                      <Button onClick={() => setRun(r)}>Open</Button>
                    </td>
                  </tr>
                ))}
            </Table>
            {!runs.data?.length && (
              <Empty
                title="No workflow activity yet"
                description="Start a workflow to prepare your first controlled action."
                action={
                  <Button onClick={() => setTab("Start workflows")}>
                    Browse workflows
                  </Button>
                }
              />
            )}
          </Card>
        )}
      </DataState>
      <FormModal
        open={!!chosen}
        onClose={() => setChosen(undefined)}
        title={chosen?.name || "Prepare workflow"}
        description={chosen?.description}
        submit="Review preview"
        onSubmit={async (input) => {
          const result = await m.mutateAsync({
            path: "/runs",
            body: { key: chosen?.key, input },
          });
          setRun(result);
        }}
      >
        {chosen?.fields?.map((f) => (
          <Field
            key={f}
            label={f === "lead_id" ? "Lead" : label(f)}
            name={f}
            type={
              f === "dueDate"
                ? "datetime-local"
                : ["notes", "description"].includes(f)
                  ? "textarea"
                  : f === "amount"
                    ? "number"
                    : "text"
            }
            required
            options={
              f === "lead_id"
                ? (leads.data || []).map((l) => ({
                    value: l._id,
                    label: l.company || l.name || "Lead",
                  }))
                : undefined
            }
          />
        ))}
      </FormModal>
      <Modal
        open={!!run}
        onClose={() => setRun(undefined)}
        title={run?.name || "Action preview"}
        description={
          run?.status === "completed"
            ? "The workflow completed. Review its canonical result."
            : "Review the exact inputs before confirming execution."
        }
        wide
      >
        <div className="nv-stepper">
          {["Prepare", "Preview", "Result"].map((s, i) => (
            <div
              key={s}
              className={
                (run?.status === "completed" ? i === 2 : i === 1)
                  ? "active"
                  : ""
              }
            >
              <span>
                {run?.status === "completed" && i < 2 ? (
                  <Check size={12} />
                ) : (
                  i + 1
                )}
              </span>
              {s}
            </div>
          ))}
        </div>
        {run?.status === "completed" ? (
          <div className="nv-completion">
            <div className="nv-success-icon">
              <CheckCircle2 size={30} />
            </div>
            <h2>Work completed</h2>
            <p>Your result is saved to its canonical record.</p>
            <DetailRows
              rows={Object.entries(run.result || {}).map(([k, v]) => [
                label(k),
                String(v),
              ])}
            />
            <Button onClick={() => setRun(undefined)}>Back to workflows</Button>
          </div>
        ) : (
          <>
            <Card title="Execution preview">
              <DetailRows
                rows={Object.entries(run?.input || {}).map(([k, v]) => [
                  label(k),
                  v,
                ])}
              />
              <p className="nv-caption">{run?.impact?.summary}</p>
            </Card>
            <div className="nv-modal-footer">
              <Button
                disabled={m.isPending || run?.status !== "review"}
                onClick={async () => {
                  await m.mutateAsync({ path: `/runs/${run?._id}/cancel` });
                  setRun(undefined);
                }}
              >
                Cancel workflow
              </Button>
              <Button
                primary
                disabled={m.isPending || run?.status !== "review"}
                onClick={async () =>
                  setRun(
                    await m.mutateAsync({ path: `/runs/${run?._id}/confirm` }),
                  )
                }
              >
                {m.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Confirm & execute
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
