"use client";
import { date, useSales, useSalesMutation, type Entity } from "@/lib/sales";
import {
  ArrowRight,
  ArrowUp,
  FileText,
  Folder,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
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
  SearchBox,
  Tabs,
} from "./ui";
import { WorkflowsPage } from "./work-pages";
export function AssistantPage({
  section = "",
  id,
}: {
  section?: string;
  id?: string;
}) {
  const conversations = useSales<Entity[]>("/conversations"),
    folders = useSales<Entity[]>("/folders"),
    memory = useSales<Entity[]>("/memory"),
    conversation = useSales<Entity>(
      `/conversations/${id}`,
      section === "conversation" && !!id,
    ),
    m = useSalesMutation(),
    router = useRouter(),
    p = useSearchParams();
  const [draft, setDraft] = useState(p.get("prompt") || ""),
    [dialog, setDialog] = useState(""),
    [term, setTerm] = useState(""),
    [brainTab, setBrainTab] = useState("Graph"),
    [selected, setSelected] = useState<Entity>(),
    [move, setMove] = useState<Entity>(),
    fileRef = useRef<HTMLInputElement>(null);
  async function send() {
    if (!draft.trim() || m.isPending) return;
    const result = await m.mutateAsync({
      path: "/chat",
      body: {
        message: draft,
        conversation_id: section === "conversation" ? id : undefined,
      },
    });
    setDraft("");
    router.push(`/assistant/conversation/${result._id}`);
  }
  if (section === "actions") return <WorkflowsPage actions />;
  const rows = (conversations.data || []).filter(
    (c) =>
      (!term || c.title?.toLowerCase().includes(term.toLowerCase())) &&
      (!id || section !== "folders" || c.folder_id === id),
  );
  const entries = (memory.data || []).filter(
    (e) =>
      !term ||
      `${e.title} ${e.content}`.toLowerCase().includes(term.toLowerCase()),
  );
  const categories = [
    ...new Set((memory.data || []).map((e) => e.category || "Working Style")),
  ];
  const composer = (
    <div className="nv-chat-composer">
      <textarea
        aria-label="Ask Kora"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Ask Kora anything…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />
      <button
        aria-label="Send message"
        disabled={m.isPending || !draft.trim()}
        onClick={send}
      >
        {m.isPending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <ArrowUp size={17} />
        )}
      </button>
    </div>
  );
  if (section === "folders" || section === "history")
    return (
      <>
        <PageTitle
          title={
            section === "history"
              ? "History"
              : id
                ? folders.data?.find((f) => f._id === id)?.name || "Folder"
                : "Folders"
          }
          description={
            section === "history"
              ? "Your private conversations and preparation, in one place."
              : "Keep related conversations organized without duplicating commercial records."
          }
          action={
            <Button onClick={() => setDialog("folder")}>
              <Plus size={13} />
              Create folder
            </Button>
          }
        />
        <div className="nv-toolbar">
          <SearchBox
            value={term}
            onChange={setTerm}
            placeholder="Search your conversations..."
          />
        </div>
        <DataState
          pending={conversations.isPending || folders.isPending}
          error={conversations.error || folders.error}
          retry={() => conversations.refetch()}
        >
          {section === "folders" && !id && (
            <div className="nv-file-grid" style={{ marginBottom: 25 }}>
              {folders.data?.map((f) => (
                <Card
                  key={f._id}
                  title={f.name}
                  action={
                    <More
                      items={[
                        {
                          label: "Archive folder",
                          action: () =>
                            m.mutate({
                              path: `/folders/${f._id}`,
                              method: "delete",
                            }),
                        },
                      ]}
                    />
                  }
                >
                  <Folder size={23} color="#a3b1cc" />
                  <p className="nv-caption">
                    {f.description || "Personal conversation collection"}
                  </p>
                  <Button href={`/assistant/folders/${f._id}`}>
                    {conversations.data?.filter((c) => c.folder_id === f._id)
                      .length || 0}{" "}
                    conversations <ArrowRight size={12} />
                  </Button>
                </Card>
              ))}
            </div>
          )}
          <Card
            title={
              section === "history" ? "Assistant history" : "Conversations"
            }
          >
            {rows.length ? (
              rows.map((c) => (
                <div className="nv-list-row" key={c._id}>
                  <MessageSquare size={15} />
                  <div>
                    <Link href={`/assistant/conversation/${c._id}`}>
                      <strong>{c.title}</strong>
                    </Link>
                    <small>
                      {date(c.lastMessageAt)} · {c.conv_code || "Personal chat"}
                    </small>
                  </div>
                  <More
                    items={[
                      { label: "Move to folder", action: () => setMove(c) },
                      {
                        label: "Open conversation",
                        action: () =>
                          router.push(`/assistant/conversation/${c._id}`),
                      },
                    ]}
                  />
                </div>
              ))
            ) : (
              <Empty
                title="A little space for your next idea"
                description="Start a conversation with Kora and organize it here."
                action={<Button href="/assistant">New chat</Button>}
              />
            )}
          </Card>
        </DataState>
        <FormModal
          open={dialog === "folder"}
          onClose={() => setDialog("")}
          title="Create folder"
          onSubmit={(b) => m.mutateAsync({ path: "/folders", body: b })}
        >
          <Field label="Folder name" name="name" required />
          <Field label="Description" name="description" type="textarea" />
        </FormModal>
        <FormModal
          open={!!move}
          onClose={() => setMove(undefined)}
          title="Move conversation to folder"
          onSubmit={(b) =>
            m.mutateAsync({
              path: `/conversations/${move?._id}`,
              method: "patch",
              body: b,
            })
          }
        >
          <Field
            label="Folder"
            name="folder_id"
            options={(folders.data || []).map((f) => ({
              value: f._id,
              label: f.name || "Folder",
            }))}
          />
        </FormModal>
      </>
    );
  if (section === "brain")
    return (
      <>
        <PageTitle
          title="Personal Brain"
          description="What Kora knows about your goals, working style, relationships and development."
          action={
            <>
              <Button onClick={() => setDialog("source")}>
                <Upload size={13} />
                Import source
              </Button>
              <Button onClick={() => setDialog("memory")}>
                <Plus size={13} />
                Add knowledge
              </Button>
            </>
          }
        />
        <div className="nv-toolbar">
          <SearchBox
            value={term}
            onChange={setTerm}
            placeholder="Search personal knowledge..."
          />
          <Tabs
            items={["Graph", "Knowledge", "Sources"]}
            active={brainTab}
            onChange={setBrainTab}
          />
        </div>
        <DataState
          pending={memory.isPending}
          error={memory.error}
          retry={() => memory.refetch()}
        >
          <div className="nv-grid">
            <Card>
              {brainTab === "Graph" ? (
                <div className="nv-brain">
                  <svg viewBox="0 0 600 390">
                    <circle
                      cx="300"
                      cy="195"
                      r="70"
                      fill="none"
                      stroke="#25364c"
                    />
                    <circle
                      cx="300"
                      cy="195"
                      r="115"
                      fill="none"
                      stroke="#1f2e42"
                    />
                    <circle
                      cx="300"
                      cy="195"
                      r="155"
                      fill="none"
                      stroke="#1a283d"
                    />
                    {Array.from({ length: 65 }, (_, i) => {
                      const angle = i * 2.4,
                        radius = 30 + ((i * 17) % 135);
                      return (
                        <circle
                          key={i}
                          cx={300 + Math.cos(angle) * radius}
                          cy={195 + Math.sin(angle) * radius}
                          r={i % 5 === 0 ? 2 : 1}
                          fill={i % 4 === 0 ? "#a6c7ff" : "#526c93"}
                        />
                      );
                    })}
                  </svg>
                  <div className="nv-orb" />
                  {(categories.length
                    ? categories
                    : [
                        "Role & Responsibilities",
                        "Goals & Priorities",
                        "Relationships",
                        "Working Style",
                        "Skills & Development",
                      ]
                  )
                    .slice(0, 5)
                    .map((c, i) => (
                      <button
                        key={c}
                        className="nv-brain-label"
                        style={{
                          left: `${[3, 68, 5, 68, 34][i]}%`,
                          top: `${[9, 9, 70, 70, 88][i]}%`,
                        }}
                        onClick={() => {
                          setTerm(c);
                          setBrainTab("Knowledge");
                        }}
                      >
                        {c} ·{" "}
                        {
                          (memory.data || []).filter((e) => e.category === c)
                            .length
                        }
                      </button>
                    ))}
                </div>
              ) : entries.length ? (
                entries
                  .filter((e) => brainTab !== "Sources" || e.source)
                  .map((e) => (
                    <div className="nv-list-row" key={e._id}>
                      <FileText size={16} />
                      <div>
                        <button
                          style={{ textAlign: "left" }}
                          onClick={() => setSelected(e)}
                        >
                          <strong>{e.title}</strong>
                        </button>
                        <small>
                          {e.source || e.category} · {date(e.updatedAt)}
                        </small>
                      </div>
                      <Badge>{e.status}</Badge>
                      <More
                        items={[
                          {
                            label: "Open knowledge",
                            action: () => setSelected(e),
                          },
                          ...(e.status === "proposed"
                            ? [
                                {
                                  label: "Confirm memory",
                                  action: () =>
                                    m.mutate({
                                      path: `/memory/${e._id}`,
                                      method: "patch",
                                      body: { status: "confirmed" },
                                    }),
                                },
                              ]
                            : []),
                          {
                            label: "Remove memory",
                            action: () =>
                              m.mutate({
                                path: `/memory/${e._id}`,
                                method: "patch",
                                body: { status: "removed" },
                              }),
                          },
                        ]}
                      />
                    </div>
                  ))
              ) : (
                <Empty
                  title="Your Brain grows with you"
                  description="Add personal context or import a source, then review what Kora can use."
                />
              )}
              <Metrics>
                <Metric
                  label="Personal context items"
                  value={memory.data?.length || 0}
                />
                <Metric
                  label="Confirmed"
                  value={
                    memory.data?.filter((e) => e.status === "confirmed")
                      .length || 0
                  }
                />
                <Metric
                  label="Proposed"
                  value={
                    memory.data?.filter((e) => e.status === "proposed")
                      .length || 0
                  }
                />
                <Metric label="Context groups" value={categories.length} />
              </Metrics>
            </Card>
            <Card
              title="Personal context"
              description="Private to your current work identity."
            >
              <DetailRows
                rows={[
                  ["Role & Responsibilities", "Your commercial work"],
                  ["Goals & Priorities", "Personal direction"],
                  ["Relationships", "Working context"],
                  ["Working Style", "How you work best"],
                  ["Skills & Development", "Your growth"],
                ]}
              />
              <p className="nv-caption">
                Personal Brain enriches your experience. Leads, Organizations,
                contracts and shared records remain owned by their source
                systems.
              </p>
              <Button href="/settings/kora">Memory preferences</Button>
            </Card>
          </div>
        </DataState>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".pdf,.docx,.txt,.md,.csv,.json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const b = new FormData();
            b.append("file", file);
            await m.mutateAsync({ path: "/memory/import", body: b });
            e.target.value = "";
          }}
        />
        <FormModal
          open={dialog === "memory" || dialog === "edit-memory"}
          onClose={() => setDialog("")}
          title="Add personal knowledge"
          description="Review the source and confirm how this context should be used."
          onSubmit={(b) =>
            m.mutateAsync({
              path:
                dialog === "edit-memory"
                  ? `/memory/${selected?._id}`
                  : "/memory",
              method: dialog === "edit-memory" ? "patch" : "post",
              body: b,
            })
          }
        >
          <Field
            label="Title"
            name="title"
            required
            defaultValue={
              dialog === "edit-memory" ? selected?.title : undefined
            }
          />
          <Field
            label="Context group"
            name="category"
            defaultValue="Working Style"
            options={[
              "Role & Responsibilities",
              "Goals & Priorities",
              "Relationships",
              "Working Style",
              "Skills & Development",
            ].map((v) => ({ value: v, label: v }))}
          />
          <Field
            label="Source"
            name="source"
            defaultValue={
              dialog === "edit-memory" ? selected?.source : undefined
            }
          />
          <Field
            label="What should Kora know?"
            name="content"
            type="textarea"
            required
            defaultValue={
              dialog === "edit-memory" && typeof selected?.content === "string"
                ? selected.content
                : undefined
            }
          />
        </FormModal>
        <Modal
          open={!!selected && !dialog}
          onClose={() => setSelected(undefined)}
          title={selected?.title || "Personal knowledge"}
        >
          <Badge>{selected?.status}</Badge>
          <p className="nv-note">
            {typeof selected?.content === "string" ? selected.content : ""}
          </p>
          <DetailRows
            rows={[
              ["Group", selected?.category],
              ["Source", selected?.source || "Manual"],
              ["Updated", date(selected?.updatedAt)],
            ]}
          />
          <div className="nv-form-actions">
            <Button onClick={() => setDialog("edit-memory")}>
              Edit personal entry
            </Button>
          </div>
        </Modal>
        <Modal
          open={dialog === "source"}
          onClose={() => setDialog("")}
          title="Connect source"
          description="Choose an eligible personal source. Imported context remains proposed until you confirm it."
        >
          <div className="nv-grid-equal">
            <button
              className="nv-card-choice"
              onClick={() => setDialog("memory")}
            >
              <FileText size={22} />
              <strong>Write</strong>
              <p>Add personal context directly.</p>
            </button>
            <button
              className="nv-card-choice"
              onClick={() => {
                setDialog("");
                fileRef.current?.click();
              }}
            >
              <Upload size={22} />
              <strong>Upload file</strong>
              <p>Import PDF, DOCX or a text source.</p>
            </button>
            <button className="nv-card-choice" onClick={() => setDialog("url")}>
              <ArrowRight size={22} />
              <strong>Public URL</strong>
              <p>Import a public HTTPS page.</p>
            </button>
            <Link className="nv-card-choice" href="/assistant">
              <Sparkles size={22} />
              <strong>Ask Kora</strong>
              <p>Prepare and review personal context.</p>
            </Link>
          </div>
        </Modal>
        <FormModal
          open={dialog === "url"}
          onClose={() => setDialog("")}
          title="Import URL source"
          description="The server checks public HTTPS addresses and enforces extraction limits."
          onSubmit={(b) => m.mutateAsync({ path: "/memory/url", body: b })}
        >
          <Field label="Source title" name="title" />
          <Field label="Public HTTPS URL" name="url" type="url" required />
        </FormModal>
      </>
    );
  if (section === "conversation")
    return (
      <>
        <Back href="/assistant">Back to Assistant</Back>
        <PageTitle
          title={conversation.data?.title || "Conversation"}
          action={<Button href="/workflows">Prepare an action</Button>}
        />
        <div className="nv-grid">
          <div>
            <DataState
              pending={conversation.isPending}
              error={conversation.error}
              retry={() => conversation.refetch()}
            >
              {conversation.data?.messages?.map((msg, i) => (
                <div key={i} className={`nv-chat-message ${msg.role}`}>
                  <strong>{msg.role === "user" ? "You" : "Kora"}</strong>
                  {msg.content}
                </div>
              ))}
            </DataState>
            {m.isPending && (
              <div className="nv-chat-message">
                <strong>Kora is working</strong>
                <Loader2 size={16} className="animate-spin" /> Preparing your
                response…
              </div>
            )}
            {composer}
          </div>
          <div className="nv-stack">
            <Card title="Active context">
              <DetailRows
                rows={[
                  ["Visibility", "Private conversation"],
                  ["Sources", "Your assigned portfolio"],
                  ["Action mode", "Preview before execution"],
                ]}
              />
            </Card>
            <Card title="Suggested next steps">
              <p className="nv-caption">
                Turn preparation into an accountable follow-up through a
                controlled workflow.
              </p>
              <Button href="/workflows">
                <Sparkles size={13} />
                Open workflows
              </Button>
            </Card>
          </div>
        </div>
      </>
    );
  return (
    <>
      <div className="nv-assistant-center">
        <span className="nv-caption">Kora Assistant</span>
        <div className="nv-orb" />
        <h1
          style={{
            fontSize: 22,
            fontWeight: 500,
            textAlign: "center",
            margin: "5px 0 8px",
          }}
        >
          How can I help with your sales today?
        </h1>
        <p className="nv-caption">
          Prepare, understand and move the right work forward.
        </p>
        {composer}
        <div className="nv-suggestions">
          {[
            "Prepare my follow-ups",
            "Show today's priorities",
            "Draft a customer follow-up",
            "Explain my commission",
          ].map((s) => (
            <button key={s} onClick={() => setDraft(s)}>
              <Sparkles
                size={11}
                style={{ display: "inline", marginRight: 5 }}
              />
              {s}
            </button>
          ))}
        </div>
        <p className="nv-caption">
          Kora uses your authorized commercial context. You stay in control.
        </p>
      </div>
      {conversations.data?.length ? (
        <Card title="Recent conversations">
          <div className="nv-grid-equal">
            {conversations.data.slice(0, 4).map((c) => (
              <Link
                className="nv-list-row"
                href={`/assistant/conversation/${c._id}`}
                key={c._id}
              >
                <MessageSquare size={15} />
                <div>
                  <strong>{c.title}</strong>
                  <small>{date(c.lastMessageAt)}</small>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
    </>
  );
}
