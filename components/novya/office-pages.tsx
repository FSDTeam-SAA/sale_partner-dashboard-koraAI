"use client";
import api from "@/lib/axios";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import {
  date,
  errorMessage,
  label,
  useSales,
  useSalesMutation,
  type Entity,
} from "@/lib/sales";
import { cellValue } from "@/lib/sheet";
import {
  Download,
  FileText,
  History,
  Plus,
  Presentation,
  Save,
  Share2,
  Sheet,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Back,
  Badge,
  Button,
  Card,
  DataState,
  Empty,
  Field,
  FormModal,
  Metric,
  Metrics,
  Modal,
  More,
  PageTitle,
  SearchBox,
  Table,
  Tabs,
} from "./ui";
const kinds: Record<string, string> = {
  docs: "doc",
  sheets: "sheet",
  presentations: "presentation",
};
export async function downloadFile(path: string, name: string) {
  try {
    const r = await api.get(`/sales-experience${path}`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    toast.error(errorMessage(e));
  }
}
export function OfficePage({
  section = "",
  id,
}: {
  section?: string;
  id?: string;
}) {
  const q = useSales<Entity[]>("/office"),
    record = useSales<Entity>(`/office/${id}`, !!id),
    m = useSalesMutation(),
    router = useRouter(),
    [term, setTerm] = useState(""),
    [view, setView] = useState("Grid"),
    [choice, setChoice] = useState(false),
    [create, setCreate] = useState(false),
    [share, setShare] = useState<Entity>(),
    [versions, setVersions] = useState<Entity>(),
    file = useRef<HTMLInputElement>(null);
  const kind = kinds[section],
    rows = (q.data || []).filter(
      (d) =>
        (!kind || d.kind === kind) &&
        d.title?.toLowerCase().includes(term.toLowerCase()),
    );
  const icon = (k?: string) =>
    k === "sheet" ? (
      <Sheet size={30} />
    ) : k === "presentation" ? (
      <Presentation size={30} />
    ) : (
      <FileText size={30} />
    );
  const href = (d: Entity) =>
    `/office/${d.kind === "sheet" ? "sheets" : d.kind === "presentation" ? "presentations" : "docs"}/${d._id}`;
  const actions = (d: Entity) => [
    { label: "Open editor", action: () => router.push(href(d)) },
    { label: "Share", action: () => setShare(d) },
    { label: "Version history", action: () => setVersions(d) },
    {
      label: "Export",
      action: () =>
        downloadFile(
          `/office/${d._id}/export`,
          `${d.title}.${d.kind === "sheet" ? "xlsx" : d.kind === "presentation" ? "pptx" : "docx"}`,
        ),
    },
  ];
  return (
    <>
      {id ? (
        <Back href={`/office/${section}`}>Back to {label(section)}</Back>
      ) : null}
      <PageTitle
        title={
          id
            ? record.data?.title || "Editor"
            : section === "transfers"
              ? "Imports & Exports"
              : kind
                ? label(section)
                : "Office"
        }
        description={
          id
            ? "Create with clarity. Your changes are versioned and access controlled."
            : section === "transfers"
              ? "Move permitted files between NOVYA and your tools."
              : "Create, organize and share the files that keep sales moving."
        }
        action={
          id ? (
            <Button onClick={() => setShare(record.data)}>
              <Share2 size={13} />
              Share
            </Button>
          ) : (
            <>
              <Button onClick={() => file.current?.click()}>
                <Upload size={13} />
                Import
              </Button>
              <Button onClick={() => setChoice(true)}>
                <Plus size={13} />
                Create file
              </Button>
            </>
          )
        }
      />
      <DataState
        pending={id ? record.isPending : q.isPending}
        error={id ? record.error : q.error}
        retry={() => (id ? record.refetch() : q.refetch())}
      >
        {id && record.data ? (
          <OfficeEditor
            key={`${id}:${record.data.__v}`}
            doc={record.data}
            onVersions={() => setVersions(record.data)}
            onShare={() => setShare(record.data)}
          />
        ) : section === "transfers" ? (
          <>
            <Metrics>
              <Metric
                label="Files imported"
                value={q.data?.filter((d) => d.importedFrom).length || 0}
              />
              <Metric
                label="Owned / shared files"
                value={q.data?.length || 0}
              />
              <Metric
                label="Drafts"
                value={q.data?.filter((d) => d.status === "draft").length || 0}
              />
              <Metric
                label="File types"
                value={new Set(q.data?.map((d) => d.kind)).size}
              />
            </Metrics>
            <Card title="File history">
              <Table
                headers={[
                  "File",
                  "Direction",
                  "Format",
                  "Status",
                  "Updated",
                  "Actions",
                ]}
              >
                {q.data?.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <strong>{d.title}</strong>
                      <small>{d.importedFrom || "NOVYA Office"}</small>
                    </td>
                    <td>{d.importedFrom ? "Import" : "Created"}</td>
                    <td>{label(d.kind)}</td>
                    <td>
                      <Badge>{d.status}</Badge>
                    </td>
                    <td>{date(d.updatedAt)}</td>
                    <td>
                      <Button
                        onClick={() =>
                          downloadFile(
                            `/office/${d._id}/export`,
                            `${d.title}.${d.kind === "sheet" ? "xlsx" : d.kind === "presentation" ? "pptx" : "docx"}`,
                          )
                        }
                      >
                        <Download size={12} />
                        Export
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
              {!q.data?.length && (
                <Empty
                  title="No file activity yet"
                  action={
                    <Button onClick={() => file.current?.click()}>
                      Import a file
                    </Button>
                  }
                />
              )}
            </Card>
          </>
        ) : (
          <>
            {!section && (
              <Metrics>
                <Metric label="All files" value={q.data?.length || 0} />
                <Metric
                  label="Documents"
                  value={q.data?.filter((d) => d.kind === "doc").length || 0}
                />
                <Metric
                  label="Sheets"
                  value={q.data?.filter((d) => d.kind === "sheet").length || 0}
                />
                <Metric
                  label="Presentations"
                  value={
                    q.data?.filter((d) => d.kind === "presentation").length || 0
                  }
                />
              </Metrics>
            )}
            <div className="nv-toolbar">
              <SearchBox
                value={term}
                onChange={setTerm}
                placeholder="Search files..."
              />
              <Tabs items={["Grid", "List"]} active={view} onChange={setView} />
            </div>
            <Card
              title={kind ? `Your ${section}` : "Recent files"}
              action={<span className="nv-caption">{rows.length} files</span>}
            >
              {view === "Grid" ? (
                <div className="nv-file-grid">
                  {rows.map((d) => (
                    <div className="nv-file-card" key={d._id}>
                      <Link href={href(d)}>
                        <div className="nv-file-preview">{icon(d.kind)}</div>
                        <div style={{ padding: 15 }}>
                          <h3>{d.title}</h3>
                          <p>
                            {label(d.kind)} · Updated {date(d.updatedAt)}
                          </p>
                          <Badge>{d.status}</Badge>
                        </div>
                      </Link>
                      <More items={actions(d)} />
                    </div>
                  ))}
                </div>
              ) : (
                <Table headers={["File", "Type", "Status", "Modified", ""]}>
                  {rows.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <Link href={href(d)}>
                          <strong>{d.title}</strong>
                        </Link>
                      </td>
                      <td>{label(d.kind)}</td>
                      <td>
                        <Badge>{d.status}</Badge>
                      </td>
                      <td>{date(d.updatedAt)}</td>
                      <td>
                        <More items={actions(d)} />
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
              {!rows.length && (
                <Empty
                  title="Room for your next great idea"
                  description="Create a document, spreadsheet or presentation for your commercial work."
                  action={
                    <Button onClick={() => setChoice(true)}>
                      Create your first file
                    </Button>
                  }
                />
              )}
            </Card>
          </>
        )}
      </DataState>
      <input
        type="file"
        ref={file}
        hidden
        accept=".txt,.md,.csv,.json,.pdf,.docx,.xlsx,.pptx"
        onChange={async (e) => {
          const value = e.target.files?.[0];
          if (!value) return;
          const form = new FormData();
          form.append("file", value);
          const d = await m.mutateAsync({ path: "/office/import", body: form });
          toast.success("File imported");
          router.push(href(d));
        }}
      />
      <Modal
        open={choice}
        onClose={() => setChoice(false)}
        title="Create a new file"
        description="Choose how you want to start. Your work stays in the canonical Office file."
      >
        <div className="nv-grid-equal">
          <button
            className="nv-card-choice"
            onClick={() => {
              setChoice(false);
              setCreate(true);
            }}
          >
            <FileText size={25} />
            <strong>Start manually</strong>
            <p>Open the dedicated editor and build your file directly.</p>
            <span className="nv-caption">Start creating →</span>
          </button>
          <Link
            className="nv-card-choice"
            href="/assistant?prompt=Help%20me%20draft%20a%20sales%20document"
          >
            <Sparkles size={25} />
            <strong>Create with Kora</strong>
            <p>
              Prepare useful content in your private Assistant, then save it to
              Office.
            </p>
            <span className="nv-caption">Open Assistant →</span>
          </Link>
        </div>
      </Modal>
      <FormModal
        open={create}
        onClose={() => setCreate(false)}
        title="Create Office file"
        onSubmit={async (b) => {
          const d = await m.mutateAsync({
            path: "/office",
            body: {
              ...b,
              content:
                b.kind === "sheet"
                  ? {
                      cells: Array.from({ length: 14 }, () =>
                        Array(6).fill(""),
                      ),
                    }
                  : b.kind === "presentation"
                    ? { slides: [{ title: b.title, body: "" }] }
                    : { text: "" },
            },
          });
          router.push(href(d));
        }}
      >
        <Field label="Title" name="title" required />
        <Field
          label="File type"
          name="kind"
          defaultValue={kind || "doc"}
          options={[
            { value: "doc", label: "Document" },
            { value: "sheet", label: "Spreadsheet" },
            { value: "presentation", label: "Presentation" },
          ]}
        />
      </FormModal>
      <FormModal
        open={!!share}
        onClose={() => setShare(undefined)}
        title="Sharing & permissions"
        description="Share with an active staff member. Only the file owner can change access."
        onSubmit={(b) =>
          m.mutateAsync({
            path: `/office/${share?._id}/share`,
            method: "put",
            body: b,
          })
        }
      >
        <Field label="Staff email" name="email" type="email" required />
        <Field
          label="Permission"
          name="permission"
          defaultValue="view"
          options={["view", "comment", "edit"].map((v) => ({
            value: v,
            label: label(v),
          }))}
        />
      </FormModal>
      <Modal
        open={!!versions}
        onClose={() => setVersions(undefined)}
        title="Version history"
        description="Restore creates a new version and preserves the existing history."
        wide
      >
        <Table headers={["Version", "Saved", "Action"]}>
          {versions?.versions
            ?.slice()
            .reverse()
            .map((v, i) => (
              <tr key={i}>
                <td>v{v.version}</td>
                <td>{date(v.at)}</td>
                <td>
                  <Button
                    disabled={m.isPending}
                    onClick={async () => {
                      await m.mutateAsync({
                        path: `/office/${versions._id}`,
                        method: "patch",
                        body: { revision: versions.__v, content: v.content },
                      });
                      setVersions(undefined);
                      toast.success("Version restored");
                    }}
                  >
                    Restore this version
                  </Button>
                </td>
              </tr>
            ))}
        </Table>
        {!versions?.versions?.length && (
          <Empty
            title="No previous versions"
            description="Version history begins with your first saved revision."
          />
        )}
      </Modal>
    </>
  );
}
function OfficeEditor({
  doc,
  onVersions,
  onShare,
}: {
  doc: Entity;
  onVersions: () => void;
  onShare: () => void;
}) {
  const original =
      typeof doc.content === "object"
        ? doc.content
        : { text: String(doc.content || "") },
    [text, setText] = useState(original.text || ""),
    [formatting, setFormatting] = useState({
      fontFamily: original.format?.fontFamily || "Arial",
      fontSize: original.format?.fontSize || 13,
      bold: !!original.format?.bold,
      italic: !!original.format?.italic,
      underline: !!original.format?.underline,
      align: original.format?.align || "left",
    }),
    [cells, setCells] = useState<string[][]>(
      original.cells || Array.from({ length: 14 }, () => Array(6).fill("")),
    ),
    [slides, setSlides] = useState(
      original.slides || [{ title: doc.title || "", body: "" }],
    ),
    [slide, setSlide] = useState(0),
    [selectedCell, setSelectedCell] = useState(""),
    [activeCell, setActiveCell] = useState(""),
    m = useSalesMutation();
  const columnCount = Math.min(
    50,
    Math.max(6, ...cells.map((row) => row.length)),
  );
  const columnName = (index: number) => {
    let name = "";
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
      name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
    return name;
  };
  const save = async () => {
    await m.mutateAsync({
      path: `/office/${doc._id}`,
      method: "patch",
      body: {
        revision: doc.__v || 0,
        content:
          doc.kind === "sheet"
            ? { cells }
            : doc.kind === "presentation"
              ? { slides }
              : { text, format: formatting },
      },
    });
    toast.success("File saved");
  };
  return (
    <>
      <div className="nv-toolbar">
        <Badge>{doc.status}</Badge>
        <span className="nv-caption">Version {(doc.__v || 0) + 1}</span>
        <div style={{ flex: 1 }} />
        <Button onClick={onVersions}>
          <History size={13} />
          Versions
        </Button>
        <Button onClick={onShare}>
          <Share2 size={13} />
          Share
        </Button>
        <Button
          onClick={() =>
            downloadFile(
              `/office/${doc._id}/export`,
              `${doc.title}.${doc.kind === "sheet" ? "xlsx" : doc.kind === "presentation" ? "pptx" : "docx"}`,
            )
          }
        >
          <Download size={13} />
          Export
        </Button>
        <Button primary disabled={m.isPending} onClick={save}>
          <Save size={13} />
          Save changes
        </Button>
      </div>
      {doc.kind === "sheet" ? (
        <Card>
          <div className="nv-toolbar">
            <span className="nv-badge">
              {activeCell
                ? `${columnName(Number(activeCell.split(":")[1]))}${Number(activeCell.split(":")[0]) + 1}`
                : "A1"}
            </span>
            <span className="nv-caption">ƒx</span>
            <input
              className="nv-input"
              readOnly
              value={selectedCell}
              aria-label="Selected cell formula"
            />
          </div>
          <div className="nv-table-scroll">
            <table className="nv-sheet">
              <thead>
                <tr>
                  <th />
                  {Array.from({ length: columnCount }, (_, c) => (
                    <th key={c}>{columnName(c)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cells.map((row, r) => (
                  <tr key={r}>
                    <th>{r + 1}</th>
                    {Array.from({ length: columnCount }, (_, c) => (
                      <td key={c}>
                        <input
                          aria-label={`${columnName(c)}${r + 1}`}
                          value={
                            activeCell === `${r}:${c}`
                              ? cells[r][c] || ""
                              : cellValue(cells, r, c)
                          }
                          onFocus={() => {
                            setActiveCell(`${r}:${c}`);
                            setSelectedCell(cells[r][c] || "");
                          }}
                          onBlur={() => setActiveCell("")}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSelectedCell(value);
                            setCells(
                              cells.map((row, i) =>
                                i === r
                                  ? Array.from(
                                      { length: columnCount },
                                      (_, j) =>
                                        j === c ? value : row[j] || "",
                                    )
                                  : row,
                              ),
                            );
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="nv-form-actions">
            <Button
              disabled={cells.length >= 1000}
              onClick={() => setCells([...cells, Array(columnCount).fill("")])}
            >
              <Plus size={12} />
              Add row
            </Button>
            <Button
              disabled={columnCount >= 50}
              onClick={() =>
                setCells(
                  cells.map((row) => [
                    ...Array.from(
                      { length: columnCount },
                      (_, c) => row[c] || "",
                    ),
                    "",
                  ]),
                )
              }
            >
              <Plus size={12} />
              Add column
            </Button>
          </div>
          <p className="nv-caption">
            Formulas: arithmetic, cell references and SUM(A1:B5). Formula errors
            and cycles remain visible.
          </p>
        </Card>
      ) : doc.kind === "presentation" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "150px minmax(0,1fr)",
            gap: 18,
          }}
        >
          <Card>
            <div className="nv-stack">
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  style={{
                    padding: 12,
                    border: `1px solid ${slide === i ? "#7985f4" : "#35425b"}`,
                    background: "#182135",
                    borderRadius: 5,
                    textAlign: "left",
                    fontSize: 10,
                    aspectRatio: "16/9",
                  }}
                >
                  {i + 1}. {s.title || "Untitled slide"}
                </button>
              ))}
              <Button
                onClick={() => {
                  setSlides([...slides, { title: "New slide", body: "" }]);
                  setSlide(slides.length);
                }}
              >
                <Plus size={12} />
                Add slide
              </Button>
            </div>
          </Card>
          <div>
            <div className="nv-slide">
              <div className="nv-eyebrow">NOVYA</div>
              <input
                aria-label="Slide title"
                value={slides[slide]?.title || ""}
                onChange={(e) =>
                  setSlides(
                    slides.map((s, i) =>
                      i === slide ? { ...s, title: e.target.value } : s,
                    ),
                  )
                }
              />
              <textarea
                aria-label="Slide body"
                value={slides[slide]?.body || ""}
                onChange={(e) =>
                  setSlides(
                    slides.map((s, i) =>
                      i === slide ? { ...s, body: e.target.value } : s,
                    ),
                  )
                }
              />
            </div>
            <div className="nv-form-actions">
              <Button
                disabled={slides.length === 1}
                onClick={() => {
                  setSlides(slides.filter((_, i) => i !== slide));
                  setSlide(Math.max(0, slide - 1));
                }}
              >
                <Trash2 size={12} />
                Remove slide
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="nv-toolbar">
            <select
              className="nv-input"
              style={{ width: 130 }}
              aria-label="Document font"
              value={formatting.fontFamily}
              onChange={(e) =>
                setFormatting({ ...formatting, fontFamily: e.target.value })
              }
            >
              {["Arial", "Georgia", "Calibri", "Aptos", "Inter"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <select
              className="nv-input"
              style={{ width: 75 }}
              aria-label="Document font size"
              value={formatting.fontSize}
              onChange={(e) =>
                setFormatting({
                  ...formatting,
                  fontSize: Number(e.target.value),
                })
              }
            >
              {[10, 11, 12, 13, 14, 16, 18, 24, 28, 32].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <Button
              ariaLabel="Bold"
              onClick={() =>
                setFormatting({ ...formatting, bold: !formatting.bold })
              }
              primary={formatting.bold}
            >
              <Bold size={13} />
            </Button>
            <Button
              ariaLabel="Italic"
              onClick={() =>
                setFormatting({ ...formatting, italic: !formatting.italic })
              }
              primary={formatting.italic}
            >
              <Italic size={13} />
            </Button>
            <Button
              ariaLabel="Underline"
              onClick={() =>
                setFormatting({
                  ...formatting,
                  underline: !formatting.underline,
                })
              }
              primary={formatting.underline}
            >
              <Underline size={13} />
            </Button>
            <Button
              ariaLabel="Align left"
              onClick={() => setFormatting({ ...formatting, align: "left" })}
            >
              <AlignLeft size={13} />
            </Button>
            <Button
              ariaLabel="Align center"
              onClick={() => setFormatting({ ...formatting, align: "center" })}
            >
              <AlignCenter size={13} />
            </Button>
            <Button
              ariaLabel="Align right"
              onClick={() => setFormatting({ ...formatting, align: "right" })}
            >
              <AlignRight size={13} />
            </Button>
            <div style={{ flex: 1 }} />
            <span className="nv-caption">
              {text.trim() ? text.trim().split(/\s+/).length : 0} words
            </span>
          </div>
          <div className="nv-editor-paper">
            <h2 style={{ fontSize: 28, marginBottom: 20 }}>{doc.title}</h2>
            <textarea
              aria-label="Document content"
              style={{
                fontFamily: formatting.fontFamily,
                fontSize: formatting.fontSize,
                fontWeight: formatting.bold ? 700 : 400,
                fontStyle: formatting.italic ? "italic" : "normal",
                textDecoration: formatting.underline ? "underline" : "none",
                textAlign: formatting.align,
              }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start writing your document…"
            />
          </div>
        </>
      )}
    </>
  );
}
