"use client";
import api from "@/lib/axios";
import {
  date,
  label,
  useSales,
  useSalesMutation,
  type Entity,
} from "@/lib/sales";
import {
  Check,
  Download,
  FileText,
  Image as ImageIcon,
  Layers,
  Link2,
  Palette,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { downloadFile } from "./office-pages";
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
  Progress,
  SearchBox,
  Select,
  Table,
  Tabs,
  Timeline,
} from "./ui";
const bytes = (size = 0) =>
  size > 1024 * 1024
    ? `${(size / 1024 / 1024).toFixed(1)} MB`
    : `${Math.ceil(size / 1024)} KB`;
export function AssetPreview({
  asset,
  large = false,
}: {
  asset: Entity;
  large?: boolean;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!asset.file?.mime?.startsWith("image/")) return;
    let active = true,
      objectUrl = "";
    api
      .get(`/sales-experience/assets/${asset._id}/content`, {
        responseType: "blob",
      })
      .then((r) => {
        objectUrl = URL.createObjectURL(r.data);
        if (active) setUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [asset._id, asset.updatedAt, asset.file?.mime]);
  return (
    <div
      className={`nv-file-preview ${asset.type || "image"}`}
      style={large ? { height: 310 } : undefined}
    >
      {url ? (
        <NextImage
          unoptimized
          width={800}
          height={400}
          src={url}
          alt={asset.name || "Media asset"}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : asset.type === "document" ? (
        <FileText size={large ? 55 : 33} />
      ) : (
        <ImageIcon size={large ? 55 : 33} />
      )}
    </div>
  );
}
export function MediaPage({
  section = "",
  id,
  detailTab,
}: {
  section?: string;
  id?: string;
  detailTab?: string;
}) {
  const assets = useSales<Entity[]>("/assets"),
    collections = useSales<Entity[]>("/collections"),
    kits = useSales<Entity[]>("/brand-kits"),
    m = useSalesMutation(),
    router = useRouter(),
    [term, setTerm] = useState(""),
    [filter, setFilter] = useState("all"),
    [tab, setTab] = useState(detailTab || "Overview"),
    [dialog, setDialog] = useState(""),
    [selected, setSelected] = useState<Entity>(),
    [picked, setPicked] = useState<File[]>([]),
    [step, setStep] = useState(0),
    [uploading, setUploading] = useState(false),
    [selection, setSelection] = useState<string[]>([]),
    upload = useRef<HTMLInputElement>(null);
  const all = assets.data || [],
    asset =
      section === "library" && id ? all.find((a) => a._id === id) : undefined,
    collection =
      section === "collections" && id
        ? collections.data?.find((c) => c._id === id)
        : undefined,
    kit =
      section === "brand-assets" && id
        ? kits.data?.find((k) => k._id === id)
        : undefined;
  let rows = all.filter(
    (a) =>
      a.name?.toLowerCase().includes(term.toLowerCase()) &&
      (filter === "all" || a.type === filter),
  );
  if (collection) rows = rows.filter((a) => collection.assets?.includes(a._id));
  if (section === "storage" && tab === "Duplicates")
    rows = rows.filter(
      (a) =>
        a.checksum && all.filter((b) => b.checksum === a.checksum).length > 1,
    );
  const used = all.reduce((s, a) => s + (a.file?.sizeBytes || 0), 0);
  const actions = (a: Entity) =>
    [
      {
        label: "Open asset",
        action: () => router.push(`/media/library/${a._id}`),
      },
      {
        label: "Download",
        action: () =>
          downloadFile(`/assets/${a._id}/content`, a.name || "asset"),
      },
      {
        label: "Replace asset",
        action: () => {
          setSelected(a);
          setDialog("replace");
        },
      },
      {
        label: "Edit details",
        action: () => {
          setSelected(a);
          setDialog("edit");
        },
      },
      {
        label: "Ask Kora",
        action: () =>
          router.push(
            `/assistant?prompt=${encodeURIComponent(`Help me use this approved sales asset: ${a.name}.`)}`,
          ),
      },
    ].filter(
      (item) =>
        a.canEdit || !["Replace asset", "Edit details"].includes(item.label),
    );
  const grid = (
    <div className="nv-file-grid">
      {rows.map((a) => (
        <div className="nv-file-card" key={a._id}>
          <Link href={`/media/library/${a._id}`}>
            <AssetPreview asset={a} />
            <div style={{ padding: 14 }}>
              <h3>{a.name}</h3>
              <p>
                {label(a.type)} · {bytes(a.file?.sizeBytes)}
              </p>
              <Badge>
                {a.source === "brand_kit"
                  ? "Approved brand asset"
                  : "My upload"}
              </Badge>
            </div>
          </Link>
          <More items={actions(a)} />
        </div>
      ))}
    </div>
  );
  async function doUpload() {
    setUploading(true);
    try {
      for (const f of picked) {
        const b = new FormData();
        b.append("file", f);
        await m.mutateAsync({ path: "/assets", body: b });
      }
      setStep(2);
      setPicked([]);
      toast.success("Files added to your library");
    } finally {
      setUploading(false);
    }
  }
  return (
    <>
      {id && <Back href={`/media/${section}`}>Back to {label(section)}</Back>}
      <PageTitle
        title={
          asset
            ? asset.name || "Asset"
            : collection
              ? collection.name || "Collection"
              : kit
                ? kit.name || "Brand kit"
                : section === "brand-assets"
                  ? "Brand Assets"
                  : section === "storage"
                    ? "Storage"
                    : section === "upload"
                      ? "Upload & Import"
                      : section === "collections"
                        ? "Collections"
                        : section === "library"
                          ? "Media Library"
                          : "Media"
        }
        description={
          asset
            ? "Review the approved content, source, usage and versions."
            : kit
              ? "The approved NOVYA brand system for your sales materials."
              : "Organize your approved assets and create consistent sales materials."
        }
        action={
          asset ? (
            <>
              <Button
                onClick={() =>
                  downloadFile(
                    `/assets/${asset._id}/content`,
                    asset.name || "asset",
                  )
                }
              >
                <Download size={13} />
                Download
              </Button>
              <Button
                href={`/assistant?prompt=${encodeURIComponent(`Help me use the sales asset ${asset.name}.`)}`}
              >
                <Sparkles size={13} />
                Open with Kora
              </Button>
              <More items={actions(asset)} />
            </>
          ) : collection ? (
            <Button
              disabled={!collection.canManage}
              onClick={() => setDialog("share")}
            >
              <Link2 size={13} />
              Share
            </Button>
          ) : (
            <Button
              onClick={() =>
                section === "collections"
                  ? setDialog("collection")
                  : setDialog("create")
              }
            >
              <Plus size={13} />
              {section === "collections" ? "Create collection" : "Add media"}
            </Button>
          )
        }
      />
      <DataState
        pending={assets.isPending || collections.isPending || kits.isPending}
        error={assets.error || collections.error || kits.error}
        retry={() => {
          assets.refetch();
          collections.refetch();
          kits.refetch();
        }}
      >
        {asset ? (
          <>
            <Tabs
              items={["Overview", "Usage", "Versions"]}
              active={tab}
              onChange={setTab}
            />
            <div className="nv-grid">
              <div className="nv-stack">
                <Card
                  title={
                    tab === "Usage"
                      ? "Used across NOVYA"
                      : tab === "Versions"
                        ? "Version history"
                        : "Asset preview"
                  }
                >
                  {tab === "Overview" ? (
                    <>
                      <AssetPreview asset={asset} large />
                      <h2 style={{ fontSize: 24, margin: "20px 0 8px" }}>
                        {asset.name}
                      </h2>
                      <p className="nv-caption">
                        {asset.tags?.join(" · ") ||
                          "Add descriptive tags to make this asset easier to find."}
                      </p>
                    </>
                  ) : tab === "Usage" ? (
                    <>
                      {asset.usage?.length ? (
                        asset.usage.map((u, i) => (
                          <div className="nv-list-row" key={i}>
                            <FileText size={15} />
                            <div>
                              <strong>{u.label}</strong>
                              <small>
                                {u.type} · {u.ref}
                              </small>
                            </div>
                          </div>
                        ))
                      ) : (
                        <Empty
                          title="No linked placements yet"
                          description="Usage appears when this asset is linked from a canonical file or record."
                        />
                      )}
                    </>
                  ) : (
                    <Timeline
                      items={[
                        {
                          title: "Current version",
                          description: asset.name,
                          date: date(asset.updatedAt),
                        },
                        ...(asset.versions || []).map((v, i) => ({
                          title: `Previous version ${i + 1}`,
                          description: v.note,
                          date: date(v.at),
                        })),
                      ]}
                    />
                  )}
                </Card>
                <Card title="Rights & usage">
                  <DetailRows
                    rows={[
                      ["Source", label(asset.source)],
                      [
                        "Visibility",
                        asset.source === "brand_kit"
                          ? "Approved internal asset"
                          : "Personal library",
                      ],
                      ["File type", asset.file?.mime],
                      ["Tags", asset.tags?.join(", ") || "—"],
                    ]}
                  />
                </Card>
              </div>
              <div className="nv-stack">
                <Card title="Asset details">
                  <DetailRows
                    rows={[
                      ["Name", asset.name],
                      ["Type", label(asset.type)],
                      ["File size", bytes(asset.file?.sizeBytes)],
                      ["Uploaded", date(asset.createdAt)],
                      ["Modified", date(asset.updatedAt)],
                      ["Versions", (asset.versions?.length || 0) + 1],
                    ]}
                  />
                  <Button
                    disabled={!asset.canEdit}
                    onClick={() => {
                      setSelected(asset);
                      setDialog("edit");
                    }}
                  >
                    Edit details
                  </Button>
                </Card>
                <Card title="Version controls">
                  <p className="nv-caption">
                    Replacement retains a version reference. Existing usage
                    remains attached to the same asset.
                  </p>
                  <Button
                    disabled={!asset.canEdit}
                    onClick={() => {
                      setSelected(asset);
                      setDialog("replace");
                    }}
                  >
                    Replace asset
                  </Button>
                </Card>
              </div>
            </div>
          </>
        ) : kit ? (
          <>
            <Tabs
              items={[
                "Overview",
                "Logos",
                "Colors",
                "Typography",
                "Voice & Tone",
              ]}
              active={tab}
              onChange={setTab}
            />
            <div className="nv-grid">
              <div className="nv-stack">
                <Card
                  title={
                    tab === "Overview"
                      ? "Brand foundations"
                      : tab === "Logos"
                        ? "Approved logo variants"
                        : tab === "Colors"
                          ? "Core color palette"
                          : tab === "Typography"
                            ? "Font families"
                            : "Voice principles"
                  }
                >
                  {tab === "Logos" || tab === "Overview" ? (
                    <div className="nv-file-grid">
                      {kit.logos?.map((l, i) => (
                        <div className="nv-file-card" key={i}>
                          <div className="nv-file-preview">
                            <NextImage
                              unoptimized
                              width={800}
                              height={400}
                              src={l.url}
                              alt={l.label}
                              style={{ maxWidth: "75%", maxHeight: 60 }}
                            />
                          </div>
                          <div>
                            <h3>{l.label}</h3>
                            <p>{l.variant}</p>
                          </div>
                        </div>
                      ))}
                      {!kit.logos?.length && (
                        <p className="nv-caption">
                          Approved logo variants are managed by your brand
                          owner.
                        </p>
                      )}
                    </div>
                  ) : tab === "Colors" ? (
                    <div className="nv-brand-colors">
                      {kit.colors?.map((c) => (
                        <div key={c.hex}>
                          <i style={{ background: c.hex }} />
                          <p>
                            {c.name}
                            <br />
                            {c.hex}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : tab === "Typography" ? (
                    <>
                      <DetailRows
                        rows={[
                          ["Primary", kit.typography?.heading || "—"],
                          ["Body", kit.typography?.body || "—"],
                        ]}
                      />
                      <h2
                        style={{
                          fontFamily: kit.typography?.heading,
                          fontSize: 34,
                          margin: "35px 0",
                        }}
                      >
                        Build with clarity.
                      </h2>
                      <p
                        className="nv-article"
                        style={{ fontFamily: kit.typography?.body }}
                      >
                        Simple. Direct. Consistent across every customer
                        conversation.
                      </p>
                    </>
                  ) : (
                    <>
                      <DetailRows
                        rows={[
                          ["Tone", kit.voice?.tone],
                          ["Personality", kit.voice?.personality?.join(", ")],
                        ]}
                      />
                      <p className="nv-note">{kit.voice?.sample}</p>
                      {kit.voice?.dos?.map((s) => (
                        <div className="nv-list-row" key={s}>
                          <Check size={14} />
                          <strong>{s}</strong>
                        </div>
                      ))}
                    </>
                  )}
                </Card>
                {tab === "Overview" && (
                  <Card title="Approved palette">
                    <div className="nv-brand-colors">
                      {kit.colors?.map((c) => (
                        <div key={c.hex}>
                          <i style={{ background: c.hex }} />
                          <p>
                            {c.name} · {c.hex}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
              <div className="nv-stack">
                <Card title="Brand context">
                  <DetailRows
                    rows={[
                      ["Status", "Approved brand system"],
                      ["Logos", kit.logos?.length || 0],
                      ["Colors", kit.colors?.length || 0],
                      ["Heading font", kit.typography?.heading],
                      ["Body font", kit.typography?.body],
                    ]}
                  />
                </Card>
                <Card title="Need a brand update?">
                  <p className="nv-caption">
                    Request a review from the accountable brand owner.
                  </p>
                  <Button onClick={() => setDialog("brand-request")}>
                    Request changes
                  </Button>
                </Card>
              </div>
            </div>
          </>
        ) : section === "upload" ? (
          <>
            <div className="nv-stepper">
              {["Choose files", "Review details", "Save to library"].map(
                (s, i) => (
                  <div className={i === step ? "active" : ""} key={s}>
                    <span>{i < step ? <Check size={12} /> : i + 1}</span>
                    {s}
                  </div>
                ),
              )}
            </div>
            <div className="nv-grid">
              <Card
                title={
                  step === 2
                    ? "Upload complete"
                    : step === 1
                      ? "Review your files"
                      : "Upload files"
                }
              >
                {step === 2 ? (
                  <div className="nv-completion">
                    <div className="nv-success-icon">
                      <Check size={28} />
                    </div>
                    <h2>Your library is up to date</h2>
                    <Button href="/media/library">Open Media Library</Button>
                  </div>
                ) : (
                  <>
                    <div
                      className="nv-upload-zone"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        setPicked(Array.from(e.dataTransfer.files));
                        setStep(1);
                      }}
                    >
                      <Upload size={35} />
                      <strong>Drop files here</strong>
                      <p>
                        PNG, JPG, WebP, PDF, TXT and CSV · up to 25 MB per file
                      </p>
                      <input
                        type="file"
                        multiple
                        accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.csv"
                        aria-label="Choose media files"
                        onChange={(e) => {
                          setPicked(Array.from(e.target.files || []));
                          setStep(1);
                        }}
                      />
                    </div>
                    {picked.map((f, i) => (
                      <div className="nv-list-row" key={i}>
                        <FileText size={16} />
                        <div>
                          <strong>{f.name}</strong>
                          <small>{f.type}</small>
                        </div>
                        <span>{bytes(f.size)}</span>
                        <Badge>{uploading ? "Uploading" : "Ready"}</Badge>
                      </div>
                    ))}
                    <div className="nv-form-actions">
                      <Button
                        onClick={() => {
                          setPicked([]);
                          setStep(0);
                        }}
                      >
                        Clear selection
                      </Button>
                      <Button
                        primary
                        disabled={!picked.length || uploading}
                        onClick={doUpload}
                      >
                        {uploading ? "Uploading…" : "Save to library"}
                      </Button>
                    </div>
                  </>
                )}
              </Card>
              <Card title="Upload settings">
                <DetailRows
                  rows={[
                    ["Destination", "My Media Library"],
                    ["Visibility", "Personal"],
                    ["Source", "Local upload"],
                    ["Versions", "Preserved on replacement"],
                  ]}
                />
                <p className="nv-caption">
                  Review your file selection before uploading. Shared company
                  brand assets remain managed by the brand owner.
                </p>
              </Card>
            </div>
          </>
        ) : section === "collections" && !id ? (
          <>
            <Metrics>
              <Metric
                label="Collections"
                value={collections.data?.length || 0}
              />
              <Metric label="Assets" value={all.length} />
              <Metric
                label="Shared with me"
                value={
                  collections.data?.filter((c) => c.members?.length).length || 0
                }
              />
              <Metric label="Library size" value={bytes(used)} />
            </Metrics>
            <div className="nv-file-grid">
              {collections.data?.map((c) => (
                <div className="nv-file-card" key={c._id}>
                  <Link href={`/media/collections/${c._id}`}>
                    <div className="nv-file-preview image">
                      <Layers size={35} />
                    </div>
                    <div style={{ padding: 16 }}>
                      <h3>{c.name}</h3>
                      <p>
                        {c.assets?.length || 0} assets · {label(c.visibility)}
                      </p>
                    </div>
                  </Link>
                  <More
                    items={[
                      {
                        label: "Open collection",
                        action: () =>
                          router.push(`/media/collections/${c._id}`),
                      },
                    ]}
                  />
                </div>
              ))}
            </div>
            {!collections.data?.length && (
              <Card>
                <Empty
                  title="Bring related assets together"
                  description="Create a collection for a campaign, territory or customer conversation."
                  action={
                    <Button onClick={() => setDialog("collection")}>
                      Create collection
                    </Button>
                  }
                />
              </Card>
            )}
          </>
        ) : section === "brand-assets" && !id ? (
          <>
            <Metrics>
              <Metric label="Brand kits" value={kits.data?.length || 0} />
              <Metric
                label="Approved logos"
                value={
                  kits.data?.reduce((s, k) => s + (k.logos?.length || 0), 0) ||
                  0
                }
              />
              <Metric
                label="Color tokens"
                value={
                  kits.data?.reduce((s, k) => s + (k.colors?.length || 0), 0) ||
                  0
                }
              />
              <Metric
                label="Scope"
                value="Sales"
                detail="Approved commercial materials"
              />
            </Metrics>
            <div className="nv-file-grid">
              {kits.data?.map((k) => (
                <Link
                  className="nv-file-card"
                  key={k._id}
                  href={`/media/brand-assets/${k._id}`}
                >
                  <div className="nv-file-preview">
                    <Palette size={40} />
                  </div>
                  <div>
                    <h3>{k.name}</h3>
                    <p>
                      {k.colors?.length || 0} colors · {k.logos?.length || 0}{" "}
                      logos
                    </p>
                    <Badge>Approved</Badge>
                  </div>
                </Link>
              ))}
            </div>
            {!kits.data?.length && (
              <Card>
                <Empty
                  title="Approved brand kits will appear here"
                  description="Your brand owner publishes logos, colors, typography and tone guidance."
                />
              </Card>
            )}
          </>
        ) : (
          <>
            {!collection && (
              <Metrics>
                <Metric label="Total assets" value={all.length} />
                <Metric label="Storage used" value={bytes(used)} />
                <Metric
                  label="Images"
                  value={all.filter((a) => a.type === "image").length}
                />
                <Metric
                  label="Collections"
                  value={collections.data?.length || 0}
                />
              </Metrics>
            )}
            {section === "storage" && (
              <Tabs
                items={["Overview", "Management", "Duplicates"]}
                active={tab}
                onChange={setTab}
              />
            )}
            <div className="nv-toolbar">
              <SearchBox
                value={term}
                onChange={setTerm}
                placeholder="Search assets by name..."
              />
              <Select
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "All types" },
                  { value: "image", label: "Images" },
                  { value: "document", label: "Documents" },
                ]}
              />
              {collection && (
                <Button
                  disabled={!collection.canManage}
                  onClick={() => {
                    setSelection(collection.assets || []);
                    setDialog("add-assets");
                  }}
                >
                  Add assets
                </Button>
              )}
            </div>
            {section === "storage" ? (
              <div className="nv-grid">
                <Card
                  title={
                    tab === "Duplicates"
                      ? "Duplicate groups"
                      : tab === "Management"
                        ? "Manage your stored assets"
                        : "Storage usage"
                  }
                >
                  {tab === "Overview" ? (
                    <>
                      {["image", "document", "video", "audio"].map((type) => {
                        const size = all
                          .filter((a) => a.type === type)
                          .reduce((s, a) => s + (a.file?.sizeBytes || 0), 0);
                        return (
                          <div key={type} style={{ padding: "12px 0" }}>
                            <div className="nv-kpi-note">
                              <span>{label(type)}</span>
                              <span>{bytes(size)}</span>
                            </div>
                            <Progress value={used ? (size / used) * 100 : 0} />
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <Table headers={["Asset", "Type", "Size", "Updated", ""]}>
                      {rows.map((a) => (
                        <tr key={a._id}>
                          <td>
                            <Link href={`/media/library/${a._id}`}>
                              <strong>{a.name}</strong>
                            </Link>
                          </td>
                          <td>{a.type}</td>
                          <td>{bytes(a.file?.sizeBytes)}</td>
                          <td>{date(a.updatedAt)}</td>
                          <td>
                            <More items={actions(a)} />
                          </td>
                        </tr>
                      ))}
                    </Table>
                  )}
                  {!rows.length && (
                    <Empty
                      title={
                        tab === "Duplicates"
                          ? "No duplicate files"
                          : "Your library is empty"
                      }
                    />
                  )}
                </Card>
                <Card title="Storage health">
                  <DetailRows
                    rows={[
                      ["Assets", all.length],
                      ["Used", bytes(used)],
                      [
                        "Duplicate files",
                        all.filter(
                          (a) =>
                            a.checksum &&
                            all.filter((b) => b.checksum === a.checksum)
                              .length > 1,
                        ).length,
                      ],
                      ["File access", "Personal & approved assets"],
                    ]}
                  />
                  <p className="nv-caption">
                    Usage is calculated from the files visible in your library.
                    Global storage policy is managed centrally.
                  </p>
                </Card>
              </div>
            ) : (
              <Card
                title={
                  collection
                    ? "Collection assets"
                    : section === "library"
                      ? "Your media library"
                      : "Recent assets"
                }
              >
                {grid}
                {!rows.length && (
                  <Empty
                    title="Your next asset belongs here"
                    description="Upload a file or use an approved brand asset in your sales work."
                    action={<Button href="/media/upload">Upload media</Button>}
                  />
                )}
              </Card>
            )}
          </>
        )}
      </DataState>
      <Modal
        open={dialog === "create"}
        onClose={() => setDialog("")}
        title="Add media"
        description="Choose how you want to prepare your next sales asset."
      >
        <div className="nv-course-grid">
          {[
            ["Start manually", "/media/upload", Upload],
            [
              "Create with Kora",
              "/assistant?prompt=Help%20me%20prepare%20a%20sales%20asset",
              Sparkles,
            ],
            ["Use a template", "/media/brand-assets", Layers],
          ].map(([name, href, Icon]) => {
            const I = Icon as typeof Upload;
            return (
              <Link
                key={String(name)}
                className="nv-card-choice"
                href={String(href)}
                onClick={() => setDialog("")}
              >
                <I size={24} />
                <strong>{String(name)}</strong>
                <p>Prepare approved material for your commercial work.</p>
                <span className="nv-caption">Continue →</span>
              </Link>
            );
          })}
        </div>
      </Modal>
      <FormModal
        open={dialog === "collection"}
        onClose={() => setDialog("")}
        title="Create collection"
        onSubmit={(b) => m.mutateAsync({ path: "/collections", body: b })}
      >
        <Field label="Name" name="name" required />
        <Field label="Description" name="description" type="textarea" />
      </FormModal>
      <FormModal
        open={dialog === "share"}
        onClose={() => setDialog("")}
        title="Sharing & permissions"
        onSubmit={(b) =>
          m.mutateAsync({
            path: `/collections/${collection?._id}`,
            method: "patch",
            body: b,
          })
        }
      >
        <Field label="Staff email" name="email" type="email" required />
      </FormModal>
      <FormModal
        open={dialog === "edit"}
        onClose={() => setDialog("")}
        title="Edit asset details"
        onSubmit={(b) =>
          m.mutateAsync({
            path: `/assets/${selected?._id}`,
            method: "patch",
            body: {
              ...b,
              tags: b.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            },
          })
        }
      >
        <Field
          label="Name"
          name="name"
          defaultValue={selected?.name}
          required
        />
        <Field
          label="Tags (comma separated)"
          name="tags"
          defaultValue={selected?.tags?.join(", ")}
        />
        <Field label="Folder" name="folder" />
      </FormModal>
      <Modal
        open={dialog === "replace"}
        onClose={() => setDialog("")}
        title="Replace asset"
        description="Keep the same asset identity and retain the previous version."
      >
        <DetailRows
          rows={[
            ["Asset", selected?.name],
            ["Existing file", bytes(selected?.file?.sizeBytes)],
          ]}
        />
        <input
          ref={upload}
          type="file"
          aria-label="Replacement file"
          accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.csv"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const b = new FormData();
            b.append("file", f);
            await m.mutateAsync({
              path: `/assets/${selected?._id}/replace`,
              body: b,
            });
            setDialog("");
            toast.success("Asset replaced");
          }}
        />
      </Modal>
      <Modal
        open={dialog === "add-assets"}
        onClose={() => setDialog("")}
        title="Add assets to collection"
      >
        <div className="nv-search-results">
          {all
            .filter((a) => a.canEdit || a.source === "brand_kit")
            .map((a) => (
              <label className="nv-list-row" key={a._id}>
                <input
                  type="checkbox"
                  checked={selection.includes(a._id)}
                  onChange={(e) =>
                    setSelection(
                      e.target.checked
                        ? [...selection, a._id]
                        : selection.filter((s) => s !== a._id),
                    )
                  }
                />
                <div>
                  <strong>{a.name}</strong>
                  <small>{label(a.type)}</small>
                </div>
              </label>
            ))}
        </div>
        <div className="nv-modal-footer">
          <Button onClick={() => setDialog("")}>Cancel</Button>
          <Button
            primary
            onClick={async () => {
              await m.mutateAsync({
                path: `/collections/${collection?._id}`,
                method: "patch",
                body: { assets: selection },
              });
              setDialog("");
            }}
          >
            Save assets
          </Button>
        </div>
      </Modal>
      <FormModal
        open={dialog === "brand-request"}
        onClose={() => setDialog("")}
        title="Request brand changes"
        onSubmit={(b) =>
          m.mutateAsync({
            path: "/requests",
            body: { ...b, kind: "support", reference: kit?._id },
          })
        }
      >
        <Field label="Title" name="title" required />
        <Field
          label="Requested changes"
          name="description"
          type="textarea"
          required
        />
      </FormModal>
    </>
  );
}
