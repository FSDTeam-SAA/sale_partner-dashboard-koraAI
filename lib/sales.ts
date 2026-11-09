"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import api from "./axios";
export interface Entity {
  _id: string;
  canEdit?: boolean;
  canManage?: boolean;
  __v?: number;
  name?: string;
  title?: string;
  description?: string;
  status?: string;
  kind?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  source?: string;
  consentSource?: string;
  estimatedValue?: number;
  nextStep?: string;
  nextActionAt?: string;
  notes?: string;
  lossReason?: string;
  owner_id?: string;
  assignee_id?: string;
  assignedBy?: string;
  assigned_partner_id?: string;
  parent_id?: string;
  delegated_lead_id?: string;
  region?: string;
  zipCodes?: string[];
  capacity?: number;
  industry?: string;
  dueDate?: string;
  priority?: string;
  private?: boolean;
  completionEvidence?: string;
  subtasks?: { title: string; done: boolean }[];
  comments?: { text: string; authorName?: string; at?: string }[];
  links?: { type: string; ref: string; label: string }[];
  history?: {
    status?: string;
    dueDate?: string;
    at?: string;
    reason?: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  lastMessageAt?: string;
  content?:
    | string
    | {
        text?: string;
        format?: {
          fontFamily?: string;
          fontSize?: number;
          bold?: boolean;
          italic?: boolean;
          underline?: boolean;
          align?: "left" | "center" | "right";
        };
        cells?: string[][];
        slides?: { title: string; body: string }[];
      };
  category?: string;
  body?: string;
  summary?: string;
  version?: number;
  publishedAt?: string;
  folder_id?: string;
  conv_code?: string;
  messages?: { role: string; content: string; createdAt?: string }[];
  lead_id?: string;
  converted_to_org_id?: string;
  amount?: number;
  price?: number;
  discountPct?: number;
  billingCycle?: string;
  previous_id?: string;
  approval_id?: string;
  revisionReason?: string;
  planName?: string;
  org_code?: string;
  mrr?: number;
  planSlug?: string;
  renewalDate?: string;
  country?: string;
  contacts?: { name?: string; email?: string; phone?: string; role?: string }[];
  onboarding?: {
    progress?: number;
    tasks?: { key: string; label: string; done: boolean }[];
  };
  text?: string;
  type?: string;
  actorName?: string;
  meta?: Record<string, unknown>;
  reference?: string;
  partner_id?: string;
  org_id?: string | { _id: string; name: string };
  ruleVersion?: number;
  rate?: number;
  basis?: number;
  commission?: number;
  commissionRate?: number;
  period?: string;
  gross?: number;
  net?: number;
  payout_code?: string;
  scheduledFor?: string;
  paidAt?: string;
  releasedAt?: string;
  evidence?: Record<string, unknown>;
  settlement?: string;
  flatRate?: number;
  eligibility?: string[];
  tiers?: { name: string; rate: number; minWins: number }[];
  result?: Record<string, unknown>;
  input?: Record<string, string>;
  template_key?: string;
  key?: string;
  fields?: string[];
  run_code?: string;
  impact?: { summary?: string };
  user_id?: string;
  member_code?: string;
  avatar?: { url?: string };
  file?: {
    url?: string;
    mime?: string;
    sizeBytes?: number;
    storageKey?: string;
  };
  tags?: string[];
  checksum?: string;
  usage?: { type: string; ref: string; label: string }[];
  versions?: {
    version?: number;
    content?: Entity["content"];
    at?: string;
    note?: string;
    url?: string;
  }[];
  importedFrom?: string;
  sharedWith?: { user_id: string; permission: string }[];
  assets?: string[];
  members?: { user_id: string; permission: string }[];
  visibility?: string;
  logos?: { label: string; url: string; variant: string }[];
  colors?: { name: string; hex: string; role: string }[];
  typography?: { heading?: string; body?: string };
  voice?: {
    tone?: string;
    personality?: string[];
    dos?: string[];
    donts?: string[];
    sample?: string;
  };
  task_code?: string;
  course_id?: Entity;
  courseKey?: string;
  learner_id?: string;
  required?: boolean;
  dueAt?: string;
  state?: string;
  completedLessons?: string[];
  lastLesson?: string;
  certificate_id?: string;
  attempts?: number;
  lessons?: {
    key: string;
    title: string;
    content: string;
    durationMinutes?: number;
  }[];
  quiz?: { key: string; prompt: string; options: string[] }[];
  passPercent?: number;
  maxAttempts?: number;
  certificateDays?: number;
  issuedAt?: string;
  expiresAt?: string;
  courseVersion?: number;
  score?: number;
  passed?: boolean;
}
export interface SalesContext {
  role: string;
  teamLead: boolean;
  name: string;
  memberId: string;
  permissions: string[];
  members: Entity[];
  stages: string[];
}
export interface Overview {
  leads: Entity[];
  organizations: Entity[];
  tasks: Entity[];
  territories: Entity[];
  accruals: Entity[];
  payouts: Entity[];
  activity: Entity[];
  refreshedAt: string;
  scope: string;
}
export interface Commissions {
  accruals: Entity[];
  payouts: Entity[];
  legacy: Entity[];
  rules: Entity[];
}
export type Preferences = Record<string, string | number | boolean>;
export const salesPath = (path: string) => `/sales-experience${path}`;
export async function getSales<T>(path: string): Promise<T> {
  return (await api.get(salesPath(path))).data.data;
}
export function useSales<T>(path: string, enabled = true) {
  return useQuery({
    queryKey: ["sales", path],
    queryFn: () => getSales<T>(path),
    enabled,
    refetchInterval: path === "/threads" ? 15000 : false,
  });
}
export function errorMessage(e: unknown) {
  return axios.isAxiosError(e)
    ? String(e.response?.data?.message || e.message)
    : e instanceof Error
      ? e.message
      : "Could not complete this request";
}
export function useSalesMutation() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: async ({
      path,
      method = "post",
      body,
    }: {
      path: string;
      method?: "post" | "patch" | "put" | "delete";
      body?: unknown;
    }) =>
      (await api.request({ url: salesPath(path), method, data: body })).data
        .data as Entity,
    onSuccess: () => {
      q.invalidateQueries({ queryKey: ["sales"] });
      q.invalidateQueries({ queryKey: ["learn"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
export const money = (n = 0) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
export const date = (s?: string) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })
    : "—";
export const label = (s?: string) =>
  String(s || "—")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const stages = [
  "new",
  "assigned",
  "contacted",
  "qualified",
  "discovery",
  "offer",
  "negotiation",
  "won",
  "lost",
  "disqualified",
];
