"use client";
import { usePathname } from "next/navigation";
import { AssistantPage } from "./assistant-pages";
import { CalendarPage, InboxPage } from "./communication-pages";
import { LearnPage } from "./learn-pages";
import { MediaPage } from "./media-pages";
import { OfficePage } from "./office-pages";
import {
  AnalyticsPage,
  LeadRecord,
  LeadsPage,
  OrganizationsPage,
  OverviewPage,
} from "./sales-pages";
import { SettingsPage } from "./settings-pages";
import { TeamPage } from "./team-pages";
import { ProspectPage } from "./prospect-page";
import { Button, Empty } from "./ui";
import { TasksPage, WorkflowsPage } from "./work-pages";
export default function SalesExperience() {
  const [root, section, id, mode] = usePathname().split("/").filter(Boolean);
  if (root === "dashboard") return <OverviewPage />;
  if (root === "sales") return <OverviewPage commercial />;
  if (root === "assistant") return <AssistantPage section={section} id={id} />;
  if (root === "learn")
    return (
      <LearnPage
        section={section}
        id={section === "help" && id === "articles" ? mode : id}
        mode={mode}
      />
    );
  if (root === "leads")
    return section ? <LeadRecord id={section} /> : <LeadsPage />;
  if (root === "pipeline") return <LeadsPage pipeline />;
  if (root === "lead-generator") return <ProspectPage />;
  if (root === "organizations" || root === "customers")
    return <OrganizationsPage id={section} />;
  if (
    [
      "territory",
      "commissions",
      "earnings",
      "performance",
      "activity",
    ].includes(root)
  )
    return <AnalyticsPage kind={root === "earnings" ? "commissions" : root} />;
  if (root === "tasks") return <TasksPage id={section} />;
  if (root === "workflows" || root === "actions") return <WorkflowsPage />;
  if (root === "office") return <OfficePage section={section} id={id} />;
  if (root === "media")
    return <MediaPage section={section} id={id} detailTab={mode} />;
  if (root === "team")
    return <TeamPage section={section} id={id} mode={mode} />;
  if (root === "settings" || root === "account")
    return <SettingsPage section={section} account={root === "account"} />;
  if (root === "inbox") return <InboxPage />;
  if (root === "calendar") return <CalendarPage />;
  if (root === "support") return <LearnPage section="help" />;
  if (root === "services") return <LearnPage section="knowledge" />;
  return (
    <Empty
      title="Page not found"
      description="Choose an available view from your sidebar."
      action={<Button href="/dashboard">Back to Overview</Button>}
    />
  );
}
