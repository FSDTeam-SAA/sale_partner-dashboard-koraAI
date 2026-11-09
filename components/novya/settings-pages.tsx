"use client";
import { userApi } from "@/lib/api";
import api from "@/lib/axios";
import {
  date,
  errorMessage,
  label,
  useSales,
  useSalesMutation,
  type Entity,
  type Preferences,
} from "@/lib/sales";
import {
  Accessibility,
  ArrowRight,
  Bell,
  Brain,
  Check,
  Globe,
  LogOut,
  Monitor,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Avatar,
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
  Progress,
} from "./ui";
type Account = {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  mfaEnabled: boolean;
  currentSession?: string;
  role: string;
};
type Connection = {
  provider: string;
  email: string;
  scopes: string[];
  connectedAt: string;
  updatedAt: string;
};
type Session = {
  _id: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
};
function Toggle({
  value,
  onChange,
  label: caption,
  description,
}: {
  value: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="nv-settings-row">
      <div>
        <strong>{caption}</strong>
        {description && <p>{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={caption}
        className="nv-switch"
        onClick={onChange}
      >
        <span />
      </button>
    </div>
  );
}
export function SettingsPage({
  section = "",
  account = false,
}: {
  section?: string;
  account?: boolean;
}) {
  const prefs = useSales<Preferences>("/preferences"),
    profile = useSales<Account>("/account"),
    connections = useSales<Connection[]>("/connections"),
    sessions = useSales<Session[]>("/sessions"),
    requests = useSales<Entity[]>("/requests"),
    m = useSalesMutation(),
    { update } = useSession(),
    [dialog, setDialog] = useState(""),
    [setup, setSetup] = useState<{ secret: string; uri: string }>(),
    [busy, setBusy] = useState(false),
    [disconnect, setDisconnect] = useState<Connection>();
  const p = prefs.data || {},
    a = profile.data;
  const updatePref = async (key: string, value: string | boolean | number) => {
    await m.mutateAsync({
      path: "/preferences",
      method: "put",
      body: { [key]: value },
    });
    toast.success("Preference saved");
  };
  const title = account
    ? section === "security"
      ? "Account & Security"
      : section === "sessions"
        ? "Privacy & Sessions"
        : section === "accessibility"
          ? "App & Accessibility"
          : "Profile"
    : section === "preferences"
      ? "Work Preferences"
      : section === "notifications"
        ? "Notifications"
        : section === "connections"
          ? "Connected Accounts"
          : section === "kora"
            ? "Kora & Brain"
            : section === "privacy"
              ? "Data & Privacy"
              : "Sales Partner Settings";
  async function call(path: string, body?: unknown) {
    setBusy(true);
    try {
      const result = (await api.post(path, body)).data.data;
      return result;
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    } finally {
      setBusy(false);
    }
  }
  const profileDetails = (
    <DetailRows
      rows={[
        ["Name", a?.name],
        ["Work email", a?.email],
        ["Role", label(a?.role)],
        ["Phone", a?.phoneNumber || "—"],
      ]}
    />
  );
  return (
    <>
      <PageTitle
        title={title}
        description={
          account
            ? "Your personal account, security and accessible work experience."
            : "Make your workspace work for you, within effective Sales policy."
        }
        action={<Badge>Personal account</Badge>}
      />
      <DataState
        pending={prefs.isPending || profile.isPending}
        error={prefs.error || profile.error}
        retry={() => {
          prefs.refetch();
          profile.refetch();
        }}
      >
        {account && !section ? (
          <>
            <Metrics>
              <Metric label="Account" value="Active" detail={a?.email} />
              <Metric
                label="Role"
                value={label(a?.role)}
                detail="Assigned by administrator"
              />
              <Metric
                label="Language"
                value={String(p.language || "English")}
              />
              <Metric
                label="Timezone"
                value={String(
                  p.timezone ||
                    Intl.DateTimeFormat().resolvedOptions().timeZone,
                )}
              />
            </Metrics>
            <div className="nv-grid">
              <Card
                title="Personal information"
                action={
                  <Button onClick={() => setDialog("profile")}>
                    Edit profile
                  </Button>
                }
              >
                <div className="nv-record-head">
                  <Avatar name={a?.name} />
                  <div>
                    <h1>{a?.name}</h1>
                    <p>{a?.email}</p>
                  </div>
                </div>
                {profileDetails}
              </Card>
              <div className="nv-stack">
                <Card title="Language & region">
                  <SettingsForm
                    key={JSON.stringify(p)}
                    prefs={p}
                    fields={["language", "timezone"]}
                    save={(b) =>
                      m.mutateAsync({
                        path: "/preferences",
                        method: "put",
                        body: b,
                      })
                    }
                  />
                </Card>
                <Card title="Account settings">
                  <Button href="/account/security">
                    <Shield size={13} />
                    Account & Security
                  </Button>
                  <div style={{ height: 10 }} />
                  <Button href="/account/accessibility">
                    <Accessibility size={13} />
                    App & Accessibility
                  </Button>
                </Card>
              </div>
            </div>
          </>
        ) : account && section === "security" ? (
          <>
            <Metrics>
              <Metric
                label="Account security"
                value={a?.mfaEnabled ? "Protected" : "Password"}
                detail="Policy applies to your account"
              />
              <Metric
                label="Two-factor authentication"
                value={a?.mfaEnabled ? "Enabled" : "Not enabled"}
              />
              <Metric
                label="Active sessions"
                value={sessions.data?.length || 0}
              />
              <Metric
                label="Recovery"
                value="Available"
                detail="Verified email recovery"
              />
            </Metrics>
            <div className="nv-grid-equal">
              <Card title="Sign-in & verification">
                <DetailRows
                  rows={[
                    ["Sign-in email", a?.email],
                    ["Password", "Protected"],
                    [
                      "Two-factor",
                      <Badge key="mfa">
                        {a?.mfaEnabled ? "Enabled" : "Not enabled"}
                      </Badge>,
                    ],
                  ]}
                />
                <div className="nv-form-actions">
                  <Button onClick={() => setDialog("password")}>
                    Change password
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={async () => {
                      if (a?.mfaEnabled) setDialog("disable-mfa");
                      else {
                        setSetup(await call("/security/mfa/setup"));
                        setDialog("setup-mfa");
                      }
                    }}
                  >
                    {a?.mfaEnabled ? "Manage MFA" : "Enable MFA"}
                  </Button>
                </div>
              </Card>
              <Card title="Sessions & devices">
                <p className="nv-caption">
                  Review your active sign-ins and revoke a device you no longer
                  use.
                </p>
                {sessions.data?.slice(0, 3).map((s) => (
                  <div className="nv-list-row" key={s._id}>
                    <Monitor size={16} />
                    <div>
                      <strong>
                        {s.userAgent.includes("Windows")
                          ? "Windows"
                          : s.userAgent.includes("Mac")
                            ? "Mac"
                            : "Work device"}
                      </strong>
                      <small>Signed in {date(s.createdAt)}</small>
                    </div>
                    <Badge>{s.current ? "Current" : "Active"}</Badge>
                  </div>
                ))}
                <Button href="/account/sessions">View all sessions</Button>
              </Card>
            </div>
          </>
        ) : account && section === "sessions" ? (
          <>
            <Metrics>
              <Metric
                label="Current session"
                value="Browser"
                detail="This device"
              />
              <Metric
                label="Active sign-ins"
                value={sessions.data?.length || 0}
              />
              <Metric
                label="Privacy requests"
                value={
                  requests.data?.filter((r) => r.kind === "privacy").length || 0
                }
              />
              <Metric label="Identity" value="Protected" />
            </Metrics>
            <div className="nv-grid">
              <Card title="Signed-in devices">
                {sessions.data?.length ? (
                  sessions.data.map((s) => (
                    <div className="nv-list-row" key={s._id}>
                      <Monitor size={20} />
                      <div>
                        <strong>
                          {s.userAgent.includes("Windows")
                            ? "Windows"
                            : s.userAgent.includes("Mac")
                              ? "Mac"
                              : "Browser"}
                          {s.current ? " · This device" : ""}
                        </strong>
                        <small
                          style={{
                            maxWidth: 400,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {s.userAgent}
                        </small>
                        <small>
                          Signed in {date(s.createdAt)} · Expires{" "}
                          {date(s.expiresAt)}
                        </small>
                      </div>
                      <Button
                        onClick={async () => {
                          await m.mutateAsync({
                            path: `/sessions/${s._id}`,
                            method: "delete",
                          });
                          if (s.current) signOut({ callbackUrl: "/login" });
                        }}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))
                ) : (
                  <Empty
                    title="No tracked devices"
                    description="New sign-ins appear here with individual revocation controls."
                  />
                )}
              </Card>
              <Card title="Data & usage controls">
                <p className="nv-caption">
                  View personal data categories and submit eligible export,
                  correction or deletion requests.
                </p>
                <Button href="/settings/privacy">Open privacy settings</Button>
                <div style={{ height: 25 }} />
                <Button onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut size={13} />
                  Sign out of this browser
                </Button>
              </Card>
            </div>
          </>
        ) : account && section === "accessibility" ? (
          <>
            <Metrics>
              <Metric label="Text scale" value={`${p.textScale || 100}%`} />
              <Metric
                label="Contrast"
                value={p.highContrast ? "High" : "Standard"}
              />
              <Metric
                label="Motion"
                value={p.reducedMotion ? "Reduced" : "System"}
              />
              <Metric
                label="Keyboard"
                value="Enabled"
                detail="Visible focus indicators"
              />
            </Metrics>
            <div className="nv-grid-equal">
              <Card title="Display & accessibility">
                <Toggle
                  label="High contrast"
                  description="Use stronger borders and text contrast."
                  value={!!p.highContrast}
                  onChange={() => updatePref("highContrast", !p.highContrast)}
                />
                <Toggle
                  label="Reduce motion"
                  description="Minimize nonessential movement."
                  value={!!p.reducedMotion}
                  onChange={() => updatePref("reducedMotion", !p.reducedMotion)}
                />
                <div className="nv-settings-row">
                  <div>
                    <strong>Text scaling</strong>
                    <p>Choose a comfortable content scale.</p>
                  </div>
                  <select
                    className="nv-input"
                    style={{ maxWidth: 100 }}
                    value={Number(p.textScale) || 100}
                    onChange={(e) =>
                      updatePref("textScale", Number(e.target.value))
                    }
                  >
                    {[80, 90, 100, 110, 120, 140, 160].map((v) => (
                      <option key={v} value={v}>
                        {v}%
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
              <Card title="Interaction & app behavior">
                <DetailRows
                  rows={[
                    ["Keyboard navigation", "Full"],
                    ["Focus indicators", "Visible"],
                    ["Button labels", "Descriptive"],
                    ["Dialog focus", "Contained"],
                    ["Default landing page", "Overview"],
                  ]}
                />
                <Button href="/dashboard">Preview dashboard</Button>
              </Card>
            </div>
          </>
        ) : !account && !section ? (
          <>
            <Card
              title="Personal setup"
              description="Connection, notification, Brain and privacy status."
              action={<Badge>Current user</Badge>}
            >
              <Progress value={a?.mfaEnabled ? 100 : 75} />
              <div className="nv-kpi-note">
                <span>Profile · Work preferences · Connected accounts</span>
                <span>Personal controls</span>
              </div>
            </Card>
            <div style={{ height: 18 }} />
            <div className="nv-grid-equal">
              {[
                [
                  "Work Preferences",
                  "Choose default views, density, focus hours and task ordering.",
                  "preferences",
                  Settings,
                ],
                [
                  "Notifications",
                  "Tune channels, quiet hours and digests.",
                  "notifications",
                  Bell,
                ],
                [
                  "Connected Accounts",
                  "Connect your personal work email and approved OAuth.",
                  "connections",
                  Globe,
                ],
                [
                  "Kora & Brain",
                  "Review memory consent, response style and personal context.",
                  "kora",
                  Brain,
                ],
                [
                  "Data & Privacy",
                  "Understand data categories and request eligible changes.",
                  "privacy",
                  Shield,
                ],
                [
                  "Account & Security",
                  "Manage password, MFA, sessions and accessibility.",
                  "/account/security",
                  UserRound,
                ],
              ].map(([name, desc, href, Icon]) => {
                const I = Icon as typeof Settings;
                return (
                  <Link
                    className="nv-card"
                    key={String(name)}
                    href={
                      String(href).startsWith("/")
                        ? String(href)
                        : `/settings/${href}`
                    }
                  >
                    <div className="nv-inline">
                      <I size={19} />
                      <h2 style={{ fontSize: 14 }}>{String(name)}</h2>
                      <ArrowRight size={13} style={{ marginLeft: "auto" }} />
                    </div>
                    <p className="nv-caption" style={{ marginTop: 12 }}>
                      {String(desc)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </>
        ) : section === "preferences" ? (
          <>
            <Metrics>
              <Metric
                label="View density"
                value={label(String(p.density || "comfortable"))}
              />
              <Metric
                label="Meeting buffer"
                value={`${p.meetingBuffer || 0} min`}
              />
              <Metric label="Timezone" value={String(p.timezone || "System")} />
              <Metric
                label="Focus hours"
                value={
                  p.focusStart ? `${p.focusStart}–${p.focusEnd}` : "Not set"
                }
              />
            </Metrics>
            <div className="nv-grid">
              <Card title="Your work preferences">
                <SettingsForm
                  key={JSON.stringify(p)}
                  prefs={p}
                  fields={[
                    "density",
                    "defaultView",
                    "focusStart",
                    "focusEnd",
                    "meetingBuffer",
                    "signature",
                  ]}
                  save={(b) =>
                    m.mutateAsync({
                      path: "/preferences",
                      method: "put",
                      body: b,
                    })
                  }
                />
              </Card>
              <Card title="Effective policy">
                <DetailRows
                  rows={[
                    ["Assignment", "Managed by Team Lead"],
                    ["Territory", "Delegated commercial scope"],
                    ["Pricing", "Approved commercial policy"],
                    ["Official schedule", "Managed by HR"],
                    ["Personal choices", "Applied within policy"],
                  ]}
                />
              </Card>
            </div>
          </>
        ) : section === "notifications" ? (
          <>
            <Metrics>
              <Metric
                label="Email"
                value={p.emailNotifications === false ? "Off" : "On"}
              />
              <Metric
                label="Push preference"
                value={p.pushNotifications ? "On" : "Off"}
              />
              <Metric
                label="Digest"
                value={label(String(p.digest || "daily"))}
              />
              <Metric label="Required events" value="Always on" />
            </Metrics>
            <div className="nv-grid-equal">
              <Card title="Personal delivery channels">
                <Toggle
                  label="Email notifications"
                  value={p.emailNotifications !== false}
                  onChange={() =>
                    updatePref(
                      "emailNotifications",
                      p.emailNotifications === false,
                    )
                  }
                />
                <Toggle
                  label="Push notifications preference"
                  description="Delivery follows the connected app's browser permissions."
                  value={!!p.pushNotifications}
                  onChange={() =>
                    updatePref("pushNotifications", !p.pushNotifications)
                  }
                />
                <SettingsForm
                  key={JSON.stringify(p)}
                  prefs={p}
                  fields={["digest", "quietStart", "quietEnd"]}
                  save={(b) =>
                    m.mutateAsync({
                      path: "/preferences",
                      method: "put",
                      body: b,
                    })
                  }
                />
              </Card>
              <Card title="Required notification events">
                {[
                  "Direct assignments",
                  "Security events",
                  "Approval decisions",
                  "Mandatory learning",
                  "Material contract events",
                ].map((s) => (
                  <div className="nv-settings-row" key={s}>
                    <strong>{s}</strong>
                    <Badge>Required</Badge>
                  </div>
                ))}
                <p className="nv-caption">
                  Required notifications remain enabled under effective platform
                  policy.
                </p>
              </Card>
            </div>
          </>
        ) : section === "connections" ? (
          <div className="nv-grid-equal">
            {["gmail", "outlook"].map((provider) => {
              const c = connections.data?.find((c) => c.provider === provider);
              return (
                <Card
                  key={provider}
                  title={
                    provider === "gmail"
                      ? "Google Workspace"
                      : "Microsoft Outlook"
                  }
                  description={c?.email || "Personal work email connection"}
                  action={<Badge>{c ? "Connected" : "Disconnected"}</Badge>}
                >
                  <Globe size={35} color="#9aaac6" />
                  <DetailRows
                    rows={[
                      ["Identity", c?.email || "Not connected"],
                      ["Connected", date(c?.connectedAt)],
                      ["Last update", date(c?.updatedAt)],
                      [
                        "Scopes",
                        c?.scopes?.join(", ") || "Requested during connection",
                      ],
                    ]}
                  />
                  <div className="nv-form-actions">
                    {c && (
                      <Button onClick={() => setDisconnect(c)}>
                        Disconnect
                      </Button>
                    )}
                    <Button
                      primary
                      onClick={async () => {
                        try {
                          const r = await api.get(`/${provider}/init`);
                          const url =
                            r.data.data?.url ||
                            r.data.data?.authUrl ||
                            r.data.url;
                          if (
                            typeof url === "string" &&
                            url.startsWith("https://")
                          )
                            window.location.assign(url);
                          else
                            throw new Error(
                              "The provider did not return an authorization URL",
                            );
                        } catch (e) {
                          toast.error(errorMessage(e));
                        }
                      }}
                    >
                      {c ? "Reconnect" : "Connect account"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : section === "kora" ? (
          <div className="nv-grid">
            <Card title="Kora & Personal Brain">
              <Toggle
                label="Use confirmed personal memory"
                description="Keep your private context available to Kora."
                value={p.brainEnabled !== false}
                onChange={() =>
                  updatePref("brainEnabled", p.brainEnabled === false)
                }
              />
              <SettingsForm
                key={JSON.stringify(p)}
                prefs={p}
                fields={["koraStyle", "language"]}
                save={(b) =>
                  m.mutateAsync({
                    path: "/preferences",
                    method: "put",
                    body: b,
                  })
                }
              />
              <Button href="/assistant/brain">
                <Brain size={13} />
                Review personal memory
              </Button>
            </Card>
            <Card title="Protected records">
              <p className="nv-caption">
                Personal memory settings do not change Leads, Organizations,
                offers, contracts, commission evidence, shared messages or
                required learning history.
              </p>
              <DetailRows
                rows={[
                  ["Assistant conversations", "Private"],
                  ["Brain entries", "Reviewable by you"],
                  ["Commercial records", "Canonical owners"],
                  ["Kora actions", "Preview & explicit execution"],
                ]}
              />
            </Card>
          </div>
        ) : section === "privacy" ? (
          <>
            <div className="nv-grid">
              <Card title="Data & usage categories">
                <DetailRows
                  rows={[
                    ["Profile", "Work identity and account preferences"],
                    ["Personal context", "Private chats and Brain entries"],
                    [
                      "Commercial history",
                      "Shared records with accountable owners",
                    ],
                    ["Learning", "Required progress and certificates"],
                    ["Security", "Protected sign-in and audit evidence"],
                  ]}
                />
                <Button onClick={() => setDialog("privacy")}>
                  Create privacy request
                </Button>
              </Card>
              <Card title="Your privacy requests">
                {requests.data
                  ?.filter((r) => r.kind === "privacy")
                  .map((r) => (
                    <div className="nv-list-row" key={r._id}>
                      <Shield size={15} />
                      <div>
                        <strong>{r.title}</strong>
                        <small>{date(r.createdAt)}</small>
                      </div>
                      <Badge>{r.status}</Badge>
                    </div>
                  ))}
                {!requests.data?.some((r) => r.kind === "privacy") && (
                  <Empty
                    title="No privacy requests"
                    description="Eligible exports, corrections and deletions follow identity and policy checks."
                  />
                )}
              </Card>
            </div>
          </>
        ) : null}
      </DataState>
      <FormModal
        open={dialog === "profile"}
        onClose={() => setDialog("")}
        title="Edit profile"
        onSubmit={async (b) => {
          await m.mutateAsync({ path: "/account", method: "patch", body: b });
          await update({});
        }}
      >
        <Field label="Full name" name="name" defaultValue={a?.name} required />
        <Field
          label="Phone number"
          name="phoneNumber"
          defaultValue={a?.phoneNumber}
        />
      </FormModal>
      <FormModal
        open={dialog === "password"}
        onClose={() => setDialog("")}
        title="Change password"
        onSubmit={async (b) => {
          try {
            await userApi.changePassword({
              currentPassword: b.currentPassword,
              newPassword: b.newPassword,
              confirmNewPassword: b.confirmNewPassword,
            });
            toast.success("Password changed. Sign in again.");
            signOut({ callbackUrl: "/login" });
          } catch (e) {
            toast.error(errorMessage(e));
            throw e;
          }
        }}
      >
        <Field
          label="Current password"
          name="currentPassword"
          type="password"
          required
        />
        <Field
          label="New password"
          name="newPassword"
          type="password"
          required
        />
        <Field
          label="Confirm new password"
          name="confirmNewPassword"
          type="password"
          required
        />
      </FormModal>
      <FormModal
        open={dialog === "privacy"}
        onClose={() => setDialog("")}
        title="Create privacy request"
        onSubmit={(b) =>
          m.mutateAsync({ path: "/requests", body: { ...b, kind: "privacy" } })
        }
      >
        <Field
          label="Request type"
          name="title"
          required
          options={[
            "Export eligible personal data",
            "Correct personal data",
            "Delete eligible personal data",
          ].map((v) => ({ value: v, label: v }))}
        />
        <Field label="Details" name="description" type="textarea" required />
      </FormModal>
      <FormModal
        open={dialog === "setup-mfa"}
        onClose={() => setDialog("")}
        title="Enable two-factor authentication"
        description="Add the setup key to your authenticator, then verify a fresh code."
        onSubmit={async (b) => {
          await call("/security/mfa/confirm", b);
          signOut({ callbackUrl: "/login" });
        }}
      >
        <div style={{ gridColumn: "1/-1" }}>
          <p className="nv-caption">Authenticator setup key (keep private)</p>
          <code
            style={{
              display: "block",
              padding: 15,
              background: "#0b1523",
              borderRadius: 8,
              wordBreak: "break-all",
            }}
          >
            {setup?.secret}
          </code>
          <p className="nv-caption">
            Account: {a?.email} · Issuer: NOVYA · 6 digits · 30 seconds
          </p>
        </div>
        <Field label="Authenticator code" name="code" required />
      </FormModal>
      <FormModal
        open={dialog === "disable-mfa"}
        onClose={() => setDialog("")}
        title="Disable two-factor authentication"
        description="Verify a fresh authenticator code. This revokes existing sessions."
        onSubmit={async (b) => {
          await call("/security/mfa/disable", b);
          signOut({ callbackUrl: "/login" });
        }}
      >
        <Field label="Authenticator code" name="code" required />
      </FormModal>
      <Modal
        open={!!disconnect}
        onClose={() => setDisconnect(undefined)}
        title="Disconnect account"
        description="New sends and synchronization through this connection will stop. Canonical records and protected history remain."
      >
        <DetailRows
          rows={[
            ["Provider", label(disconnect?.provider)],
            ["Work email", disconnect?.email],
          ]}
        />
        <div className="nv-modal-footer">
          <Button onClick={() => setDisconnect(undefined)}>
            Keep connected
          </Button>
          <Button
            onClick={async () => {
              await m.mutateAsync({
                path: `/connections/${disconnect?.provider}`,
                method: "delete",
              });
              setDisconnect(undefined);
            }}
          >
            Confirm disconnect
          </Button>
        </div>
      </Modal>
    </>
  );
}
function SettingsForm({
  prefs,
  fields,
  save,
}: {
  prefs: Preferences;
  fields: string[];
  save: (b: Record<string, string | number>) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const options: Record<string, string[]> = {
    density: ["comfortable", "compact"],
    defaultView: ["overview", "list", "pipeline"],
    digest: ["daily", "weekly", "off"],
    koraStyle: ["concise", "balanced", "detailed"],
    language: ["English", "Deutsch", "বাংলা"],
  };
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const b = Object.fromEntries(new FormData(e.currentTarget)) as Record<
          string,
          string | number
        >;
        if (b.meetingBuffer) b.meetingBuffer = Number(b.meetingBuffer);
        setBusy(true);
        try {
          await save(b);
          toast.success("Preferences saved");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="nv-form-grid">
        {fields.map((f) => (
          <Field
            key={f}
            label={label(f.replace(/([A-Z])/g, " $1"))}
            name={f}
            defaultValue={String(prefs[f] ?? "")}
            type={
              f.toLowerCase().includes("start") ||
              f.toLowerCase().includes("end")
                ? "time"
                : f === "meetingBuffer"
                  ? "number"
                  : f === "signature"
                    ? "textarea"
                    : "text"
            }
            options={options[f]?.map((v) => ({ value: v, label: label(v) }))}
          />
        ))}
      </div>
      <div className="nv-form-actions">
        <Button type="submit" primary disabled={busy}>
          <Check size={13} />
          Save settings
        </Button>
      </div>
    </form>
  );
}
