"use client";
import { useState } from "react";
import { Sparkles, Plus, Target } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useSales, type Entity, errorMessage } from "@/lib/sales";
import {
  PageTitle,
  Card,
  Button,
  Field,
  FormModal,
  DataState,
  Empty,
  Badge,
  DetailRows,
  Avatar,
} from "./ui";
import { LeadForm, TerritoryMap } from "./sales-pages";
export function ProspectPage() {
  const territories = useSales<Entity[]>("/territories"),
    [search, setSearch] = useState(false),
    [busy, setBusy] = useState(false),
    [candidates, setCandidates] = useState<Entity[]>([]),
    [selected, setSelected] = useState<Entity>(),
    [capture, setCapture] = useState(false),
    [manual, setManual] = useState(false);
  return (
    <>
      <PageTitle
        title="Lead Generator"
        description="Discover prospects in your assigned territory. Review the source before adding a canonical Lead."
        action={
          <>
            <Button onClick={() => setManual(true)}>
              <Plus size={13} />
              Manual capture
            </Button>
            <Button primary onClick={() => setSearch(true)}>
              <Sparkles size={13} />
              Find prospects
            </Button>
          </>
        }
      />
      <DataState
        pending={territories.isPending}
        error={territories.error}
        retry={() => territories.refetch()}
      >
        <div className="nv-prospect-layout">
          <Card
            title="Prospect results"
            description={`${candidates.length} provider candidates · no automatic capture`}
          >
            {candidates.length ? (
              candidates.map((c) => (
                <button
                  key={c._id}
                  className="nv-list-row"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => setSelected(c)}
                >
                  <Avatar name={c.company} />
                  <div>
                    <strong>{c.company}</strong>
                    <small>{c.address}</small>
                  </div>
                </button>
              ))
            ) : (
              <Empty
                title="Find your next opportunity"
                description="Search verified provider data inside an assigned territory, or capture a known prospect manually."
                action={
                  <Button onClick={() => setSearch(true)}>
                    Start a search
                  </Button>
                }
              />
            )}
          </Card>
          <Card title={selected?.company || "Prospect detail"}>
            {selected ? (
              <>
                <div className="nv-course-art">
                  <Target size={40} />
                </div>
                <Badge>Provider candidate</Badge>
                <h2 style={{ fontSize: 21, margin: "20px 0" }}>
                  {selected.company}
                </h2>
                <DetailRows
                  rows={[
                    ["Phone", selected.phone || "Not provided"],
                    ["Website", selected.website || "Not provided"],
                    ["Address", selected.address || "—"],
                    ["Source", "Google Places"],
                    ["Contact consent", "Review before outreach"],
                  ]}
                />
                <div className="nv-form-actions">
                  <Button primary onClick={() => setCapture(true)}>
                    Review & add to Leads
                  </Button>
                </div>
              </>
            ) : (
              <Empty
                title="Choose a prospect"
                description="Inspect business details, territory and source before capture."
              />
            )}
          </Card>
          <Card title="My territory radar">
            <TerritoryMap />
            <DetailRows
              rows={[
                ["Assigned areas", territories.data?.length || 0],
                [
                  "Postal coverage",
                  territories.data
                    ?.flatMap((t) => t.zipCodes || [])
                    .join(", ") || "Awaiting assignment",
                ],
                ["Capture", "Human review required"],
                ["Duplicate checks", "Canonical contact records"],
              ]}
            />
          </Card>
        </div>
      </DataState>
      <FormModal
        open={search}
        onClose={() => setSearch(false)}
        title="Find territory prospects"
        description="Search your configured Places provider. Results are filtered to the postal areas assigned to you."
        submit={busy ? "Searching…" : "Search prospects"}
        busy={busy}
        onSubmit={async (b) => {
          setBusy(true);
          try {
            const r = await api.post("/sales-experience/prospects/search", b);
            setCandidates(r.data.data);
            setSelected(r.data.data[0]);
            if (!r.data.data.length)
              toast.info("No matching prospects in the assigned postal areas");
          } catch (e) {
            toast.error(errorMessage(e));
            throw e;
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          label="Business type"
          name="businessType"
          required
          placeholder="e.g. beauty salon"
        />
        <Field
          label="Assigned territory"
          name="territory_id"
          required
          options={(territories.data || []).map((t) => ({
            value: t._id,
            label: t.name || "Territory",
          }))}
        />
        <Field
          label="Maximum results"
          name="count"
          type="number"
          defaultValue={10}
        />
      </FormModal>
      <LeadForm
        key={selected?._id || "manual"}
        open={capture || manual}
        onClose={() => {
          setCapture(false);
          setManual(false);
        }}
        initial={manual ? undefined : selected}
      />
    </>
  );
}
