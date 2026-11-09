"use client";
import {
  date,
  label,
  money,
  useSales,
  useSalesMutation,
  type Commissions,
  type Entity,
  type Overview,
  type SalesContext,
} from "@/lib/sales";
import { ArrowRight, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  AnalyticsPage,
  LeadsPage,
  OverviewPage,
  TerritoryMap,
} from "./sales-pages";
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
  PageTitle,
  Progress,
  SearchBox,
  Table,
  Tabs,
  Timeline,
} from "./ui";
import { TasksPage } from "./work-pages";
export function TeamPage({
  section = "",
  id,
}: {
  section?: string;
  id?: string;
  mode?: string;
}) {
  const ctx = useSales<SalesContext>("/context"),
    overview = useSales<Overview>("/overview?team=true"),
    commission = useSales<Commissions>("/commissions?team=true"),
    requests = useSales<Entity[]>("/requests"),
    m = useSalesMutation(),
    [tab, setTab] = useState("Overview"),
    [term, setTerm] = useState(""),
    [dialog, setDialog] = useState("");
  const members = ctx.data?.members || [],
    member = members.find((x) => x._id === id),
    leads = overview.data?.leads || [],
    territories = overview.data?.territories || [],
    territory = territories.find((t) => t._id === id),
    partnerLeads = leads.filter((l) => l.owner_id === member?.user_id),
    partnerTerritories = territories.filter(
      (t) => t.assigned_partner_id === member?.user_id,
    ),
    partnerCommission = (commission.data?.accruals || []).filter(
      (a) => a.partner_id === member?.user_id,
    );
  if (section === "tasks") return <TasksPage team id={id} />;
  if (section === "assignments") return <LeadsPage team />;
  if (section === "pipeline") return <LeadsPage pipeline team />;
  if (section === "commissions")
    return <AnalyticsPage kind="commissions" team />;
  if (!section) return <OverviewPage team />;
  return (
    <>
      {id && <Back href={`/team/${section}`}>Back to {label(section)}</Back>}
      <PageTitle
        title={
          member
            ? member.name || "Sales Partner"
            : territory
              ? territory.name || "Territory"
              : section === "partners"
                ? "Sales Partners"
                : section === "territories"
                  ? "Territory Coverage"
                  : section === "preferences"
                    ? "Team Preferences"
                    : "Performance & Coaching"
        }
        description="Direct team visibility and operational leadership within your delegated scope."
        action={
          section === "territories" ? (
            <Button onClick={() => setDialog("territory")}>
              <Plus size={13} />
              Create sub-territory
            </Button>
          ) : (
            <Button onClick={() => setDialog("coaching")}>
              <Plus size={13} />
              Coaching note
            </Button>
          )
        }
      />
      <DataState
        pending={ctx.isPending || overview.isPending}
        error={ctx.error || overview.error}
        retry={() => {
          ctx.refetch();
          overview.refetch();
        }}
      >
        {member ? (
          <>
            <div className="nv-record-head">
              <Avatar name={member.name} />
              <div>
                <h1>{member.name}</h1>
                <p>
                  {member.email} · {member.title || "Sales Partner"}
                </p>
              </div>
              <Badge>Active direct report</Badge>
            </div>
            <Tabs
              items={[
                "Overview",
                "Assigned Leads",
                "Territories",
                "Performance & Coaching",
                "Commission Overview",
              ]}
              active={tab}
              onChange={setTab}
            />
            <Metrics>
              <Metric
                label="Active Leads"
                value={
                  partnerLeads.filter(
                    (l) =>
                      !["won", "lost", "disqualified"].includes(l.status || ""),
                  ).length
                }
              />
              <Metric
                label="Won opportunities"
                value={partnerLeads.filter((l) => l.status === "won").length}
              />
              <Metric
                label="Pipeline value"
                value={money(
                  partnerLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0),
                )}
              />
              <Metric
                label="Assigned territories"
                value={partnerTerritories.length}
              />
            </Metrics>
            <div className="nv-grid">
              <Card
                title={
                  tab === "Assigned Leads"
                    ? "Assigned Lead portfolio"
                    : tab === "Territories"
                      ? "Assigned territories"
                      : tab === "Commission Overview"
                        ? "Commission evidence"
                        : tab === "Performance & Coaching"
                          ? "Performance & Coaching"
                          : "Partner performance & coaching"
                }
              >
                {tab === "Territories" ? (
                  partnerTerritories.map((t) => (
                    <Link href={`/team/territories/${t._id}`} key={t._id}>
                      <TerritoryMap />
                      <div className="nv-list-row">
                        <MapPin size={14} />
                        <div>
                          <strong>{t.name}</strong>
                          <small>
                            {t.region} · {t.zipCodes?.length || 0} postal areas
                          </small>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : tab === "Commission Overview" ? (
                  <>
                    {partnerCommission.map((a) => (
                      <div className="nv-list-row" key={a._id}>
                        <div>
                          <strong>{money(a.amount)}</strong>
                          <small>Rule v{a.ruleVersion}</small>
                        </div>
                        <Badge>{a.status}</Badge>
                      </div>
                    ))}
                    {!partnerCommission.length && (
                      <Empty title="No commission evidence yet" />
                    )}
                  </>
                ) : tab === "Performance & Coaching" ? (
                  <>
                    <DetailRows
                      rows={[
                        [
                          "Wins",
                          partnerLeads.filter((l) => l.status === "won").length,
                        ],
                        [
                          "Missing next step",
                          partnerLeads.filter((l) => !l.nextStep).length,
                        ],
                        [
                          "Overdue follow-up",
                          partnerLeads.filter(
                            (l) =>
                              l.nextActionAt &&
                              new Date(l.nextActionAt) < new Date(),
                          ).length,
                        ],
                      ]}
                    />
                    <Timeline
                      items={(requests.data || [])
                        .filter(
                          (r) =>
                            r.kind === "coaching" && r.reference === member._id,
                        )
                        .map((r) => ({
                          title: r.title || "Coaching note",
                          description: r.description,
                          date: date(r.createdAt),
                        }))}
                    />
                    <Button onClick={() => setDialog("coaching")}>
                      Create coaching note
                    </Button>
                  </>
                ) : (
                  <Table
                    headers={["Lead", "Stage", "Value", "Next action", ""]}
                  >
                    {partnerLeads.map((l) => (
                      <tr key={l._id}>
                        <td>
                          <strong>{l.company || l.name}</strong>
                        </td>
                        <td>
                          <Badge>{l.status}</Badge>
                        </td>
                        <td>{money(l.estimatedValue)}</td>
                        <td>{l.nextStep || "Missing next step"}</td>
                        <td>
                          <Button href={`/leads/${l._id}`}>Open</Button>
                        </td>
                      </tr>
                    ))}
                  </Table>
                )}
                {!partnerLeads.length && tab === "Assigned Leads" && (
                  <Empty title="No assigned Leads" />
                )}
              </Card>
              <div className="nv-stack">
                <Card title="Partner operating profile">
                  <DetailRows
                    rows={[
                      ["Name", member.name],
                      ["Work email", member.email],
                      ["Role", "Sales Partner"],
                      ["Team relationship", "Direct report"],
                      ["Private conversations", "Not visible"],
                      ["Personal Brain", "Not visible"],
                    ]}
                  />
                </Card>
                <Card title="Coaching actions">
                  <p className="nv-caption">
                    Use commercial evidence to remove blockers and agree on the
                    next accountable action.
                  </p>
                  <Button href="/team/tasks/new">Create & Assign task</Button>
                </Card>
              </div>
            </div>
          </>
        ) : section === "territories" ? (
          <>
            {territory ? (
              <>
                <Card>
                  <DetailRows
                    rows={[
                      [
                        "Assigned partner",
                        members.find(
                          (m) => m.user_id === territory.assigned_partner_id,
                        )?.name || "—",
                      ],
                      ["Industry", territory.industry || "Assigned segments"],
                      ["Capacity", territory.capacity],
                      [
                        "Parent territory",
                        territory.parent_id || "Delegated parent",
                      ],
                    ]}
                  />
                </Card>
                <div style={{ height: 18 }} />
                <Tabs
                  items={[
                    "Overview",
                    "Coverage",
                    "Assignment",
                    "Routing Rules",
                    "Leads",
                  ]}
                  active={tab}
                  onChange={setTab}
                />
                <div className="nv-grid">
                  <Card
                    title={tab === "Leads" ? "Assigned Leads" : "Coverage map"}
                  >
                    {tab === "Leads" ? (
                      leads
                        .filter(
                          (l) =>
                            (l as Entity & { territory_id?: string })
                              .territory_id === territory._id,
                        )
                        .map((l) => (
                          <Link
                            key={l._id}
                            className="nv-list-row"
                            href={`/leads/${l._id}`}
                          >
                            <div>
                              <strong>{l.company || l.name}</strong>
                            </div>
                            <Badge>{l.status}</Badge>
                          </Link>
                        ))
                    ) : (
                      <TerritoryMap />
                    )}
                  </Card>
                  <Card title="Territory operating rules">
                    <DetailRows
                      rows={[
                        ["Postal areas", territory.zipCodes?.join(", ") || "—"],
                        ["Region", territory.region],
                        ["Routing", "Delegated parent boundary"],
                        ["Assignment", "One effective owner"],
                        ["Transfers", "Reason and approval by scope"],
                      ]}
                    />
                  </Card>
                </div>
              </>
            ) : (
              <>
                <Metrics>
                  <Metric label="Territories" value={territories.length} />
                  <Metric
                    label="Postal areas"
                    value={territories.reduce(
                      (s, t) => s + (t.zipCodes?.length || 0),
                      0,
                    )}
                  />
                  <Metric
                    label="Assigned areas"
                    value={
                      territories.filter((t) => t.assigned_partner_id).length
                    }
                  />
                  <Metric label="Direct partners" value={members.length} />
                </Metrics>
                <div className="nv-grid">
                  <Card title="Coverage">
                    <TerritoryMap />
                    {territories.map((t) => (
                      <Link
                        key={t._id}
                        className="nv-list-row"
                        href={`/team/territories/${t._id}`}
                      >
                        <MapPin size={15} />
                        <div>
                          <strong>{t.name}</strong>
                          <small>
                            {t.region} · {t.zipCodes?.length || 0} postal areas
                          </small>
                        </div>
                        <Badge>{t.status}</Badge>
                        <ArrowRight size={13} />
                      </Link>
                    ))}
                  </Card>
                  <Card title="Coverage rules">
                    <p className="nv-caption">
                      Create sub-territories only inside the parent areas
                      delegated to you. Overlap and direct-team assignment
                      checks run on the server.
                    </p>
                    <DetailRows
                      rows={[
                        ["Boundary", "Delegated parent"],
                        ["Overlap", "Validated before creation"],
                        ["Global routing", "Admin-owned"],
                        ["Attribution history", "Retained after transfer"],
                      ]}
                    />
                  </Card>
                </div>
              </>
            )}
          </>
        ) : section === "preferences" ? (
          <>
            <Metrics>
              <Metric label="Team" value={members.length} />
              <Metric label="Visibility" value="Direct team" />
              <Metric label="Default" value="My Tasks" />
              <Metric label="Policy" value="Inherited" />
            </Metrics>
            <div className="nv-grid">
              <Card title="Team work preferences">
                <p className="nv-caption">
                  Workload defaults and personal coordination preferences live
                  within effective platform policy.
                </p>
                {members.map((member) => (
                  <div className="nv-list-row" key={member._id}>
                    <Avatar name={member.name} small />
                    <div>
                      <strong>{member.name}</strong>
                      <small>{member.title || "Sales Partner"}</small>
                    </div>
                    <Badge>Assigned team</Badge>
                  </div>
                ))}
                <div className="nv-form-actions">
                  <Button href="/settings/preferences">
                    My coordination preferences
                  </Button>
                </div>
              </Card>
              <Card title="Inherited guardrails">
                <DetailRows
                  rows={[
                    ["Manager relationship", "Assigned by Admin"],
                    ["Official working schedule", "HR-owned"],
                    ["Targets & commission rules", "Admin-owned"],
                    ["Personal preferences", "Current user"],
                    ["Cross-team transfers", "Explicit approval"],
                  ]}
                />
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="nv-toolbar">
              <SearchBox
                value={term}
                onChange={setTerm}
                placeholder="Search your direct team..."
              />
              <Button href="/team/tasks">Team workload</Button>
            </div>
            <Metrics>
              <Metric label="Assigned partners" value={members.length} />
              <Metric
                label="Team pipeline"
                value={money(
                  leads.reduce((s, l) => s + (l.estimatedValue || 0), 0),
                )}
              />
              <Metric
                label="Won opportunities"
                value={leads.filter((l) => l.status === "won").length}
              />
              <Metric
                label="Needs next step"
                value={leads.filter((l) => !l.nextStep).length}
              />
            </Metrics>
            <Card
              title={
                section === "coaching"
                  ? "Coaching priorities"
                  : "Partner portfolio"
              }
            >
              <Table
                headers={[
                  "Sales Partner",
                  "Active Leads",
                  "Conversion",
                  "Pipeline",
                  "Coverage",
                  "Action",
                ]}
              >
                {members
                  .filter((m) =>
                    `${m.name} ${m.email}`
                      .toLowerCase()
                      .includes(term.toLowerCase()),
                  )
                  .map((member) => {
                    const own = leads.filter(
                        (l) => l.owner_id === member.user_id,
                      ),
                      wins = own.filter((l) => l.status === "won").length;
                    return (
                      <tr key={member._id}>
                        <td>
                          <Link
                            className="nv-inline"
                            href={`/team/partners/${member._id}`}
                          >
                            <Avatar name={member.name} />
                            <div>
                              <strong>{member.name}</strong>
                              <small>{member.title || "Sales Partner"}</small>
                            </div>
                          </Link>
                        </td>
                        <td>{own.length}</td>
                        <td>
                          {own.length
                            ? Math.round((wins / own.length) * 100)
                            : 0}
                          %
                          <Progress
                            value={own.length ? (wins / own.length) * 100 : 0}
                          />
                        </td>
                        <td>
                          {money(
                            own.reduce(
                              (s, l) => s + (l.estimatedValue || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td>
                          {
                            territories.filter(
                              (t) => t.assigned_partner_id === member.user_id,
                            ).length
                          }{" "}
                          areas
                        </td>
                        <td>
                          <Button href={`/team/partners/${member._id}`}>
                            Open
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
              </Table>
              {!members.length && (
                <Empty
                  title="Your direct team will appear here"
                  description="Active reporting relationships are managed in the staff directory."
                />
              )}
            </Card>
          </>
        )}
      </DataState>
      <FormModal
        open={dialog === "coaching"}
        onClose={() => setDialog("")}
        title="Create commercial coaching note"
        description="Use source evidence and agreed follow-up. Keep HR-sensitive matters in the HR process."
        onSubmit={(b) =>
          m.mutateAsync({
            path: "/requests",
            body: {
              ...b,
              kind: "coaching",
              reference: member?._id || b.reference,
            },
          })
        }
      >
        {!member && (
          <Field
            label="Sales Partner"
            name="reference"
            required
            options={members.map((m) => ({
              value: m._id,
              label: m.name || "Partner",
            }))}
          />
        )}
        <Field label="Title" name="title" required />
        <Field
          label="Evidence & agreed next step"
          name="description"
          type="textarea"
          required
        />
      </FormModal>
      <FormModal
        open={dialog === "territory"}
        onClose={() => setDialog("")}
        title="Create & assign sub-territory"
        description="Postal areas must stay within a delegated parent and cannot overlap another sub-territory."
        onSubmit={(b) =>
          m.mutateAsync({
            path: "/territories",
            body: { ...b, capacity: Number(b.capacity || 30) },
          })
        }
      >
        <Field label="Name" name="name" required />
        <Field
          label="Delegated parent"
          name="parent_id"
          required
          options={territories
            .filter((t) => !t.parent_id)
            .map((t) => ({ value: t._id, label: t.name || "Territory" }))}
        />
        <Field
          label="Postal areas (comma separated)"
          name="zipCodes"
          required
        />
        <Field label="Industry" name="industry" />
        <Field
          label="Sales Partner"
          name="assigned_partner_id"
          required
          options={members.map((m) => ({
            value: m.user_id || "",
            label: m.name || "Partner",
          }))}
        />
        <Field
          label="Lead capacity"
          name="capacity"
          type="number"
          defaultValue={30}
        />
      </FormModal>
    </>
  );
}
