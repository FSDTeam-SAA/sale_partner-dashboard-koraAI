"use client";
import {
  date,
  label,
  money,
  stages,
  useSales,
  useSalesMutation,
  type Commissions,
  type Entity,
  type Overview,
  type SalesContext,
} from "@/lib/sales";
import {
  ArrowUpRight,
  Check,
  FileText,
  LayoutGrid,
  List,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  More,
  PageTitle,
  Progress,
  SearchBox,
  Select,
  Table,
  Tabs,
  Timeline,
} from "./ui";
const stageOf = (s?: string) => (s === "proposal" ? "offer" : s);
export function PipelineSummary({ leads }: { leads: Entity[] }) {
  return (
    <div className="nv-pipeline-summary">
      {["new", "qualified", "discovery", "offer", "won"].map((s) => {
        const rows = leads.filter((l) => stageOf(l.status) === s);
        return (
          <Link href={`/pipeline?stage=${s}`} className="nv-stage-tile" key={s}>
            <span>{label(s)}</span>
            <strong>{rows.length}</strong>
            <small>
              {money(rows.reduce((a, l) => a + (l.estimatedValue || 0), 0))}
            </small>
          </Link>
        );
      })}
    </div>
  );
}
export function LeadForm({
  open,
  onClose,
  lead,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  lead?: Entity;
  initial?: Entity;
}) {
  const m = useSalesMutation();
  const values = lead || initial;
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={lead ? "Edit Lead" : "Capture a new Lead"}
      description="Keep contact, commercial context and the next step together."
      onSubmit={(b) =>
        m.mutateAsync({
          path: lead ? `/leads/${lead._id}` : "/leads",
          method: lead ? "patch" : "post",
          body: {
            ...b,
            website: initial?.website,
            source: initial?.source || "manual",
            estimatedValue: Number(b.estimatedValue || 0),
          },
        })
      }
    >
      <Field
        label="Contact name"
        name="name"
        required
        defaultValue={values?.name}
      />
      <Field label="Company" name="company" defaultValue={values?.company} />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={values?.email}
      />
      <Field label="Phone" name="phone" defaultValue={values?.phone} />
      <Field
        label="Estimated value (€)"
        name="estimatedValue"
        type="number"
        defaultValue={values?.estimatedValue}
      />
      <Field
        label="Next step"
        name="nextStep"
        defaultValue={values?.nextStep}
      />
      <Field
        label="Next action"
        name="nextActionAt"
        type="datetime-local"
        defaultValue={values?.nextActionAt?.slice(0, 16)}
      />
      <Field
        label="Source / consent"
        name="consentSource"
        defaultValue={values?.consentSource}
      />
      <Field
        label="Notes"
        name="notes"
        type="textarea"
        defaultValue={values?.notes}
      />
    </FormModal>
  );
}
export function OverviewPage({
  commercial = false,
  team = false,
}: {
  commercial?: boolean;
  team?: boolean;
}) {
  const q = useSales<Overview>(team ? "/overview?team=true" : "/overview"),
    ctx = useSales<SalesContext>("/context"),
    { data: session } = useSession(),
    [create, setCreate] = useState(false);
  const d = q.data,
    leads = d?.leads || [],
    active = leads.filter(
      (l) => !["won", "lost", "disqualified"].includes(l.status || ""),
    ),
    value = active.reduce((s, l) => s + (l.estimatedValue || 0), 0),
    earned = (d?.accruals || [])
      .filter((a) => a.status === "paid")
      .reduce((s, a) => s + (a.amount || 0), 0),
    won = leads.filter((l) => l.status === "won").length;
  return (
    <>
      <PageTitle
        eyebrow={
          team
            ? "Sales Team Lead"
            : commercial
              ? "Assigned portfolio"
              : "Sales Partner"
        }
        title={
          team
            ? "Your team, in focus"
            : commercial
              ? "Sales"
              : `Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${(session?.user.name || "there").split(" ")[0]}`
        }
        description={
          team
            ? "Lead your team through clear priorities, capacity and commercial progress."
            : "Your pipeline, customers and recurring commissions in one focused workspace."
        }
        action={<Badge>{d?.scope || "Assigned portfolio"}</Badge>}
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {commercial || team ? (
          <Metrics>
            <Metric
              label={team ? "Team members" : "Open Leads"}
              value={team ? ctx.data?.members.length || 0 : active.length}
              detail="Authorized commercial scope"
            />
            <Metric
              label="Pipeline value"
              value={money(value)}
              detail="Estimated opportunity value"
            />
            <Metric
              label="Won opportunities"
              value={won}
              detail="Converted to Organizations"
            />
            <Metric
              label="Active Organizations"
              value={
                d?.organizations.filter((o) => o.status === "active").length ||
                0
              }
              detail="Customer companies"
            />
          </Metrics>
        ) : null}
        <div className="nv-grid">
          <div className="nv-stack">
            <Card
              title={
                commercial || team
                  ? "Portfolio health"
                  : "Your commercial progress"
              }
              description="Current assigned portfolio · live records"
              action={
                <Button href="/performance">
                  View performance <ArrowUpRight size={12} />
                </Button>
              }
            >
              <div className="nv-goal">
                <strong>{money(value)}</strong>
                <span className="nv-caption"> potential commercial value</span>
                <Progress
                  value={leads.length ? (won / leads.length) * 100 : 0}
                />
                <div className="nv-kpi-note">
                  <span>{active.length} active opportunities</span>
                  <span>
                    {won} won ·{" "}
                    {leads.length ? Math.round((won / leads.length) * 100) : 0}%
                    conversion
                  </span>
                </div>
              </div>
              <div className="nv-grid-equal">
                <div>
                  <strong>{d?.organizations.length || 0}</strong>
                  <p className="nv-caption">customer Organizations</p>
                </div>
                <div>
                  <strong>{money(earned)}</strong>
                  <p className="nv-caption">settled commission</p>
                </div>
              </div>
            </Card>
            <Card
              title={team ? "Team pipeline" : "My pipeline"}
              description={`${active.length} active Leads · ${money(value)} estimated value`}
              action={
                <Link className="nv-caption" href="/pipeline">
                  Open pipeline ↗
                </Link>
              }
            >
              <PipelineSummary leads={leads} />
              <div className="nv-card-heading" style={{ marginTop: 25 }}>
                <h2>Priority Leads</h2>
                <Button onClick={() => setCreate(true)}>
                  <Plus size={12} />
                  Capture Lead
                </Button>
              </div>
              {active.length ? (
                active.slice(0, 5).map((l) => (
                  <Link
                    className="nv-list-row"
                    key={l._id}
                    href={`/leads/${l._id}`}
                  >
                    <Avatar name={l.company || l.name} />
                    <div>
                      <strong>{l.company || l.name}</strong>
                      <small>
                        {label(l.status)} · {l.nextStep || "Add a next step"}
                      </small>
                    </div>
                    <span>{money(l.estimatedValue)}</span>
                    <Badge>
                      {l.nextActionAt ? date(l.nextActionAt) : "Review"}
                    </Badge>
                  </Link>
                ))
              ) : (
                <Empty
                  title="Your next opportunity starts here"
                  description="Capture a Lead to build your commercial portfolio."
                  action={
                    <Button onClick={() => setCreate(true)}>Add Lead</Button>
                  }
                />
              )}
            </Card>
          </div>
          <div className="nv-stack">
            <Card
              title="Today"
              description={`${d?.tasks.length || 0} upcoming priorities`}
              action={
                <Link href="/tasks" className="nv-caption">
                  View all ↗
                </Link>
              }
            >
              {d?.tasks.length ? (
                d.tasks.slice(0, 5).map((t) => (
                  <Link
                    href={`/tasks/${t._id}`}
                    className="nv-list-row"
                    key={t._id}
                  >
                    <span
                      style={{
                        color: t.priority === "high" ? "#e2b35d" : "#62c5aa",
                      }}
                    >
                      ●
                    </span>
                    <div>
                      <strong>{t.title}</strong>
                      <small>{label(t.status)}</small>
                    </div>
                    <small>{date(t.dueDate)}</small>
                  </Link>
                ))
              ) : (
                <Empty
                  title="A clear day ahead"
                  description="Create a follow-up or plan your next meeting."
                  action={<Button href="/tasks/new">Create task</Button>}
                />
              )}
            </Card>
            <Card
              title="Active Organizations"
              description="Your commercial relationships"
            >
              {d?.organizations.length ? (
                d.organizations.slice(0, 4).map((o) => (
                  <Link
                    href={`/organizations/${o._id}`}
                    className="nv-list-row"
                    key={o._id}
                  >
                    <span
                      style={{
                        color: o.status === "active" ? "#51bfa2" : "#d3ab58",
                      }}
                    >
                      ●
                    </span>
                    <div>
                      <strong>{o.name}</strong>
                      <small>{label(o.planSlug || o.status)}</small>
                    </div>
                    <span style={{ color: "#63bfa7" }}>
                      {money(o.mrr)} / mo
                    </span>
                  </Link>
                ))
              ) : (
                <Empty
                  title="No Organizations yet"
                  description="Won Leads link to a canonical customer company."
                />
              )}
              <Button href="/organizations">Open Organizations</Button>
              <div
                style={{
                  borderTop: "1px solid #29313d",
                  marginTop: 22,
                  paddingTop: 20,
                }}
              >
                <h3 style={{ fontSize: 12 }}>Commission status</h3>
                <div className="nv-goal">
                  <strong>{money(earned)}</strong>
                  <p className="nv-caption">Paid · verified settlement</p>
                  <Progress value={earned ? 100 : 0} />
                </div>
                <div className="nv-row-actions">
                  <Button href="/commissions">View commissions</Button>
                  <Button href="/territory">My territory</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </DataState>
      <LeadForm open={create} onClose={() => setCreate(false)} />
    </>
  );
}
export function LeadsPage({
  pipeline = false,
  generator = false,
  team = false,
}: {
  pipeline?: boolean;
  generator?: boolean;
  team?: boolean;
}) {
  const [pool, setPool] = useState(false);
  const q = useSales<Entity[]>(
      pool ? "/pool" : team ? "/leads?team=true" : "/leads",
    ),
    [term, setTerm] = useState(""),
    [stage, setStage] = useState("all"),
    [create, setCreate] = useState(false),
    params = useSearchParams(),
    [dismiss, setDismiss] = useState(false),
    m = useSalesMutation(),
    ctx = useSales<SalesContext>("/context"),
    [assign, setAssign] = useState<Entity>();
  const rows = (q.data || []).filter(
    (l) =>
      (!term ||
        `${l.name} ${l.company} ${l.email}`
          .toLowerCase()
          .includes(term.toLowerCase())) &&
      (stage === "all" || stageOf(l.status) === stage),
  );
  return (
    <>
      <PageTitle
        title={
          generator
            ? "Lead Generator"
            : team
              ? "Lead Assignments"
              : pipeline
                ? "Pipeline"
                : "Leads"
        }
        description={
          generator
            ? "Capture qualified prospects and feed your canonical Lead portfolio."
            : team
              ? "Assign work within your direct team and delegated commercial scope."
              : "Your assigned commercial opportunities, with the next step always in view."
        }
        action={
          <Button onClick={() => setCreate(true)}>
            <Plus size={14} />
            {generator ? "Capture prospect" : "Add Lead"}
          </Button>
        }
      />
      {!pipeline && !generator && !team && (
        <Tabs
          items={["My Leads", "Shared Pool"]}
          active={pool ? "Shared Pool" : "My Leads"}
          onChange={(v) => setPool(v === "Shared Pool")}
        />
      )}
      <div className="nv-toolbar">
        <SearchBox
          value={term}
          onChange={setTerm}
          placeholder="Search Leads, company or contact..."
        />
        <Select
          value={stage}
          onChange={setStage}
          options={[
            { value: "all", label: "All stages" },
            ...stages.map((s) => ({ value: s, label: label(s) })),
          ]}
        />
        <Button href={pipeline ? "/leads" : "/pipeline"}>
          {pipeline ? <List size={13} /> : <LayoutGrid size={13} />}{" "}
          {pipeline ? "List view" : "Pipeline view"}
        </Button>
      </div>
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {generator ? (
          <div className="nv-grid">
            <Card
              title="Prospect capture"
              description="Keep acquisition source, consent and contact context together."
            >
              <div className="nv-course-art">
                <Target size={50} />
              </div>
              <h2>Build your next opportunity</h2>
              <p className="nv-caption">
                Add a prospect from your authorized outreach. Existing email
                addresses are checked before a Lead is created.
              </p>
              <Button primary onClick={() => setCreate(true)}>
                <Plus size={14} />
                Capture prospect
              </Button>
              <div style={{ marginTop: 25 }}>
                {rows.slice(0, 5).map((l) => (
                  <Link
                    className="nv-list-row"
                    href={`/leads/${l._id}`}
                    key={l._id}
                  >
                    <Avatar name={l.company || l.name} />
                    <div>
                      <strong>{l.company || l.name}</strong>
                      <small>{l.email}</small>
                    </div>
                    <Badge>{l.status}</Badge>
                  </Link>
                ))}
              </div>
            </Card>
            <Card title="Your territory context">
              <TerritoryMap />
              <DetailRows
                rows={[
                  ["Visible prospects", rows.length],
                  ["Duplicate checks", "Email address"],
                  ["Record owner", "Canonical Lead"],
                  ["Next action", "Review & qualify"],
                ]}
              />
            </Card>
          </div>
        ) : pipeline ? (
          <div className="nv-board">
            {stages
              .filter((s) => !["lost", "disqualified"].includes(s))
              .map((s) => (
                <div className="nv-board-column" key={s}>
                  <header>
                    <span>{label(s)}</span>
                    <span>
                      {rows.filter((l) => stageOf(l.status) === s).length}
                    </span>
                  </header>
                  {rows
                    .filter((l) => stageOf(l.status) === s)
                    .map((l) => (
                      <Link
                        className="nv-board-card"
                        key={l._id}
                        href={`/leads/${l._id}`}
                      >
                        <strong>{l.company || l.name}</strong>
                        <p>{l.name}</p>
                        <span>{money(l.estimatedValue)}</span>
                        <small>{l.nextStep || "Next step needed"}</small>
                      </Link>
                    ))}
                </div>
              ))}
          </div>
        ) : (
          <Card>
            <Table
              headers={[
                "Lead",
                "Stage",
                "Company",
                "Value",
                "Next action",
                team ? "Assignment" : "Updated",
                "",
              ]}
            >
              {rows.map((l) => (
                <tr key={l._id}>
                  <td>
                    <Link href={`/leads/${l._id}`} className="nv-inline">
                      <Avatar name={l.name} small />
                      <div>
                        <strong>{l.name}</strong>
                        <small>{l.email}</small>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <Badge>{stageOf(l.status)}</Badge>
                  </td>
                  <td>{l.company || "—"}</td>
                  <td>{money(l.estimatedValue)}</td>
                  <td>
                    {l.nextStep || "—"}
                    <small>{date(l.nextActionAt)}</small>
                  </td>
                  <td>
                    {team
                      ? ctx.data?.members.find((x) => x.user_id === l.owner_id)
                          ?.name || "My Lead"
                      : date(l.updatedAt)}
                  </td>
                  <td>
                    {pool ? (
                      <Button
                        onClick={async () => {
                          await m.mutateAsync({ path: `/pool/${l._id}/claim` });
                          setPool(false);
                        }}
                      >
                        Claim Lead
                      </Button>
                    ) : team ? (
                      <Button onClick={() => setAssign(l)}>Assign</Button>
                    ) : (
                      <Button href={`/leads/${l._id}`}>Open</Button>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
            {!rows.length && (
              <Empty
                title="No Leads match this view"
                description="Capture a new Lead or adjust your filters."
              />
            )}
            <div className="nv-table-footer">
              <span>{rows.length} assigned Leads</span>
              <span>List · Authorized portfolio</span>
            </div>
          </Card>
        )}
      </DataState>
      <LeadForm
        open={create || (params.get("create") === "true" && !dismiss)}
        onClose={() => {
          setCreate(false);
          setDismiss(true);
        }}
      />
      <FormModal
        open={!!assign}
        onClose={() => setAssign(undefined)}
        title="Assign Lead"
        onSubmit={(b) =>
          m.mutateAsync({ path: `/leads/${assign?._id}/assign`, body: b })
        }
      >
        <Field
          label="Sales Partner"
          name="owner_id"
          required
          options={(ctx.data?.members || []).map((x) => ({
            value: x.user_id || "",
            label: x.name || "Partner",
          }))}
        />
        <Field label="Transfer reason" name="reason" type="textarea" required />
      </FormModal>
    </>
  );
}
export function LeadRecord({ id }: { id: string }) {
  const q = useSales<{ lead: Entity; offers: Entity[]; activity: Entity[] }>(
      `/leads/${id}`,
    ),
    [tab, setTab] = useState("Overview"),
    [edit, setEdit] = useState(false),
    [dialog, setDialog] = useState(""),
    [previous, setPrevious] = useState<Entity>(),
    [offerTarget, setOfferTarget] = useState<Entity>(),
    m = useSalesMutation(),
    router = useRouter(),
    [operation] = useState(() => crypto.randomUUID());
  const l = q.data?.lead,
    offers = q.data?.offers || [],
    activity = q.data?.activity || [];
  return (
    <>
      <Back href="/leads">Back to Leads</Back>
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {l && (
          <>
            <div className="nv-record-head">
              <Avatar name={l.company || l.name} />
              <div>
                <h1>{l.company || l.name}</h1>
                <p>
                  {l.name} · {l.email || "No email"} ·{" "}
                  {l.source || "Manual capture"}
                </p>
              </div>
              <Badge>{stageOf(l.status)}</Badge>
              <Button onClick={() => setEdit(true)}>Edit Lead</Button>
              <More
                items={[
                  { label: "Change stage", action: () => setDialog("stage") },
                  { label: "Add note", action: () => setDialog("note") },
                  {
                    label: "Create follow-up",
                    action: () => router.push(`/tasks/new?lead=${id}`),
                  },
                  {
                    label: "Convert to Organization",
                    action: () => setDialog("convert"),
                  },
                ]}
              />
            </div>
            <Metrics>
              <Metric
                label="Opportunity value"
                value={money(l.estimatedValue)}
                detail="Estimated commercial value"
              />
              <Metric
                label="Current stage"
                value={label(stageOf(l.status))}
                detail="Canonical Lead lifecycle"
              />
              <Metric
                label="Next action"
                value={date(l.nextActionAt)}
                detail={l.nextStep || "Add your next step"}
              />
              <Metric
                label="Last update"
                value={date(l.updatedAt)}
                detail={`${offers.length} offer versions`}
              />
            </Metrics>
            <Tabs
              items={[
                "Overview",
                "Commercial",
                "Offers",
                "Activity",
                "Notes & Kora",
              ]}
              active={tab}
              onChange={setTab}
            />
            <div className="nv-grid">
              <div className="nv-stack">
                {tab === "Overview" || tab === "Activity" ? (
                  <Card
                    title="Lead activity"
                    action={
                      <Button onClick={() => setDialog("note")}>
                        Add note
                      </Button>
                    }
                  >
                    <Timeline
                      items={activity.map((a) => ({
                        title: a.text || label(a.type),
                        description: a.actorName,
                        date: date(a.createdAt),
                      }))}
                    />
                  </Card>
                ) : tab === "Commercial" ? (
                  <Card title="Commercial terms">
                    <DetailRows
                      rows={[
                        ["Company", l.company || "—"],
                        ["Contact", l.name],
                        ["Email", l.email || "—"],
                        ["Phone", l.phone || "—"],
                        ["Estimated value", money(l.estimatedValue)],
                        ["Next step", l.nextStep || "—"],
                        ["Next action", date(l.nextActionAt)],
                      ]}
                    />
                    <div className="nv-form-actions">
                      <Button onClick={() => setEdit(true)}>
                        Update commercial fields
                      </Button>
                    </div>
                  </Card>
                ) : tab === "Offers" ? (
                  <Card
                    title="Offers"
                    description="Sent versions remain immutable; revisions preserve the history."
                    action={
                      <Button
                        onClick={() => {
                          setPrevious(undefined);
                          setDialog("offer");
                        }}
                      >
                        <Plus size={12} />
                        Create draft
                      </Button>
                    }
                  >
                    {offers.length ? (
                      offers.map((o) => (
                        <div className="nv-list-row" key={o._id}>
                          <FileText size={18} />
                          <div>
                            <strong>
                              {o.title} · v{o.version}
                            </strong>
                            <small>
                              {money(o.amount || o.price)} ·{" "}
                              {label(o.billingCycle)}
                            </small>
                          </div>
                          <Badge>{o.status}</Badge>
                          <More
                            items={[
                              ...(o.status === "draft"
                                ? [
                                    {
                                      label: "Submit for review",
                                      action: () => {
                                        m.mutate({
                                          path: `/leads/${id}/offers/${o._id}/review`,
                                        });
                                      },
                                    },
                                  ]
                                : []),
                              {
                                label: "Create revision",
                                action: () => {
                                  setPrevious(o);
                                  setDialog("offer");
                                },
                              },
                              ...(o.status === "approved"
                                ? [
                                    {
                                      label: "Send approved offer",
                                      action: () => {
                                        setOfferTarget(o);
                                        setDialog("send-offer");
                                      },
                                    },
                                  ]
                                : []),
                              ...(o.status === "sent"
                                ? [
                                    {
                                      label: "Record commercial response",
                                      action: () => {
                                        setOfferTarget(o);
                                        setDialog("offer-outcome");
                                      },
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </div>
                      ))
                    ) : (
                      <Empty
                        title="No offer yet"
                        description="Prepare a versioned draft for this opportunity."
                      />
                    )}
                  </Card>
                ) : (
                  <Card
                    title="Notes"
                    action={
                      <Button onClick={() => setDialog("note")}>
                        Add note
                      </Button>
                    }
                  >
                    <p className="nv-note">
                      {l.notes ||
                        "Keep discovery insights, needs and agreed next steps with the Lead."}
                    </p>
                    <Timeline
                      items={activity
                        .filter((a) => a.type === "note")
                        .map((a) => ({
                          title: a.text || "Note",
                          date: date(a.createdAt),
                        }))}
                    />
                  </Card>
                )}
              </div>
              <div className="nv-stack">
                <Card title="Lead context">
                  <DetailRows
                    rows={[
                      ["Stage", <Badge key="stage">{stageOf(l.status)}</Badge>],
                      ["Source", label(l.source)],
                      ["Consent source", l.consentSource || "Not recorded"],
                      ["Created", date(l.createdAt)],
                      ["Last activity", date(l.updatedAt)],
                    ]}
                  />
                  <div className="nv-form-actions">
                    <Button onClick={() => setDialog("stage")}>
                      Change stage
                    </Button>
                  </div>
                </Card>
                <Card
                  title="Work with Kora"
                  description="Prepare a discovery call or draft your next follow-up."
                >
                  <p className="nv-caption">
                    Open this Lead in your private Assistant. Review any
                    proposed change before execution.
                  </p>
                  <Button
                    href={`/assistant?prompt=${encodeURIComponent(`Help me prepare the next step for ${l.company || l.name}.`)}`}
                  >
                    <Sparkles size={13} />
                    Ask Kora
                  </Button>
                </Card>
                <Card title="Commercial handoff">
                  <p className="nv-caption">
                    Link an existing Organization or create one canonical
                    customer company when the opportunity is won.
                  </p>
                  <Button
                    onClick={() => setDialog("convert")}
                    disabled={!!l.converted_to_org_id}
                  >
                    {l.converted_to_org_id
                      ? "Already converted"
                      : "Convert & hand off"}
                  </Button>
                </Card>
              </div>
            </div>
            <LeadForm open={edit} onClose={() => setEdit(false)} lead={l} />
            <FormModal
              open={dialog === "send-offer"}
              onClose={() => setDialog("")}
              title="Send offer preview"
              description={`Review version ${offerTarget?.version}: ${offerTarget?.title} · ${money(offerTarget?.amount)}. This sends an external email from your connected work account.`}
              submit="Confirm & send approved offer"
              onSubmit={(b) =>
                m.mutateAsync({
                  path: `/leads/${id}/offers/${offerTarget?._id}/send`,
                  body: {
                    ...b,
                    operationId: `offer-send-${offerTarget?._id}-${offerTarget?.version}`,
                  },
                })
              }
            >
              <Field
                label="Recipient"
                name="recipient"
                defaultValue={l.email}
                type="email"
                required
              />
              <Field
                label="Subject"
                name="subject"
                defaultValue={offerTarget?.title}
                required
              />
              <Field
                label="Message"
                name="body"
                type="textarea"
                required
                defaultValue={`Hello ${l.name},\n\nPlease review our approved ${offerTarget?.title}: ${money(offerTarget?.amount)} (${offerTarget?.billingCycle || "monthly"}).\n\nPlease let us know if you have any questions about the commercial scope.\n\nKind regards`}
              />
            </FormModal>
            <FormModal
              open={dialog === "offer-outcome"}
              onClose={() => setDialog("")}
              title="Record commercial response"
              description="Record the customer's stated response. Contract execution and onboarding remain separate milestones."
              onSubmit={(b) =>
                m.mutateAsync({
                  path: `/leads/${id}/offers/${offerTarget?._id}/outcome`,
                  body: b,
                })
              }
            >
              <Field
                label="Outcome"
                name="status"
                required
                options={["accepted", "declined", "expired"].map((v) => ({
                  value: v,
                  label: label(v),
                }))}
              />
              <Field
                label="Source & evidence"
                name="evidence"
                type="textarea"
                required
              />
            </FormModal>
            <FormModal
              open={dialog === "note"}
              onClose={() => setDialog("")}
              title="Add a Lead note"
              onSubmit={(b) =>
                m.mutateAsync({ path: `/leads/${id}/notes`, body: b })
              }
            >
              <Field label="Note" name="text" type="textarea" required />
            </FormModal>
            <FormModal
              open={dialog === "stage"}
              onClose={() => setDialog("")}
              title="Change Lead stage"
              description="Record the commercial outcome. Organization conversion handles Won."
              onSubmit={(b) =>
                m.mutateAsync({
                  path: `/leads/${id}`,
                  method: "patch",
                  body: b,
                })
              }
            >
              <Field
                label="Stage"
                name="status"
                defaultValue={stageOf(l.status)}
                options={stages
                  .filter((s) => s !== "won")
                  .map((s) => ({ value: s, label: label(s) }))}
              />
              <Field label="Reason" name="reason" type="textarea" />
            </FormModal>
            <FormModal
              open={dialog === "offer"}
              onClose={() => setDialog("")}
              title={previous ? "Create offer revision" : "Create offer draft"}
              onSubmit={(b) =>
                m.mutateAsync({
                  path: `/leads/${id}/offers`,
                  body: {
                    ...b,
                    amount: Number(b.amount),
                    discountPct: Number(b.discountPct || 0),
                    previous_id: previous?._id,
                  },
                })
              }
            >
              <Field
                label="Offer title"
                name="title"
                required
                defaultValue={previous?.title}
              />
              <Field
                label="Amount (€)"
                name="amount"
                required
                type="number"
                defaultValue={previous?.amount}
              />
              <Field
                label="Discount (%)"
                name="discountPct"
                type="number"
                defaultValue={previous?.discountPct || 0}
              />
              <Field
                label="Billing cycle"
                name="billingCycle"
                defaultValue="monthly"
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "annual", label: "Annual" },
                ]}
              />
              {previous && (
                <Field
                  label="Revision reason"
                  name="revisionReason"
                  type="textarea"
                  required
                />
              )}
            </FormModal>
            <Modal
              open={dialog === "convert"}
              onClose={() => setDialog("")}
              title="Convert to Organization"
              description="This marks the Lead won and creates or links a customer company while preserving the commercial history."
            >
              <DetailRows
                rows={[
                  ["Lead", l.company || l.name],
                  ["Contact", l.email || "—"],
                  ["Current stage", label(l.status)],
                ]}
              />
              <p className="nv-caption">
                Contract execution, onboarding and commission settlement remain
                separate milestones.
              </p>
              <div className="nv-modal-footer">
                <Button onClick={() => setDialog("")}>Cancel</Button>
                <Button
                  primary
                  disabled={m.isPending}
                  onClick={async () => {
                    const result = await m.mutateAsync({
                      path: `/leads/${id}/convert`,
                      body: { operationId: operation },
                    });
                    router.push(
                      `/organizations/${String((result as unknown as { organizationId: string }).organizationId)}`,
                    );
                  }}
                >
                  Confirm conversion
                </Button>
              </div>
            </Modal>
          </>
        )}
      </DataState>
    </>
  );
}
export function OrganizationsPage({ id }: { id?: string }) {
  const q = useSales<
      | Entity[]
      | {
          organization: Entity;
          leads: Entity[];
          contracts: Entity[];
          accruals: Entity[];
        }
    >(id ? `/organizations/${id}` : "/organizations"),
    [tab, setTab] = useState("Overview"),
    [term, setTerm] = useState("");
  const detail = q.data && !Array.isArray(q.data) ? q.data : undefined,
    rows = Array.isArray(q.data) ? q.data : [],
    org = detail?.organization;
  return (
    <>
      {id ? (
        <Back href="/organizations">Back to Organizations</Back>
      ) : (
        <PageTitle
          title="Organizations"
          description="Your NOVYA customer companies and commercial relationships."
        />
      )}
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {org ? (
          <>
            <div className="nv-record-head">
              <Avatar name={org.name} />
              <div>
                <h1>{org.name}</h1>
                <p>
                  {org.org_code} · Customer since {date(org.createdAt)}
                </p>
              </div>
              <Badge>{org.status}</Badge>
              <Button href="/learn/help/requests">Contact support</Button>
            </div>
            <Tabs
              items={[
                "Overview",
                "Subscription & Commission",
                "Onboarding",
                "Support & Activity",
              ]}
              active={tab}
              onChange={setTab}
            />
            <Metrics>
              <Metric
                label="Current plan"
                value={label(org.planSlug || "Pending")}
                detail="Commercial subscription view"
              />
              <Metric
                label="Monthly recurring revenue"
                value={money(org.mrr)}
                detail={label(org.billingCycle)}
              />
              <Metric
                label="Onboarding"
                value={`${org.onboarding?.progress || 0}%`}
                detail="Canonical handoff status"
              />
              <Metric
                label="Contracts"
                value={detail?.contracts.length || 0}
                detail="Commercial milestones"
              />
            </Metrics>
            <div className="nv-grid">
              <Card
                title={
                  tab === "Onboarding"
                    ? "Onboarding status"
                    : tab === "Subscription & Commission"
                      ? "Subscription & commission"
                      : tab === "Support & Activity"
                        ? "Commercial activity"
                        : "Recent commercial history"
                }
              >
                {tab === "Onboarding" ? (
                  <>
                    <Progress
                      value={org.onboarding?.progress || 0}
                      tone="green"
                    />
                    {org.onboarding?.tasks?.length ? (
                      org.onboarding.tasks.map((t) => (
                        <div className="nv-list-row" key={t.key}>
                          <Check size={14} />
                          <div>
                            <strong>{t.label}</strong>
                          </div>
                          <Badge>{t.done ? "Completed" : "Pending"}</Badge>
                        </div>
                      ))
                    ) : (
                      <Empty
                        title="Handoff is being prepared"
                        description="The accountable onboarding team owns these milestones."
                      />
                    )}
                  </>
                ) : tab === "Subscription & Commission" ? (
                  <>
                    <DetailRows
                      rows={[
                        ["Plan", label(org.planSlug || "Pending")],
                        ["Billing cycle", label(org.billingCycle)],
                        ["Renewal", date(org.renewalDate)],
                        ["Monthly value", money(org.mrr)],
                      ]}
                    />
                    {detail?.accruals.map((a) => (
                      <div className="nv-list-row" key={a._id}>
                        <div>
                          <strong>{money(a.amount)}</strong>
                          <small>Rule version {a.ruleVersion || "—"}</small>
                        </div>
                        <Badge>{a.status}</Badge>
                      </div>
                    ))}
                  </>
                ) : (
                  <Timeline
                    items={[
                      ...(detail?.leads || []).map((l) => ({
                        title: `Originating Lead · ${l.company || l.name}`,
                        date: date(l.updatedAt),
                        href: `/leads/${l._id}`,
                      })),
                      ...(detail?.contracts || []).map((c) => ({
                        title: c.title || "Contract",
                        description: label(c.status),
                        date: date(c.createdAt),
                      })),
                    ]}
                  />
                )}
              </Card>
              <div className="nv-stack">
                <Card title="Organization details">
                  <DetailRows
                    rows={[
                      ["Company", org.name],
                      ["Status", <Badge key="status">{org.status}</Badge>],
                      ["Industry", org.industry || "—"],
                      ["Primary contact", org.contacts?.[0]?.name || "—"],
                      ["Email", org.contacts?.[0]?.email || "—"],
                    ]}
                  />
                </Card>
                <Card title="Authorized commercial view">
                  <p className="nv-caption">
                    Company billing, platform configuration and tenant
                    operations are managed by their accountable owners.
                  </p>
                  <Button href="/commissions">Commission evidence</Button>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="nv-toolbar">
              <SearchBox
                value={term}
                onChange={setTerm}
                placeholder="Search Organizations..."
              />
            </div>
            <Metrics>
              <Metric label="Organizations" value={rows.length} />
              <Metric
                label="Active subscriptions"
                value={rows.filter((o) => o.status === "active").length}
              />
              <Metric
                label="Monthly recurring revenue"
                value={money(rows.reduce((s, o) => s + (o.mrr || 0), 0))}
              />
              <Metric
                label="In onboarding"
                value={rows.filter((o) => o.status === "onboarding").length}
              />
            </Metrics>
            <Card title="Customer portfolio">
              <Table
                headers={[
                  "Organization",
                  "Plan",
                  "MRR",
                  "Onboarding",
                  "Status",
                  "",
                ]}
              >
                {rows
                  .filter((o) =>
                    o.name?.toLowerCase().includes(term.toLowerCase()),
                  )
                  .map((o) => (
                    <tr key={o._id}>
                      <td>
                        <Link
                          className="nv-inline"
                          href={`/organizations/${o._id}`}
                        >
                          <Avatar name={o.name} small />
                          <strong>{o.name}</strong>
                        </Link>
                      </td>
                      <td>{label(o.planSlug || "Pending")}</td>
                      <td>{money(o.mrr)}</td>
                      <td>
                        <Progress value={o.onboarding?.progress || 0} />
                        <small>{o.onboarding?.progress || 0}%</small>
                      </td>
                      <td>
                        <Badge>{o.status}</Badge>
                      </td>
                      <td>
                        <Button href={`/organizations/${o._id}`}>Open</Button>
                      </td>
                    </tr>
                  ))}
              </Table>
              {!rows.length && (
                <Empty
                  title="Your customer portfolio is ready to grow"
                  description="Qualify and convert an assigned Lead to begin the commercial handoff."
                  action={<Button href="/leads">Open Leads</Button>}
                />
              )}
            </Card>
          </>
        )}
      </DataState>
    </>
  );
}
export function TerritoryMap() {
  return (
    <svg
      className="nv-territory-map"
      viewBox="0 0 500 350"
      role="img"
      aria-label="Schematic territory coverage"
    >
      <defs>
        <radialGradient id="territory-fill">
          <stop stopColor="#354348" />
          <stop offset="1" stopColor="#19252b" />
        </radialGradient>
      </defs>
      <path
        d="M90 95 150 62 205 58 260 78 320 65 388 99 402 146 370 183 385 226 352 269 290 295 238 280 193 304 140 278 108 240 118 195 82 160Z"
        fill="url(#territory-fill)"
        stroke="#627078"
        strokeWidth="1.3"
      />
      <path
        d="M110 136Q240 178 382 145M127 226Q235 188 376 234M219 66Q244 176 205 283"
        fill="none"
        stroke="#45525b"
        strokeWidth="1"
      />
      {[
        [155, 117],
        [265, 158],
        [334, 218],
        [178, 251],
        [303, 110],
      ].map(([x, y], i) => (
        <g key={x}>
          <circle
            cx={x}
            cy={y}
            r={i === 1 ? 7 : 3}
            fill={i === 1 ? "#c9d4df" : "#8ca4b1"}
          />
          {i === 1 && (
            <circle cx={x} cy={y} r="16" fill="none" stroke="#677f8c" />
          )}
        </g>
      ))}
      <text x="250" y="332" textAnchor="middle" fill="#74899b" fontSize="9">
        SCHEMATIC COVERAGE · SEE ASSIGNED POSTAL AREAS
      </text>
    </svg>
  );
}
export function AnalyticsPage({
  kind,
  team = false,
}: {
  kind: string;
  team?: boolean;
}) {
  const q = useSales<Overview>(team ? "/overview?team=true" : "/overview"),
    c = useSales<Commissions>(team ? "/commissions?team=true" : "/commissions"),
    [tab, setTab] = useState("Overview"),
    [selected, setSelected] = useState<Entity>(),
    [dispute, setDispute] = useState(false),
    m = useSalesMutation();
  const d = q.data,
    leads = d?.leads || [],
    territories = d?.territories || [],
    territory = territories[0],
    rows = c.data?.accruals || [],
    value = leads.reduce((s, l) => s + (l.estimatedValue || 0), 0);
  const chart = stages.slice(0, 8).map((s) => ({
    stage: label(s),
    value: leads
      .filter((l) => stageOf(l.status) === s)
      .reduce((n, l) => n + (l.estimatedValue || 0), 0),
    count: leads.filter((l) => stageOf(l.status) === s).length,
  }));
  return (
    <>
      <PageTitle
        title={
          kind === "territory"
            ? "My Territory"
            : kind === "commissions"
              ? "Commissions"
              : kind === "activity"
                ? "Sales Activity"
                : "Performance"
        }
        description="Understand your authorized portfolio through source-linked commercial evidence."
        action={
          kind === "commissions" ? (
            <Button onClick={() => setDispute(true)}>Request review</Button>
          ) : (
            <Button href="/assistant">
              <Sparkles size={13} />
              Ask Kora
            </Button>
          )
        }
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {kind === "territory" ? (
          <>
            <Card>
              <div className="nv-record-head">
                <div>
                  <h1>{territory?.name || "Assigned coverage"}</h1>
                  <p>
                    {territory?.region ||
                      "Territory allocation is managed by your Team Lead."}
                  </p>
                </div>
                <Badge>{territory?.status || "Unassigned"}</Badge>
              </div>
            </Card>
            <div style={{ height: 18 }} />
            <Tabs
              items={[
                "Overview",
                "Coverage",
                "Capacity",
                "Lead Activity",
                "Won Organizations",
              ]}
              active={tab}
              onChange={setTab}
            />
            <div className="nv-grid">
              <Card
                title={
                  tab === "Lead Activity"
                    ? "Territory activity"
                    : tab === "Won Organizations"
                      ? "Won Organizations"
                      : tab === "Capacity"
                        ? "Lead capacity"
                        : "Coverage map"
                }
              >
                {tab === "Lead Activity" ? (
                  <Timeline
                    items={(d?.activity || []).map((a) => ({
                      title: a.text || "Activity",
                      date: date(a.createdAt),
                    }))}
                  />
                ) : tab === "Won Organizations" ? (
                  d?.organizations.length ? (
                    d.organizations.map((o) => (
                      <Link
                        href={`/organizations/${o._id}`}
                        className="nv-list-row"
                        key={o._id}
                      >
                        <Avatar name={o.name} />
                        <div>
                          <strong>{o.name}</strong>
                          <small>{label(o.status)}</small>
                        </div>
                        <span>{money(o.mrr)} / month</span>
                      </Link>
                    ))
                  ) : (
                    <Empty title="No won Organizations yet" />
                  )
                ) : tab === "Capacity" ? (
                  <>
                    {chart.map((s) => (
                      <div key={s.stage} style={{ padding: "10px 0" }}>
                        <div className="nv-kpi-note">
                          <span>{s.stage}</span>
                          <span>{s.count}</span>
                        </div>
                        <Progress
                          value={
                            leads.length ? (s.count / leads.length) * 100 : 0
                          }
                        />
                      </div>
                    ))}
                  </>
                ) : (
                  <TerritoryMap />
                )}
              </Card>
              <Card title="Territory operating rules">
                <DetailRows
                  rows={[
                    ["Assigned territory", territory?.name || "—"],
                    ["Region", territory?.region || "—"],
                    ["Industry", territory?.industry || "Assigned segments"],
                    ["Capacity", territory?.capacity || "—"],
                    ["Postal areas", territory?.zipCodes?.join(", ") || "—"],
                    ["Assignment", "Effective commercial responsibility"],
                  ]}
                />
                <p className="nv-caption">
                  Territory controls eligibility. Record assignments determine
                  which opportunities you can open.
                </p>
                <Button href="/lead-generator">Open Lead Generator</Button>
              </Card>
            </div>
          </>
        ) : kind === "activity" ? (
          <Card title="Commercial timeline">
            <Timeline
              items={(d?.activity || []).map((a) => ({
                title: a.text || label(a.type),
                description: a.actorName,
                date: date(a.createdAt),
                href: a.lead_id ? `/leads/${a.lead_id}` : undefined,
              }))}
            />
          </Card>
        ) : kind === "commissions" ? (
          <>
            <Metrics>
              <Metric
                label="Estimated"
                value={money(
                  rows
                    .filter((r) => r.status === "estimated")
                    .reduce((s, r) => s + (r.amount || 0), 0),
                )}
                detail="Projection · subject to eligibility"
              />
              <Metric
                label="Approved"
                value={money(
                  rows
                    .filter((r) => r.status === "approved")
                    .reduce((s, r) => s + (r.amount || 0), 0),
                )}
              />
              <Metric
                label="Scheduled"
                value={money(
                  (c.data?.payouts || [])
                    .filter((p) => p.status === "scheduled")
                    .reduce((s, p) => s + (p.net || 0), 0),
                )}
              />
              <Metric
                label="Paid"
                value={money(
                  (c.data?.legacy || [])
                    .filter((e) => e.status === "paid")
                    .reduce((s, e) => s + (e.commission || 0), 0) +
                    rows
                      .filter((a) => a.status === "paid")
                      .reduce((s, a) => s + (a.amount || 0), 0),
                )}
              />
            </Metrics>
            <Tabs
              items={[
                "Accruals",
                "Payouts",
                "Rule explanation",
                "Historical earnings",
              ]}
              active={tab === "Overview" ? "Accruals" : tab}
              onChange={setTab}
            />
            <Card
              title={
                tab === "Rule explanation"
                  ? "Your commission rules"
                  : "Commission evidence"
              }
            >
              {tab === "Rule explanation" ? (
                c.data?.rules.length ? (
                  c.data.rules.map((r) => (
                    <div key={r._id}>
                      <h3>
                        {r.name} · v{r.version}
                      </h3>
                      <DetailRows
                        rows={[
                          ["Basis", label(String(r.basis || "—"))],
                          ["Settlement", label(r.settlement)],
                          ["Flat rate", `${r.flatRate || 0}%`],
                          ["Eligibility", r.eligibility?.map(label).join(", ")],
                        ]}
                      />
                    </div>
                  ))
                ) : (
                  <Empty
                    title="No assigned rule"
                    description="Your Admin manages versioned commission rules."
                  />
                )
              ) : (
                <Table
                  headers={[
                    "Source",
                    "Period / version",
                    "Amount",
                    "Status",
                    "",
                  ]}
                >
                  {(tab === "Payouts"
                    ? c.data?.payouts
                    : tab === "Historical earnings"
                      ? c.data?.legacy
                      : rows
                  )?.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <strong>
                          {typeof r.org_id === "object"
                            ? r.org_id.name
                            : r.payout_code ||
                              r.reference ||
                              "Commission entry"}
                        </strong>
                        <small>{date(r.createdAt)}</small>
                      </td>
                      <td>{r.period || `Version ${r.ruleVersion || "—"}`}</td>
                      <td>{money(r.amount || r.net || r.commission)}</td>
                      <td>
                        <Badge>{r.status}</Badge>
                      </td>
                      <td>
                        <Button onClick={() => setSelected(r)}>Evidence</Button>
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
              {!rows.length &&
                ![
                  "Rule explanation",
                  "Payouts",
                  "Historical earnings",
                ].includes(tab) && (
                  <Empty
                    title="No commission accruals yet"
                    description="Entries appear when verified commercial events meet the assigned rule."
                  />
                )}
            </Card>
          </>
        ) : (
          <>
            <Metrics>
              <Metric
                label="Portfolio value"
                value={money(value)}
                detail="Estimated · current assigned scope"
              />
              <Metric
                label="Open opportunities"
                value={
                  leads.filter((l) => !["won", "lost"].includes(l.status || ""))
                    .length
                }
              />
              <Metric
                label="Won"
                value={leads.filter((l) => l.status === "won").length}
              />
              <Metric
                label="Conversion"
                value={`${leads.length ? Math.round((leads.filter((l) => l.status === "won").length / leads.length) * 100) : 0}%`}
              />
            </Metrics>
            <Card
              title="Pipeline value by stage"
              description="Current commercial distribution · no time-series values inferred"
            >
              <div className="nv-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart}>
                    <defs>
                      <linearGradient
                        id="salesChart"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0"
                          stopColor="#98a9df"
                          stopOpacity={0.35}
                        />
                        <stop offset="1" stopColor="#98a9df" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#273141" vertical={false} />
                    <XAxis
                      dataKey="stage"
                      stroke="#75839a"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#75839a"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#192332",
                        borderColor: "#41516a",
                        fontSize: 11,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#b4c3ee"
                      fill="url(#salesChart)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <div style={{ height: 18 }} />
            <div className="nv-grid-equal">
              <Card title="Stage health">
                {chart.map((s) => (
                  <Link
                    href={`/pipeline?stage=${s.stage.toLowerCase()}`}
                    key={s.stage}
                    className="nv-list-row"
                  >
                    <div>
                      <strong>{s.stage}</strong>
                      <Progress
                        value={
                          leads.length ? (s.count / leads.length) * 100 : 0
                        }
                      />
                    </div>
                    <span>{s.count} Leads</span>
                  </Link>
                ))}
              </Card>
              <Card title="Attention needed">
                <DetailRows
                  rows={[
                    [
                      "Missing next step",
                      leads.filter((l) => !l.nextStep).length,
                    ],
                    [
                      "Overdue follow-ups",
                      leads.filter(
                        (l) =>
                          l.nextActionAt &&
                          new Date(l.nextActionAt) < new Date(),
                      ).length,
                    ],
                    ["Open Tasks", d?.tasks.length || 0],
                    [
                      "Last refreshed",
                      d?.refreshedAt
                        ? new Date(d.refreshedAt).toLocaleTimeString()
                        : "?",
                    ],
                  ]}
                />
                <Button href="/tasks">Review priorities</Button>
              </Card>
            </div>
          </>
        )}
      </DataState>
      <Modal
        open={!!selected}
        onClose={() => setSelected(undefined)}
        title="Commission evidence"
      >
        <DetailRows
          rows={[
            ["Status", <Badge key="status">{selected?.status}</Badge>],
            [
              "Amount",
              money(selected?.amount || selected?.net || selected?.commission),
            ],
            ["Rule version", selected?.ruleVersion || "Historical entry"],
            ["Basis", selected?.basis ?? "—"],
            ["Rate", selected?.rate !== undefined ? `${selected.rate}%` : "—"],
            ["Source", selected?._id],
            ["Paid / released", date(selected?.paidAt || selected?.releasedAt)],
          ]}
        />
      </Modal>
      <FormModal
        open={dispute}
        onClose={() => setDispute(false)}
        title="Request commission review"
        onSubmit={(b) =>
          m.mutateAsync({
            path: "/requests",
            body: { ...b, kind: "commission" },
          })
        }
      >
        <Field label="Title" name="title" required />
        <Field label="Entry reference" name="reference" required />
        <Field
          label="Review details"
          name="description"
          type="textarea"
          required
        />
      </FormModal>
    </>
  );
}
