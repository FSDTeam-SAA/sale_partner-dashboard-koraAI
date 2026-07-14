/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supportApi } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Code2,
  Copy,
  CreditCard,
  Database,
  ExternalLink,
  FileText,
  Link2,
  Lock,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Shield,
  UserRound,
  Users,
} from "lucide-react";

type SupportView = "help" | "requests" | "contact";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending_approval", label: "Waiting on You" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_BADGE: Record<string, any> = {
  open: "default",
  in_progress: "warning",
  pending_approval: "secondary",
  resolved: "success",
  closed: "secondary",
};

const TYPE_OPTIONS = [
  { value: "technical_issue", label: "Technical issue", icon: Code2, hint: "Bug, error, or system problem" },
  { value: "account_access", label: "Account & Access", icon: UserRound, hint: "Login, permissions, 2FA" },
  { value: "billing", label: "Billing & Payments", icon: CreditCard, hint: "Invoices, charges, refunds" },
  { value: "data_reports", label: "Data & Reports", icon: Database, hint: "Data missing or incorrect" },
  { value: "integration", label: "Integration", icon: Link2, hint: "Third-party or API issues" },
  { value: "other", label: "Other", icon: MoreHorizontal, hint: "Something else" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const HELP_TOPICS = [
  {
    title: "Account & Login",
    description: "Login issues, password reset, 2FA, account access and security.",
    articles: 8,
    icon: UserRound,
    tone: "bg-blue-600/20 text-blue-300",
  },
  {
    title: "Calendar & Appointments",
    description: "Sync issues, calendar settings, booking problems and fixes.",
    articles: 12,
    icon: CalendarDays,
    tone: "bg-emerald-600/20 text-emerald-300",
  },
  {
    title: "Leads & Customers",
    description: "Managing leads, customer profiles, notes and activities.",
    articles: 10,
    icon: Users,
    tone: "bg-purple-600/20 text-purple-300",
  },
  {
    title: "Billing & Earnings",
    description: "Payments, invoices, subscriptions and earnings questions.",
    articles: 7,
    icon: CreditCard,
    tone: "bg-amber-600/20 text-amber-300",
  },
  {
    title: "Technical Issues",
    description: "Bug reports, application errors, performance and system issues.",
    articles: 9,
    icon: Code2,
    tone: "bg-indigo-600/20 text-indigo-300",
  },
  {
    title: "Security & Privacy",
    description: "Data protection, privacy settings, permissions and compliance.",
    articles: 6,
    icon: Shield,
    tone: "bg-emerald-600/20 text-emerald-300",
  },
];

const POPULAR_ARTICLES = [
  { title: "How to reset a customer password", category: "Account & Login" },
  { title: "Fix calendar sync issues", category: "Calendar & Appointments" },
  { title: "How to add a new customer", category: "Leads & Customers" },
  { title: "Understanding your earnings", category: "Billing & Earnings" },
  { title: "Enable two-factor authentication (2FA)", category: "Account & Login" },
];

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<SupportView>("help");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [articleSearch, setArticleSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [type, setType] = useState("technical_issue");
  const [priority, setPriority] = useState("high");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const limit = 10;

  const { data: listResponse, isLoading: listLoading } = useQuery({
    queryKey: ["sp-tickets", page, tab],
    queryFn: () =>
      supportApi
        .getAll({ page, limit, status: tab === "all" ? undefined : tab })
        .then((response) => response.data),
  });

  const tickets: any[] = useMemo(() => listResponse?.data || [], [listResponse?.data]);
  const meta = listResponse?.meta || { total: 0 };
  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / limit));

  const filteredTickets = useMemo(() => {
    if (!search.trim()) return tickets;
    const term = search.toLowerCase();
    return tickets.filter(
      (ticket) =>
        ticket.subject?.toLowerCase().includes(term) ||
        ticket.ticket_id?.toLowerCase().includes(term) ||
        ticket.priority?.toLowerCase().includes(term)
    );
  }, [tickets, search]);

  const filteredTopics = useMemo(() => {
    if (!articleSearch.trim()) return HELP_TOPICS;
    const term = articleSearch.toLowerCase();
    return HELP_TOPICS.filter(
      (topic) =>
        topic.title.toLowerCase().includes(term) ||
        topic.description.toLowerCase().includes(term)
    );
  }, [articleSearch]);

  const filteredArticles = useMemo(() => {
    if (!articleSearch.trim()) return POPULAR_ARTICLES;
    const term = articleSearch.toLowerCase();
    return POPULAR_ARTICLES.filter(
      (article) =>
        article.title.toLowerCase().includes(term) ||
        article.category.toLowerCase().includes(term)
    );
  }, [articleSearch]);

  const counts = useMemo(
    () =>
      tickets.reduce(
        (stats, ticket) => {
          const status = String(ticket.status || "open");
          stats.all += 1;
          stats[status] = (stats[status] || 0) + 1;
          return stats;
        },
        { all: 0 } as Record<string, number>
      ),
    [tickets]
  );

  useEffect(() => {
    if (!selectedId && tickets.length > 0) {
      const timer = window.setTimeout(() => setSelectedId(tickets[0]._id), 0);
      return () => window.clearTimeout(timer);
    }
  }, [selectedId, tickets]);

  const { data: detailResponse, isLoading: detailLoading } = useQuery({
    queryKey: ["sp-ticket", selectedId],
    queryFn: () => supportApi.getById(String(selectedId)).then((response) => response.data?.data),
    enabled: Boolean(selectedId),
  });

  const selected = detailResponse || tickets.find((ticket) => ticket._id === selectedId);
  const selectedType = TYPE_OPTIONS.find((item) => item.value === type) || TYPE_OPTIONS[0];

  const createMutation = useMutation({
    mutationFn: () => supportApi.create({ subject, type, priority, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sp-tickets"] });
      setSubject("");
      setDescription("");
      setType("technical_issue");
      setPriority("high");
      setView("requests");
      toast.success("Support request submitted");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || "Failed to submit request"),
  });

  const replyMutation = useMutation({
    mutationFn: () => supportApi.reply(String(selectedId), { message: replyText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sp-ticket", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["sp-tickets"] });
      setReplyText("");
      toast.success("Reply sent");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || "Failed to send reply"),
  });

  const submitRequest = () => {
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    createMutation.mutate();
  };

  const headerSubtitle =
    view === "requests"
      ? "Support / My Requests"
      : view === "contact"
        ? "Support / Contact Support"
        : "Get help, solve issues or contact support.";

  return (
    <div>
      <Header
        title="Support"
        subtitle={headerSubtitle}
        action={
          <Button size="sm" onClick={() => setView("contact")}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            New Request
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-[220px_minmax(0,1fr)_390px] lg:p-6">
        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-2 p-2">
              <SupportNavButton
                active={view === "help"}
                icon={BookOpen}
                title="Help Center"
                description="Browse articles and guides"
                onClick={() => setView("help")}
              />
              <SupportNavButton
                active={view === "requests"}
                icon={ClipboardList}
                title="My Requests"
                description="View and track your requests"
                onClick={() => setView("requests")}
              />
              <SupportNavButton
                active={view === "contact"}
                icon={Send}
                title="Contact Support"
                description="Get help from our team"
                onClick={() => setView("contact")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <p className="text-sm font-semibold text-white">System Status</p>
              </div>
              <p className="flex items-center gap-2 text-xs text-gray-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                All systems operational
              </p>
              <button className="mt-5 inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300">
                View status page <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0">
          {view === "help" ? (
            <HelpCenterView
              articleSearch={articleSearch}
              setArticleSearch={setArticleSearch}
              topics={filteredTopics}
              articles={filteredArticles}
            />
          ) : null}
          {view === "requests" ? (
            <RequestsView
              tab={tab}
              setTab={setTab}
              search={search}
              setSearch={setSearch}
              tickets={filteredTickets}
              loading={listLoading}
              selected={selected}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              page={page}
              totalPages={totalPages}
              setPage={setPage}
              counts={counts}
              detailLoading={detailLoading}
              replyText={replyText}
              setReplyText={setReplyText}
              onReply={() => {
                if (!replyText.trim() || !selectedId) return;
                replyMutation.mutate();
              }}
              replying={replyMutation.isPending}
              onNewRequest={() => setView("contact")}
            />
          ) : null}
          {view === "contact" ? (
            <ContactSupportView
              type={type}
              setType={setType}
              priority={priority}
              setPriority={setPriority}
              subject={subject}
              setSubject={setSubject}
              description={description}
              setDescription={setDescription}
              selectedType={selectedType}
              onCancel={() => setView("help")}
              onSubmit={submitRequest}
              submitting={createMutation.isPending}
            />
          ) : null}
        </main>

        <aside className="space-y-4">
          <KoraAssistantPanel view={view} setView={setView} />
          {view === "help" ? (
            <Card className="bg-[radial-gradient(circle_at_100%_50%,rgba(34,197,94,0.12),transparent_34%),#091526]">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <p className="text-sm font-semibold text-white">System Status</p>
                </div>
                <p className="flex items-center gap-2 text-xs text-gray-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  All systems operational
                </p>
                <p className="mt-1 text-xs text-gray-500">Everything is running smoothly.</p>
                <button className="mt-6 inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300">
                  View status page <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function SupportNavButton({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
        active
          ? "border-blue-500 bg-blue-600/20 text-white shadow-[0_0_18px_rgba(37,99,235,0.18)]"
          : "border-transparent text-gray-300 hover:bg-[#0d1a2d]"
      }`}
    >
      <Icon className={active ? "h-5 w-5 text-blue-300" : "h-5 w-5 text-gray-400"} />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block truncate text-[11px] text-gray-500">{description}</span>
      </span>
    </button>
  );
}

function HelpCenterView({
  articleSearch,
  setArticleSearch,
  topics,
  articles,
}: {
  articleSearch: string;
  setArticleSearch: (value: string) => void;
  topics: typeof HELP_TOPICS;
  articles: typeof POPULAR_ARTICLES;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Help Center</h2>
          <p className="mt-1 text-sm text-gray-400">Find answers, guides and solutions for common topics.</p>
        </div>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search for help articles..."
              value={articleSearch}
              onChange={(event) => setArticleSearch(event.target.value)}
              className="h-10 pl-10"
            />
          </div>
          <Select defaultValue="popular">
            <SelectTrigger className="h-10 w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Popular topics</SelectItem>
              <SelectItem value="recent">Recently updated</SelectItem>
              <SelectItem value="tickets">Request help</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => {
            const Icon = topic.icon;
            return (
              <button
                key={topic.title}
                type="button"
                className="min-h-[210px] rounded-lg border border-[#1e2d40] bg-[radial-gradient(circle_at_0%_0%,rgba(37,99,235,0.14),transparent_36%),#091526] p-4 text-left transition-colors hover:border-blue-500/50"
              >
                <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${topic.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-white">{topic.title}</p>
                <p className="mt-2 min-h-16 text-sm leading-6 text-gray-400">{topic.description}</p>
                <p className="mt-4 text-xs text-gray-500">{topic.articles} articles</p>
              </button>
            );
          })}
        </div>
        <div className="mt-5 border-t border-[#1e2d40] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Popular Articles</h3>
            <button className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300">
              View all articles <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="overflow-hidden rounded-lg border border-[#1e2d40]">
            {(articles.length ? articles : POPULAR_ARTICLES).map((article) => (
              <button
                key={article.title}
                type="button"
                className="flex w-full items-center justify-between gap-3 border-b border-[#1e2d40] px-4 py-3 text-left last:border-0 hover:bg-[#0d1a2d]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate text-sm text-gray-200">{article.title}</span>
                </span>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {article.category}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RequestsView({
  tab,
  setTab,
  search,
  setSearch,
  tickets,
  loading,
  selected,
  selectedId,
  setSelectedId,
  page,
  totalPages,
  setPage,
  counts,
  detailLoading,
  replyText,
  setReplyText,
  onReply,
  replying,
  onNewRequest,
}: {
  tab: string;
  setTab: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  tickets: any[];
  loading: boolean;
  selected: any;
  selectedId: string | null;
  setSelectedId: (value: string) => void;
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  counts: Record<string, number>;
  detailLoading: boolean;
  replyText: string;
  setReplyText: (value: string) => void;
  onReply: () => void;
  replying: boolean;
  onNewRequest: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">My Requests</h2>
            <p className="mt-1 text-sm text-gray-400">View and track all your support requests.</p>
          </div>
          <Button onClick={onNewRequest}>
            <Plus className="mr-1 h-4 w-4" />
            New Request
          </Button>
        </div>
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTab(option.value);
                  setPage(1);
                }}
                className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                  tab === option.value
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-[#1e2d40] text-gray-400 hover:text-gray-200"
                }`}
              >
                {option.label}
                <span className="ml-2 text-[10px] opacity-70">{counts[option.value] || 0}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full xl:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search requests..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 pl-8 text-xs"
            />
          </div>
        </div>
        <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-lg border border-[#1e2d40]">
            <div className="grid grid-cols-[1.5fr_0.85fr_0.75fr_0.9fr_0.9fr_36px] border-b border-[#1e2d40] px-3 py-3 text-xs text-gray-500">
              <span>Request</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Last Update</span>
              <span>Created</span>
              <span />
            </div>
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-500">No support requests found.</p>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket._id}
                  type="button"
                  onClick={() => setSelectedId(ticket._id)}
                  className={`grid w-full grid-cols-[1.5fr_0.85fr_0.75fr_0.9fr_0.9fr_36px] items-center border-b border-[#1e2d40] px-3 py-3 text-left text-xs last:border-0 hover:bg-[#0d1a2d] ${
                    selectedId === ticket._id ? "bg-blue-600/10 ring-1 ring-inset ring-blue-500" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray-100">{ticket.subject || "Support request"}</span>
                    <span className="mt-1 block text-[10px] text-gray-500">{ticket.ticket_id || ticket._id}</span>
                  </span>
                  <span>
                    <Badge variant={STATUS_BADGE[ticket.status] || "default"} className="text-[10px]">
                      {String(ticket.status || "open").replace("_", " ")}
                    </Badge>
                  </span>
                  <span className="flex items-center gap-1 capitalize text-gray-300">
                    {String(ticket.priority || "medium").toLowerCase() === "high" ||
                    String(ticket.priority || "").toLowerCase() === "urgent" ? (
                      <ArrowUp className="h-3.5 w-3.5 text-orange-400" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    {ticket.priority || "Medium"}
                  </span>
                  <span className="text-gray-400">{ticket.updatedAt ? timeAgo(ticket.updatedAt) : "Recently"}</span>
                  <span className="text-gray-400">{ticket.createdAt ? formatDate(ticket.createdAt) : "--"}</span>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </button>
              ))
            )}
            <div className="flex items-center justify-between border-t border-[#1e2d40] px-4 py-3 text-xs text-gray-500">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <RequestDetailCard
            selected={selected}
            loading={detailLoading}
            replyText={replyText}
            setReplyText={setReplyText}
            onReply={onReply}
            replying={replying}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function RequestDetailCard({
  selected,
  loading,
  replyText,
  setReplyText,
  onReply,
  replying,
}: {
  selected: any;
  loading: boolean;
  replyText: string;
  setReplyText: (value: string) => void;
  onReply: () => void;
  replying: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-[#1e2d40] p-4">
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }
  if (!selected) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-[#1e2d40] text-sm text-gray-500">
        Select a request
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#1e2d40] bg-[radial-gradient(circle_at_0%_0%,rgba(37,99,235,0.12),transparent_34%),#091526] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{selected.subject || "Support request"}</p>
          <p className="mt-1 text-xs text-gray-500">{selected.ticket_id || selected._id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Copy className="h-3.5 w-3.5 text-gray-500" />
          <MoreHorizontal className="h-4 w-4 text-gray-500" />
        </div>
      </div>
      <Badge variant={STATUS_BADGE[selected.status] || "default"} className="mb-4 text-[10px]">
        {String(selected.status || "open").replace("_", " ")}
      </Badge>
      <div className="space-y-3 border-t border-[#1e2d40] pt-4 text-xs">
        <Row label="Created">{selected.createdAt ? formatDate(selected.createdAt) : "--"}</Row>
        <Row label="Last Updated">{selected.updatedAt ? timeAgo(selected.updatedAt) : "--"}</Row>
        <Row label="Priority">{selected.priority || "Medium"}</Row>
      </div>
      <div className="mt-4 border-t border-[#1e2d40] pt-4">
        <p className="text-xs font-semibold text-gray-200">Description</p>
        <p className="mt-2 text-xs leading-5 text-gray-400">{selected.description || "No description provided."}</p>
      </div>
      <div className="mt-4 border-t border-[#1e2d40] pt-4">
        <p className="mb-3 text-xs font-semibold text-gray-200">Timeline</p>
        <TimelineItem title="You created this request" time={selected.createdAt ? timeAgo(selected.createdAt) : "Recently"} />
        <TimelineItem title="Support Team added note" time={selected.updatedAt ? timeAgo(selected.updatedAt) : "Pending"} active />
      </div>
      {selected.status !== "closed" ? (
        <div className="mt-4 flex gap-2 border-t border-[#1e2d40] pt-4">
          <Input
            placeholder="Type your reply..."
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            className="h-9 flex-1 text-xs"
          />
          <Button size="sm" onClick={onReply} disabled={!replyText.trim() || replying}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ContactSupportView({
  type,
  setType,
  priority,
  setPriority,
  subject,
  setSubject,
  description,
  setDescription,
  selectedType,
  onCancel,
  onSubmit,
  submitting,
}: {
  type: string;
  setType: (value: string) => void;
  priority: string;
  setPriority: (value: string) => void;
  subject: string;
  setSubject: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  selectedType: (typeof TYPE_OPTIONS)[number];
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="border-b border-[#1e2d40] pb-5">
            <h2 className="text-lg font-semibold text-white">Contact Support</h2>
            <p className="mt-1 text-sm text-gray-400">Cannot find a solution? Send a request to our system administrators.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["1", "Describe Issue", "Tell us what is going on"],
                ["2", "Review & Confirm", "Review your request"],
                ["3", "Request Submitted", "We will get back to you"],
              ].map(([step, title, sub], index) => (
                <div key={step} className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${index === 0 ? "bg-blue-600 text-white" : "border border-[#1e2d40] text-gray-400"}`}>
                    {step}
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-gray-100">{title}</span>
                    <span className="block text-[11px] text-gray-500">{sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 pt-5 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-lg border border-[#1e2d40] bg-[#07111f] p-4">
              <h3 className="text-sm font-semibold text-white">1. What can we help you with?</h3>
              <p className="mt-1 text-xs text-gray-500">Select a category</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = type === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setType(option.value)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        active ? "border-blue-500 bg-blue-600/10" : "border-[#1e2d40] hover:bg-[#0d1a2d]"
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-blue-600/20 text-blue-300" : "bg-[#1e2d40] text-gray-400"}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-gray-100">{option.label}</span>
                        <span className="block truncate text-[10px] text-gray-500">{option.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-white">2. Describe your issue</h3>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Short summary of your issue"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={5}
                    placeholder="Describe what happened, what you were trying to do, and any error messages."
                    className="w-full rounded-lg border border-[#2a3547] bg-[#0d1526] px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="rounded-lg border border-dashed border-[#334155] p-4 text-center">
                  <Paperclip className="mx-auto h-5 w-5 text-gray-400" />
                  <p className="mt-2 text-xs text-gray-400">Drag & drop files here or click to browse</p>
                  <p className="mt-1 text-[10px] text-gray-500">Max file size: 10 MB</p>
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={onCancel}>Cancel</Button>
                  <Button onClick={onSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Continue"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#1e2d40] bg-[#07111f] p-4">
              <h3 className="text-sm font-semibold text-white">Request Summary</h3>
              <p className="mt-1 text-xs text-gray-500">Please review your information.</p>
              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <p className="mb-1 text-gray-500">Category</p>
                  <Badge variant="secondary" className="text-[10px]">{selectedType.label}</Badge>
                </div>
                <div>
                  <p className="mb-1 text-gray-500">Subject</p>
                  <p className="text-gray-200">{subject || "Not provided"}</p>
                </div>
                <div>
                  <p className="mb-1 text-gray-500">Priority</p>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-gray-500">Description</p>
                  <p className="text-gray-200">{description || "Not provided"}</p>
                </div>
              </div>
              <div className="mt-5 border-t border-[#1e2d40] pt-4">
                <p className="mb-3 text-xs font-semibold text-gray-200">What happens next?</p>
                <TimelineItem title="Your request will be sent to our system administrators." time="" active />
                <TimelineItem title="We typically respond within 1-4 hours during business hours." time="" />
                <TimelineItem title="You can track updates in My Requests." time="" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20">
              <Lock className="h-5 w-5 text-blue-300" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Your data is secure</p>
              <p className="mt-1 text-xs text-gray-500">All requests are encrypted and only visible to authorized system administrators.</p>
            </div>
          </div>
          <Button variant="outline">
            Emergency Contact
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function KoraAssistantPanel({
  view,
  setView,
}: {
  view: SupportView;
  setView: (view: SupportView) => void;
}) {
  const suggestions =
    view === "requests"
      ? [
          ["Fix calendar sync issues", "Let's run a quick fix."],
          ["Reset customer access", "Help with login problems."],
          ["Check billing status", "Review payments and invoices."],
          ["See more help topics", ""],
        ]
      : view === "contact"
        ? [
            ["Fix login issues", "Step-by-step guide"],
            ["System status", "All systems operational"],
            ["Common error codes", "Solutions and explanations"],
          ]
        : [
            ["My calendar is not syncing", "Let's fix this together"],
            ["Customer can't log in", "I can help you reset access"],
            ["How do I add a new customer?", "I'll guide you step by step"],
            ["See more suggestions", ""],
          ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <p className="text-sm font-semibold text-white">Kora Assistant</p>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-emerald-400">Online</span>
          </div>
          <MoreHorizontal className="h-4 w-4 text-gray-500" />
        </div>
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-cyan-400 bg-cyan-500/10 shadow-[0_0_28px_rgba(34,211,238,0.35)]">
            <Bot className="h-10 w-10 text-cyan-300" />
          </div>
          <div className="rounded-lg border border-[#1e2d40] bg-[#0d1a2d] p-3 text-sm text-gray-200">
            <p>Hi Alex! 👋</p>
            <p className="mt-1 text-gray-300">I&apos;m here to help you solve issues and get things done.</p>
          </div>
        </div>
        <div className="space-y-2">
          {suggestions.map(([title, sub]) => (
            <button
              key={title}
              type="button"
              onClick={() => {
                if (title.includes("request") || title.includes("support")) setView("contact");
              }}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#1e2d40] bg-[#0d1a2d] px-3 py-3 text-left hover:bg-[#12213a]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-gray-200">{title}</span>
                {sub ? <span className="block truncate text-xs text-gray-500">{sub}</span> : null}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-[#1e2d40] bg-[#0d1a2d] p-4">
          <p className="text-sm text-gray-200">
            I can help with that. Would you like me to start a guided workflow?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="sm" onClick={() => setView("contact")}>Start workflow</Button>
            <Button size="sm" variant="outline">Contact support</Button>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Input placeholder="Type your message..." className="h-10 flex-1" />
          <Button size="icon" className="h-10 w-10">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="text-right text-gray-200">{children}</span>
    </div>
  );
}

function TimelineItem({ title, time, active }: { title: string; time?: string; active?: boolean }) {
  return (
    <div className="flex gap-3 pb-3 last:pb-0">
      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${active ? "bg-blue-400" : "bg-gray-500"}`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-200">{title}</p>
      </div>
      {time ? <span className="text-[10px] text-gray-500">{time}</span> : null}
    </div>
  );
}
