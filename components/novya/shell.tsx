"use client";
import { notificationsApi } from "@/lib/api";
import {
  date,
  label,
  useSales,
  type Overview,
  type Preferences,
  type SalesContext,
} from "@/lib/sales";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  ArrowLeft,
  Bell,
  BookOpen,
  Brain,
  Calendar,
  ChartNoAxesCombined,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Globe,
  HardDrive,
  History,
  Image,
  Inbox,
  Layers,
  LayoutGrid,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Plus,
  Presentation,
  Search,
  Settings,
  Sheet,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  UserRound,
  Users,
  Wallet,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Avatar, Badge, Button, Empty, Modal, SearchBox } from "./ui";
type Nav = [string, string, LucideIcon];
const daily: Nav[] = [
  ["/dashboard", "Overview", LayoutGrid],
  ["/assistant", "Assistant", Sparkles],
  ["/learn", "Learn", BookOpen],
  ["/tasks", "Tasks", CheckSquare],
  ["/inbox", "Inbox", Inbox],
  ["/calendar", "Calendar", Calendar],
  ["/workflows", "Workflows", Workflow],
];
const sales: Nav[] = [
  ["/sales", "Overview", LayoutGrid],
  ["/leads", "Leads", Users],
  ["/pipeline", "Pipeline", TrendingUp],
  ["/lead-generator", "Lead Generator", Zap],
  ["/organizations", "Organizations", LayoutGrid],
  ["/territory", "My Territory", Map],
  ["/commissions", "Commissions", Wallet],
  ["/performance", "Performance", ChartNoAxesCombined],
  ["/activity", "Activity", History],
];
const sections: Record<string, Nav[]> = {
  assistant: [
    ["/assistant", "New Chat", Sparkles],
    ["/assistant/folders", "Folders", Folder],
    ["/assistant/actions", "Actions", Zap],
    ["/assistant/brain", "Brain", Brain],
    ["/assistant/history", "History", History],
  ],
  learn: [
    ["/learn", "Overview", LayoutGrid],
    ["/learn/knowledge", "Knowledge", BookOpen],
    ["/learn/courses", "Courses", Layers],
    ["/learn/progress", "My Progress", TrendingUp],
    ["/learn/help", "Help Center", MessageSquare],
  ],
  office: [
    ["/office", "Overview", LayoutGrid],
    ["/office/docs", "Docs", FileText],
    ["/office/sheets", "Sheets", Sheet],
    ["/office/presentations", "Presentations", Presentation],
    ["/office/transfers", "Imports & Exports", Upload],
  ],
  media: [
    ["/media", "Overview", LayoutGrid],
    ["/media/library", "Library", Image],
    ["/media/upload", "Upload", Upload],
    ["/media/collections", "Collections", Layers],
    ["/media/brand-assets", "Brand Assets", Sparkles],
    ["/media/storage", "Storage", HardDrive],
  ],
  team: [
    ["/team", "Overview", LayoutGrid],
    ["/team/tasks", "Tasks", CheckSquare],
    ["/team/partners", "Sales Partners", Users],
    ["/team/assignments", "Lead Assignments", Target],
    ["/team/pipeline", "Team Pipeline", TrendingUp],
    ["/team/territories", "Territory Coverage", Map],
    ["/team/coaching", "Performance & Coaching", Users],
    ["/team/commissions", "Commission Overview", Wallet],
    ["/team/preferences", "Team Preferences", Settings],
  ],
  settings: [
    ["/settings", "Overview", LayoutGrid],
    ["/settings/preferences", "Work Preferences", CheckSquare],
    ["/settings/notifications", "Notifications", Bell],
    ["/settings/connections", "Connected Accounts", Globe],
    ["/settings/kora", "Kora & Brain", Brain],
    ["/settings/privacy", "Data & Privacy", Shield],
  ],
  account: [
    ["/account", "Profile", UserRound],
    ["/account/security", "Account & Security", Shield],
    ["/account/sessions", "Sessions & Devices", Globe],
    ["/account/accessibility", "App & Accessibility", Accessibility],
  ],
};
const all = [...daily, ...sales, ...Object.values(sections).flat()];
export function Brand() {
  return (
    <Link href="/dashboard" className="nv-brand" aria-label="NOVYA home">
      <span className="nv-brand-symbol">N</span>
      <span>NOVYA</span>
    </Link>
  );
}
export function NovyaShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(),
    router = useRouter(),
    { data: session } = useSession(),
    ctx = useSales<SalesContext>("/context"),
    preferences = useSales<Preferences>("/preferences");
  const [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [term, setTerm] = useState(""),
    [profile, setProfile] = useState(false),
    [plus, setPlus] = useState(false),
    [bell, setBell] = useState(false),
    [group, setGroup] = useState("");
  const primary = pathname.split("/")[1],
    isSales = sales.some(
      (n) => pathname === n[0] || pathname.startsWith(n[0] + "/"),
    ),
    context = sections[primary],
    nav = context || (isSales ? sales : daily);
  const title =
    [...all]
      .sort((a, b) => b[0].length - a[0].length)
      .find((n) => pathname === n[0] || pathname.startsWith(n[0] + "/"))?.[1] ||
    "Sales Partner";
  const overview = useQuery({
    queryKey: ["sales", "/overview"],
    queryFn: async () => {
      const { getSales } = await import("@/lib/sales");
      return getSales<Overview>("/overview");
    },
    enabled: search,
  });
  const notifications = useQuery({
    queryKey: ["novya-notifications"],
    queryFn: async () => {
      const r = await notificationsApi.getAll({ limit: 15 });
      return r.data.data as {
        _id: string;
        title?: string;
        message?: string;
        createdAt?: string;
        isRead?: boolean;
        link?: string;
      }[];
    },
    enabled: bell,
  });
  const active = (href: string) =>
    pathname === href ||
    (href !== `/${primary}` && pathname.startsWith(href + "/"));
  const renderNav = (items: Nav[]) =>
    items.map(([href, name, Icon]) => (
      <Link
        key={href}
        href={href}
        onClick={() => setMobile(false)}
        className={`nv-nav-link ${active(href) ? "active" : ""}`}
      >
        <Icon size={15} />
        <span>{name}</span>
      </Link>
    ));
  const display = ctx.data?.name || session?.user?.name || "Sales Partner";
  const results = [
    ...(overview.data?.leads || []).map((x) => ({
      title: x.company || x.name || "Lead",
      kind: "Lead",
      href: `/leads/${x._id}`,
    })),
    ...(overview.data?.organizations || []).map((x) => ({
      title: x.name || "Organization",
      kind: "Organization",
      href: `/organizations/${x._id}`,
    })),
    ...(overview.data?.tasks || []).map((x) => ({
      title: x.title || "Task",
      kind: "Task",
      href: `/tasks/${x._id}`,
    })),
  ]
    .filter((x) => x.title.toLowerCase().includes(term.toLowerCase()))
    .slice(0, 15);
  return (
    <div
      className="nv-app"
      data-density={String(preferences.data?.density || "comfortable")}
      data-contrast={preferences.data?.highContrast ? "high" : "standard"}
      data-motion={preferences.data?.reducedMotion ? "reduced" : "system"}
    >
      {mobile && (
        <button
          className="nv-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`nv-sidebar ${mobile ? "open" : ""}`}>
        <Brand />
        {(context || isSales) && (
          <Link className="nv-back nv-sidebar-back" href="/dashboard">
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        )}
        <nav>
          {renderNav(nav)}
          {!context && !isSales && (
            <>
              {[
                ["Sales", sales, TrendingUp],
                ["Office", sections.office, FileText],
                ["Media", sections.media, Image],
                ...(ctx.data?.teamLead
                  ? [["Team Lead", sections.team, Users]]
                  : []),
              ].map((entry) => {
                const name = entry[0] as string,
                  items = entry[1] as Nav[],
                  Icon = entry[2] as LucideIcon;
                return (
                  <div className="nv-nav-group" key={name}>
                    <button
                      onClick={() => setGroup(group === name ? "" : name)}
                      className="nv-nav-link"
                    >
                      <Icon size={15} />
                      <span>{name}</span>
                      <ChevronDown size={12} />
                    </button>
                    {group === name && (
                      <div className="nv-subnav">{renderNav(items)}</div>
                    )}
                  </div>
                );
              })}
            </>
          )}
          {primary === "assistant" && (
            <div className="nv-sidebar-note">
              <span>YOUR PERSONAL ASSISTANT</span>
              <p>
                Prepare your day.
                <br />
                Move your work forward.
              </p>
              <Sparkles size={20} />
            </div>
          )}
        </nav>
        <Link
          href="/settings"
          className={`nv-nav-link nv-settings-link ${primary === "settings" ? "active" : ""}`}
        >
          <Settings size={15} />
          <span>Settings</span>
        </Link>
      </aside>
      <div className="nv-main">
        <header className="nv-header">
          <button
            className="nv-mobile-toggle nv-icon-button"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <Menu size={18} />
          </button>
          <strong>
            {primary === "assistant"
              ? `Assistant${!["New Chat", "Assistant"].includes(title) ? ` · ${title}` : ""}`
              : primary === "settings"
                ? "Sales Partner Settings"
                : title}
          </strong>
          <div className="nv-header-actions">
            <button
              className="nv-icon-button"
              aria-label="Search"
              onClick={() => setSearch(true)}
            >
              <Search size={16} />
            </button>
            <button
              className="nv-icon-button"
              aria-label="Notifications"
              onClick={() => setBell(true)}
            >
              <Bell size={16} />
            </button>
            <div className="nv-profile-wrap">
              <button
                className="nv-profile-button"
                onClick={() => setProfile(!profile)}
                aria-expanded={profile}
              >
                <Avatar name={display} small />
                <span>{display.split(" ")[0]}</span>
                <ChevronDown size={12} />
              </button>
              {profile && (
                <>
                  <button
                    className="nv-menu-backdrop"
                    aria-label="Close account menu"
                    onClick={() => setProfile(false)}
                  />
                  <div className="nv-menu nv-profile-menu">
                    <div className="nv-menu-caption">
                      {display}
                      <small>
                        {label(ctx.data?.role || session?.user.role)}
                      </small>
                    </div>
                    {sections.account.map(([href, name, Icon]) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setProfile(false)}
                      >
                        <Icon size={14} />
                        {name}
                      </Link>
                    ))}
                    <button
                      onClick={async () => {
                        try {
                          const { authApi } = await import("@/lib/api");
                          await authApi.logout();
                        } finally {
                          await signOut({ callbackUrl: "/login" });
                        }
                      }}
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main
          className="nv-content"
          key={pathname}
          style={{ zoom: Number(preferences.data?.textScale || 100) / 100 }}
        >
          {primary === "team" && !ctx.isPending && !ctx.data?.teamLead ? (
            <Empty
              title="Team Lead access required"
              description="This view is available to your Sales Team Lead."
            />
          ) : (
            children
          )}
        </main>
        <div className="nv-universal-plus">
          <button
            aria-label="Create or ask Kora"
            className="nv-plus"
            onClick={() => setPlus(!plus)}
          >
            {plus ? <X size={18} /> : <Plus size={18} />}
          </button>
          {plus && (
            <>
              <button
                className="nv-menu-backdrop"
                aria-label="Close create menu"
                onClick={() => setPlus(false)}
              />
              <div className="nv-menu">
                {[
                  ["Ask Kora", "/assistant", Sparkles],
                  ["Create task", "/tasks/new", CheckSquare],
                  ["Create meeting", "/calendar?create=true", Calendar],
                  ["Capture Lead", "/leads?create=true", Users],
                ].map(([name, href, Icon]) => {
                  const I = Icon as LucideIcon;
                  return (
                    <Link
                      key={String(name)}
                      href={String(href)}
                      onClick={() => setPlus(false)}
                    >
                      <I size={15} />
                      {String(name)}
                      <ChevronRight size={12} />
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      <Modal
        open={search}
        onClose={() => setSearch(false)}
        title="Search your work"
        description="Find Leads, Organizations and Tasks in your authorized portfolio."
      >
        <SearchBox
          value={term}
          onChange={setTerm}
          placeholder="Search by name or company..."
        />
        <div className="nv-search-results">
          {overview.isPending ? (
            <p>Searching…</p>
          ) : results.length ? (
            results.map((x) => (
              <button
                key={x.href}
                onClick={() => {
                  setSearch(false);
                  router.push(x.href);
                }}
              >
                <span>{x.title}</span>
                <Badge>{x.kind}</Badge>
              </button>
            ))
          ) : (
            <Empty
              title="No matching records"
              description="Try another company or task name."
            />
          )}
        </div>
      </Modal>
      <Modal
        open={bell}
        onClose={() => setBell(false)}
        title="Notifications"
        description="Updates that need your attention."
      >
        <div className="nv-search-results">
          {notifications.data?.length ? (
            notifications.data.map((n) => (
              <button
                key={n._id}
                onClick={async () => {
                  await notificationsApi.markRead(n._id);
                  notifications.refetch();
                  if (n.link?.startsWith("/") && !n.link.startsWith("//")) {
                    setBell(false);
                    router.push(n.link);
                  }
                }}
              >
                <div>
                  <strong>{n.title || "Update"}</strong>
                  <p>{n.message}</p>
                </div>
                <small>{date(n.createdAt)}</small>
              </button>
            ))
          ) : (
            <Empty
              title="You're all caught up"
              description="Assignments, messages and reminders appear here."
            />
          )}
        </div>
        <Button
          onClick={async () => {
            await notificationsApi.markAllRead();
            notifications.refetch();
          }}
        >
          Mark all read
        </Button>
      </Modal>
    </div>
  );
}
