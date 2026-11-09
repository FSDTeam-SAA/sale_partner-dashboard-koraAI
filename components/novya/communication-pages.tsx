"use client";
import api from "@/lib/axios";
import {
  date,
  errorMessage,
  label,
  useSales,
  useSalesMutation,
  type Entity,
} from "@/lib/sales";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Forward,
  Mail,
  Plus,
  Reply,
  Send,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
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
  Modal,
  PageTitle,
  SearchBox,
  Tabs,
} from "./ui";
interface Event {
  _id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  kind: string;
}
export function CalendarPage() {
  const q = useSales<Event[]>("/calendar"),
    m = useSalesMutation(),
    params = useSearchParams(),
    [view, setView] = useState("Week"),
    [current, setCurrent] = useState(new Date()),
    [modal, setModal] = useState(false),
    [dismiss, setDismiss] = useState(false),
    [selected, setSelected] = useState<Event>(),
    [edit, setEdit] = useState(false);
  const week = startOfWeek(current, { weekStartsOn: 1 }),
    days = Array.from({ length: 7 }, (_, i) => addDays(week, i)),
    monthStart = startOfWeek(startOfMonth(current), { weekStartsOn: 1 }),
    monthDays = Array.from({ length: 42 }, (_, i) => addDays(monthStart, i)),
    events = q.data || [],
    upcoming = events
      .filter((e) => new Date(e.endsAt) > new Date())
      .slice(0, 5);
  const form = (
    <>
      <Field
        label="Event title"
        name="title"
        defaultValue={edit ? selected?.title : undefined}
        required
      />
      <Field
        label="Kind"
        name="kind"
        defaultValue={edit ? selected?.kind : "meeting"}
        options={["meeting", "focus", "deadline", "other"].map((v) => ({
          value: v,
          label: label(v),
        }))}
      />
      <Field
        label="Starts"
        name="startsAt"
        type="datetime-local"
        defaultValue={
          edit
            ? selected?.startsAt &&
              format(new Date(selected.startsAt), "yyyy-MM-dd'T'HH:mm")
            : format(current, "yyyy-MM-dd'T'09:00")
        }
        required
      />
      <Field
        label="Ends"
        name="endsAt"
        type="datetime-local"
        defaultValue={
          edit
            ? selected?.endsAt &&
              format(new Date(selected.endsAt), "yyyy-MM-dd'T'HH:mm")
            : format(current, "yyyy-MM-dd'T'09:30")
        }
        required
      />
      <Field
        label="Location"
        name="location"
        defaultValue={edit ? selected?.location : undefined}
      />
      <Field
        label="Meeting URL"
        name="meetingUrl"
        type="url"
        defaultValue={edit ? selected?.meetingUrl : undefined}
      />
      <Field
        label="Agenda / notes"
        name="description"
        type="textarea"
        defaultValue={edit ? selected?.description : undefined}
      />
    </>
  );
  const eventButton = (e: Event) => (
    <button className="nv-event" key={e._id} onClick={() => setSelected(e)}>
      {format(new Date(e.startsAt), "HH:mm")} · {e.title}
    </button>
  );
  return (
    <>
      <PageTitle
        title="Calendar"
        description="Meetings, calls, demos and follow-ups — your time, connected."
        action={
          <Button
            onClick={() => {
              setEdit(false);
              setModal(true);
            }}
          >
            <Plus size={13} />
            Create event
          </Button>
        }
      />
      <div className="nv-toolbar">
        <Tabs
          items={["Day", "Week", "Month"]}
          active={view}
          onChange={setView}
        />
        <Button
          onClick={() =>
            setCurrent(
              view === "Month"
                ? addMonths(current, -1)
                : addDays(current, view === "Day" ? -1 : -7),
            )
          }
        >
          <ChevronLeft size={13} />
        </Button>
        <span style={{ fontSize: 12, minWidth: 150, textAlign: "center" }}>
          {format(current, view === "Day" ? "EEE, dd MMM yyyy" : "MMMM yyyy")}
        </span>
        <Button
          onClick={() =>
            setCurrent(
              view === "Month"
                ? addMonths(current, 1)
                : addDays(current, view === "Day" ? 1 : 7),
            )
          }
        >
          <ChevronRight size={13} />
        </Button>
        <Button onClick={() => setCurrent(new Date())}>Today</Button>
        <div style={{ flex: 1 }} />
        <Button href="/assistant?prompt=Help%20me%20prepare%20my%20upcoming%20commercial%20meetings">
          <Sparkles size={13} />
          Ask Kora
        </Button>
      </div>
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        <div
          className="nv-grid"
          style={{ gridTemplateColumns: "minmax(0,1fr) 250px" }}
        >
          <Card className="nv-calendar-panel">
            {view === "Month" ? (
              <div className="nv-table-scroll">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7,minmax(90px,1fr))",
                    minWidth: 650,
                  }}
                >
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (d) => (
                      <div
                        className="nv-day-head"
                        style={{
                          padding: 12,
                          textAlign: "center",
                          color: "#8ea1bf",
                          fontSize: 10,
                        }}
                        key={d}
                      >
                        {d}
                      </div>
                    ),
                  )}
                  {monthDays.map((d) => (
                    <div
                      key={d.toISOString()}
                      style={{
                        minHeight: 115,
                        padding: 8,
                        border: "1px solid #243248",
                        background: isSameDay(d, new Date())
                          ? "#24375b44"
                          : "transparent",
                      }}
                    >
                      <span className="nv-caption">{format(d, "d")}</span>
                      {events
                        .filter((e) => isSameDay(new Date(e.startsAt), d))
                        .map(eventButton)}
                    </div>
                  ))}
                </div>
              </div>
            ) : view === "Day" ? (
              <>
                <h2 style={{ fontSize: 18 }}>
                  {format(current, "EEEE, dd MMMM")}
                </h2>
                {events.filter((e) => isSameDay(new Date(e.startsAt), current))
                  .length ? (
                  events
                    .filter((e) => isSameDay(new Date(e.startsAt), current))
                    .map((e) => (
                      <button
                        className="nv-list-row"
                        style={{ width: "100%", textAlign: "left" }}
                        key={e._id}
                        onClick={() => setSelected(e)}
                      >
                        <Calendar size={18} />
                        <div>
                          <strong>{e.title}</strong>
                          <small>
                            {format(new Date(e.startsAt), "HH:mm")}–
                            {format(new Date(e.endsAt), "HH:mm")} ·{" "}
                            {e.location || "No location"}
                          </small>
                        </div>
                        <Badge>{e.kind}</Badge>
                      </button>
                    ))
                ) : (
                  <Empty
                    title="Your day has room"
                    description="Create a meeting or plan your next commercial follow-up."
                  />
                )}
              </>
            ) : (
              <div className="nv-table-scroll">
                <div className="nv-calendar-grid">
                  <div className="nv-day-head">Time</div>
                  {days.map((d) => (
                    <div
                      className="nv-day-head"
                      key={d.toISOString()}
                      style={{
                        background: isSameDay(d, new Date())
                          ? "#263756"
                          : undefined,
                      }}
                    >
                      {format(d, "EEE d")}
                    </div>
                  ))}
                  {Array.from({ length: 12 }, (_, i) => i + 7).map((hour) => (
                    <Fragment key={hour}>
                      <div>{String(hour).padStart(2, "0")}:00</div>
                      {days.map((d) => (
                        <div key={d.toISOString()}>
                          {events
                            .filter(
                              (e) =>
                                isSameDay(new Date(e.startsAt), d) &&
                                new Date(e.startsAt).getHours() === hour,
                            )
                            .map(eventButton)}
                        </div>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </div>
            )}
            <p className="nv-caption" style={{ marginTop: 15 }}>
              Times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}.
            </p>
          </Card>
          <div className="nv-stack">
            <Card title="Upcoming">
              {upcoming.length ? (
                upcoming.map((e) => (
                  <button
                    key={e._id}
                    className="nv-list-row"
                    style={{ width: "100%", textAlign: "left" }}
                    onClick={() => setSelected(e)}
                  >
                    <span style={{ color: "#8c99ff" }}>●</span>
                    <div>
                      <strong>{e.title}</strong>
                      <small>
                        {date(e.startsAt)} ·{" "}
                        {format(new Date(e.startsAt), "HH:mm")}
                      </small>
                    </div>
                  </button>
                ))
              ) : (
                <Empty title="No upcoming events" />
              )}
            </Card>
            <Card title="Connected work">
              <p className="nv-caption">
                Meetings are canonical Calendar records shared with your
                authorized mobile schedule.
              </p>
              <Button href="/settings/connections">Connection settings</Button>
            </Card>
          </div>
        </div>
      </DataState>
      <FormModal
        open={modal || (params.get("create") === "true" && !dismiss)}
        onClose={() => {
          setModal(false);
          setDismiss(true);
          setEdit(false);
        }}
        title={edit ? "Edit event" : "Create event"}
        onSubmit={async (b) => {
          await m.mutateAsync({
            path: edit ? `/calendar/${selected?._id}` : "/calendar",
            method: edit ? "patch" : "post",
            body: {
              ...b,
              startsAt: new Date(b.startsAt).toISOString(),
              endsAt: new Date(b.endsAt).toISOString(),
            },
          });
          setSelected(undefined);
        }}
      >
        {form}
      </FormModal>
      <Modal
        open={!!selected && !edit}
        onClose={() => setSelected(undefined)}
        title={selected?.title || "Event details"}
      >
        <Badge>{selected?.kind}</Badge>
        <DetailRows
          rows={[
            [
              "Starts",
              selected
                ? format(new Date(selected.startsAt), "EEE dd MMM · HH:mm")
                : "—",
            ],
            [
              "Ends",
              selected ? format(new Date(selected.endsAt), "HH:mm") : "—",
            ],
            ["Location", selected?.location || "—"],
          ]}
        />
        <p className="nv-note">{selected?.description}</p>
        <div className="nv-form-actions">
          {selected?.meetingUrl && (
            <a
              className="nv-button nv-primary"
              target="_blank"
              rel="noreferrer"
              href={selected.meetingUrl}
            >
              Join meeting <ArrowUpRight size={13} />
            </a>
          )}
          <Button
            onClick={() => {
              setEdit(true);
              setModal(true);
            }}
          >
            Edit event
          </Button>
          <Button
            onClick={async () => {
              await m.mutateAsync({
                path: `/calendar/${selected?._id}`,
                method: "delete",
              });
              setSelected(undefined);
            }}
          >
            Cancel event
          </Button>
          <Button href="/tasks/new">Create follow-up</Button>
        </div>
      </Modal>
    </>
  );
}
interface Thread {
  _id: string;
  groupName?: string;
  isGroup: boolean;
  participants: { _id: string; name: string; email?: string }[];
  messages: {
    _id: string;
    sender_id: string;
    content: string;
    sentAt: string;
    fileName?: string;
    fileUrl?: string;
  }[];
  lastMessage?: string;
  lastMessageAt?: string;
}
interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  labelIds?: string[];
  body?: string;
  bodyHtml?: string;
}
export function InboxPage() {
  const [tab, setTab] = useState("Inbox"),
    [term, setTerm] = useState(""),
    [selectedId, setSelectedId] = useState(""),
    [mailId, setMailId] = useState(""),
    [draft, setDraft] = useState(""),
    [compose, setCompose] = useState(false),
    [emailCompose, setEmailCompose] = useState(false),
    [preview, setPreview] = useState<Record<string, string>>(),
    [mailDraft, setMailDraft] = useState<Record<string, string>>({}),
    [sending, setSending] = useState(false),
    { data: session } = useSession();
  const threads = useSales<Thread[]>("/threads"),
    recipients = useSales<Entity[]>("/recipients"),
    m = useSalesMutation();
  const email = useQuery({
      queryKey: ["provider-email"],
      enabled: tab === "Email",
      queryFn: async () =>
        (await api.get("/gmail/inbox")).data.data as { messages: Email[] },
    }),
    mail = useQuery({
      queryKey: ["provider-email", mailId],
      enabled: !!mailId && tab === "Email",
      queryFn: async () =>
        (await api.get(`/gmail/inbox/${encodeURIComponent(mailId)}`)).data
          .data as Email,
    });
  const thread =
      threads.data?.find((t) => t._id === selectedId) || threads.data?.[0],
    name = (t: Thread) =>
      t.groupName ||
      t.participants
        .filter((p) => p._id !== session?.user._id)
        .map((p) => p.name)
        .join(", ") ||
      "Conversation";
  async function send() {
    if (!draft.trim() || !thread) return;
    try {
      await m.mutateAsync({
        path: `/threads/${thread._id}/messages`,
        body: { content: draft },
      });
      setDraft("");
    } catch {}
  }
  return (
    <>
      <PageTitle
        title={tab === "Email" ? "Email" : "Inbox"}
        description="Your conversations with authorized NOVYA colleagues and your connected work email."
        action={
          <Tabs items={["Inbox", "Email"]} active={tab} onChange={setTab} />
        }
      />
      <div className="nv-toolbar">
        <SearchBox
          value={term}
          onChange={setTerm}
          placeholder={
            tab === "Email"
              ? "Search loaded email..."
              : "Search conversations..."
          }
        />
        <Button
          onClick={() =>
            tab === "Email" ? setEmailCompose(true) : setCompose(true)
          }
        >
          <Plus size={13} />
          {tab === "Email" ? "New email" : "New conversation"}
        </Button>
      </div>
      {tab === "Inbox" ? (
        <DataState
          pending={threads.isPending}
          error={threads.error}
          retry={() => threads.refetch()}
        >
          <div className="nv-inbox">
            <section className="nv-thread-list">
              {threads.data
                ?.filter((t) =>
                  `${name(t)} ${t.lastMessage}`
                    .toLowerCase()
                    .includes(term.toLowerCase()),
                )
                .map((t) => (
                  <button
                    key={t._id}
                    className={thread?._id === t._id ? "active" : ""}
                    onClick={() => setSelectedId(t._id)}
                  >
                    <Avatar name={name(t)} />
                    <div>
                      <strong>{name(t)}</strong>
                      <small>{t.lastMessage?.slice(0, 45)}</small>
                    </div>
                  </button>
                ))}
              {!threads.data?.length && (
                <Empty
                  title="Start a conversation"
                  description="Connect with your NOVYA colleagues."
                />
              )}
            </section>
            <section className="nv-message-view">
              {thread ? (
                <>
                  <div className="nv-message-head">
                    <Avatar name={name(thread)} />
                    <div>
                      <strong>{name(thread)}</strong>
                      <p className="nv-caption">Internal NOVYA conversation</p>
                    </div>
                  </div>
                  <div className="nv-messages">
                    {thread.messages.map((msg) => (
                      <div
                        className={`nv-message ${msg.sender_id === session?.user._id ? "mine" : ""}`}
                        key={msg._id}
                      >
                        {msg.content}
                        {msg.fileUrl && (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {msg.fileName || "Attachment"}
                          </a>
                        )}
                        <small>
                          {date(msg.sentAt)} ·{" "}
                          {new Date(msg.sentAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </div>
                    ))}
                  </div>
                  <form
                    className="nv-message-composer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      send();
                    }}
                  >
                    <input
                      aria-label="Message"
                      placeholder="Write a message..."
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <Button
                      primary
                      type="submit"
                      disabled={!draft.trim() || m.isPending}
                    >
                      <Send size={14} />
                    </Button>
                  </form>
                </>
              ) : (
                <Empty
                  title="Your conversations, connected"
                  description="Choose a conversation or start a new one."
                />
              )}
            </section>
            <aside className="nv-stack">
              <Card title="Conversation context">
                <DetailRows
                  rows={[
                    ["Channel", "NOVYA internal"],
                    ["Participants", thread?.participants.length || 0],
                    ["Last activity", date(thread?.lastMessageAt)],
                  ]}
                />
              </Card>
              <Card title="Next step">
                <p className="nv-caption">
                  Keep follow-up work accountable by creating a linked task.
                </p>
                <Button href="/tasks/new">Create follow-up</Button>
              </Card>
            </aside>
          </div>
        </DataState>
      ) : (
        <DataState
          pending={email.isPending}
          error={email.error}
          retry={() => email.refetch()}
        >
          <div
            className="nv-inbox"
            style={{ gridTemplateColumns: "280px minmax(0,1fr)" }}
          >
            <section className="nv-thread-list">
              {email.data?.messages
                .filter((e) =>
                  `${e.subject} ${e.from}`
                    .toLowerCase()
                    .includes(term.toLowerCase()),
                )
                .map((e) => (
                  <button
                    className={mailId === e.id ? "active" : ""}
                    key={e.id}
                    onClick={() => setMailId(e.id)}
                  >
                    <Mail size={16} />
                    <div>
                      <strong>{e.subject || "(No subject)"}</strong>
                      <small>{e.from.slice(0, 40)}</small>
                      <small>{e.snippet.slice(0, 60)}</small>
                    </div>
                  </button>
                ))}
              {!email.data?.messages.length && (
                <Empty
                  title="Your mailbox is clear"
                  description="Connected provider messages appear here."
                />
              )}
            </section>
            <section className="nv-message-view">
              {mailId ? (
                <DataState
                  pending={mail.isPending}
                  error={mail.error}
                  retry={() => mail.refetch()}
                >
                  <div className="nv-message-head">
                    <Mail size={20} />
                    <div>
                      <strong>{mail.data?.subject}</strong>
                      <p className="nv-caption">{mail.data?.from}</p>
                    </div>
                  </div>
                  <div className="nv-messages">
                    <article className="nv-article">
                      {mail.data?.body || mail.data?.snippet}
                    </article>
                    <div className="nv-form-actions">
                      <Button
                        onClick={() => {
                          setMailDraft({
                            recipient:
                              mail.data?.from.match(/<([^>]+)>/)?.[1] ||
                              mail.data?.from ||
                              "",
                            subject: `Re: ${mail.data?.subject || ""}`,
                            body: "",
                          });
                          setEmailCompose(true);
                        }}
                      >
                        <Reply size={13} />
                        Reply
                      </Button>
                      <Button
                        onClick={() => {
                          setMailDraft({
                            subject: `Fwd: ${mail.data?.subject || ""}`,
                            body: mail.data?.body || mail.data?.snippet || "",
                          });
                          setEmailCompose(true);
                        }}
                      >
                        <Forward size={13} />
                        Forward
                      </Button>
                    </div>
                  </div>
                </DataState>
              ) : (
                <Empty
                  title="Select an email"
                  description="Read and reply through your connected work account."
                  action={
                    <Button href="/settings/connections">
                      Manage connection
                    </Button>
                  }
                />
              )}
            </section>
          </div>
        </DataState>
      )}
      <FormModal
        open={compose}
        onClose={() => setCompose(false)}
        title="New conversation"
        onSubmit={async (b) => {
          const t = await m.mutateAsync({ path: "/threads", body: b });
          setSelectedId(t._id);
        }}
      >
        <Field
          label="NOVYA colleague"
          name="recipientId"
          required
          options={(recipients.data || []).map((r) => ({
            value: r.user_id || "",
            label: `${r.name} · ${r.email}`,
          }))}
        />
        <Field label="Message" name="content" type="textarea" required />
      </FormModal>
      <FormModal
        open={emailCompose}
        onClose={() => setEmailCompose(false)}
        title="New email"
        description="Prepare the recipient, subject and message. You will review it before sending."
        submit="Review email"
        onSubmit={async (b) => {
          setMailDraft(b);
          setPreview(b);
        }}
      >
        <Field
          label="Recipient"
          name="recipient"
          type="email"
          defaultValue={mailDraft.recipient}
          required
        />
        <Field
          label="Subject"
          name="subject"
          defaultValue={mailDraft.subject}
          required
        />
        <Field
          label="Message"
          name="body"
          type="textarea"
          defaultValue={mailDraft.body}
          required
        />
      </FormModal>
      <Modal
        open={!!preview}
        onClose={() => setPreview(undefined)}
        title="Send email preview"
        description="This sends an external email from your connected work account."
      >
        <DetailRows
          rows={[
            ["To", preview?.recipient],
            ["Subject", preview?.subject],
            ["Channel", "Gmail work account"],
          ]}
        />
        <p className="nv-note">{preview?.body}</p>
        <div className="nv-modal-footer">
          <Button
            onClick={() => {
              setPreview(undefined);
              setEmailCompose(true);
            }}
          >
            Keep editing
          </Button>
          <Button
            primary
            disabled={sending}
            onClick={async () => {
              setSending(true);
              try {
                await api.post("/send-email", preview);
                setPreview(undefined);
                setMailDraft({});
                toast.success("Email sent");
                email.refetch();
              } catch (e) {
                toast.error(errorMessage(e));
              } finally {
                setSending(false);
              }
            }}
          >
            <Send size={13} />
            Confirm & send
          </Button>
        </div>
      </Modal>
    </>
  );
}
