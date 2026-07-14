/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { type ComponentProps, useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnerApi, platformSettingsApi, userApi } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import {
  Bell,
  Building,
  Camera,
  DollarSign,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
  Save,
  Settings,
  Shield,
  Target,
} from "lucide-react";

const CATEGORIES = [
  { id: "profile", label: "Profile & Account", icon: Settings },
  { id: "business", label: "Business Information", icon: Building },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "leads", label: "Lead & Sales Settings", icon: Target },
  { id: "integrations", label: "Integrations", icon: Globe },
  { id: "security", label: "Security", icon: Shield },
  { id: "earnings", label: "Earnings & Billing", icon: DollarSign },
] as const;

const ALLOWED_SERVICES = [
  "Residential",
  "Retail",
  "Commercial Spa Service",
  "Vacation rental",
  "Religious Institution",
  "Health Clubs & Fitness Center",
  "Professional Sports Teams",
  "Manufacture Warranty",
  "Insurance Repair",
];

type CategoryId = (typeof CATEGORIES)[number]["id"];

const NOTIF_STORAGE_KEY = "sp-notification-prefs-v1";

const defaultNotifPrefs = {
  newLead: true,
  hotLead: true,
  newAppointment: true,
  appointmentCancelled: true,
  payoutAvailable: true,
  newMessage: true,
  weeklyDigest: false,
  emailChannel: true,
  smsChannel: false,
  pushChannel: true,
};

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("profile");

  const { data: profileResponse, isLoading: profileLoading } = useQuery({
    queryKey: ["sp-profile"],
    queryFn: () => userApi.getProfile().then((response) => response.data?.data),
  });

  const { data: dashboardResponse } = useQuery({
    queryKey: ["sp-partner-dashboard"],
    queryFn: () => partnerApi.getDashboard().then((response) => response.data?.data),
  });

  const { data: platformResponse } = useQuery({
    queryKey: ["sp-platform-settings"],
    queryFn: () => platformSettingsApi.get().then((response) => response.data?.data),
  });

  const profile = profileResponse;
  const partner = dashboardResponse?.partner;
  const metrics = dashboardResponse?.metrics;
  const platform = platformResponse;

  const tiles = [
    {
      label: "Notifications",
      value: "Enabled",
      sub: "Configure preferences",
      color: "bg-amber-600/20",
      icon: "🔔",
      target: "notifications" as CategoryId,
    },
    {
      label: "Two-Factor Auth",
      value: platform?.security?.requireTwoFactorForAdmins ? "Required" : "Optional",
      sub: "Manage 2FA",
      color: "bg-emerald-600/20",
      icon: "🛡️",
      target: "security" as CategoryId,
    },
    {
      label: "Active Leads",
      value: String(metrics?.totalLeads ?? "—"),
      sub: "View leads",
      color: "bg-blue-600/20",
      icon: "🎯",
      target: "leads" as CategoryId,
    },
    {
      label: "Commission",
      value: partner?.commissionRate ? `${partner.commissionRate}%` : "—",
      sub: "View Earnings",
      color: "bg-purple-600/20",
      icon: "💰",
      target: "earnings" as CategoryId,
    },
  ];

  return (
    <div>
      <Header
        title="Settings"
        subtitle="Manage your account preferences and partner settings."
      />
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map((tile) => (
            <button
              key={tile.label}
              onClick={() => setActiveCategory(tile.target)}
              className={`${tile.color} rounded-xl p-3 text-left transition-opacity hover:opacity-90`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-lg">{tile.icon}</span>
                <Badge variant="success" className="text-[9px]">
                  {tile.value}
                </Badge>
              </div>
              <p className="text-xs font-medium text-gray-200">{tile.label}</p>
              <p className="text-[10px] text-blue-400">{tile.sub}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          <Card>
            <CardContent className="p-2">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      activeCategory === category.id
                        ? "border border-blue-600/20 bg-blue-600/20 text-blue-400"
                        : "text-gray-400 hover:bg-[#1e2d40]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-xs">{category.label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            {activeCategory === "profile" ? (
              <ProfilePanel profile={profile} loading={profileLoading} />
            ) : null}
            {activeCategory === "business" ? (
              <BusinessPanel partner={partner} />
            ) : null}
            {activeCategory === "notifications" ? <NotificationsPanel /> : null}
            {activeCategory === "leads" ? (
              <LeadsPanel partner={partner} metrics={metrics} platform={platform} />
            ) : null}
            {activeCategory === "integrations" ? (
              <IntegrationsPanel platform={platform} />
            ) : null}
            {activeCategory === "security" ? <SecurityPanel /> : null}
            {activeCategory === "earnings" ? (
              <EarningsBillingPanel metrics={metrics} partner={partner} />
            ) : null}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Account Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {!profile ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <>
                    <Row label="Status">
                      <span className="text-emerald-400">● Active</span>
                    </Row>
                    <Row label="Member since">
                      {profile.createdAt ? formatDate(profile.createdAt) : "—"}
                    </Row>
                    <Row label="Email verified">
                      {profile.isEmailVerified ? "Yes" : "No"}
                    </Row>
                    <Row label="Role">{profile.role}</Row>
                    {partner?.tier ? <Row label="Tier">{partner.tier}</Row> : null}
                    {partner?.commissionRate != null ? (
                      <Row label="Commission">{partner.commissionRate}%</Row>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>

            <div className="rounded-xl bg-[#1e2d40] p-3">
              <p className="mb-2 text-xs text-gray-400">Need help?</p>
              <p className="mb-2 text-[10px] text-gray-500">
                Can't find what you're looking for? Contact our support team.
              </p>
              <Link href="/support">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-[#1e2d40] py-1.5 text-xs last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-200">{children}</span>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#1e2d40] py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-gray-200">{label}</p>
        {description ? (
          <p className="text-xs text-gray-500">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-5 w-10 shrink-0 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-[#2a3547]"
        }`}
      >
        <div
          className={`mx-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function ProfilePanel({
  profile,
  loading,
}: {
  profile: any;
  loading: boolean;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [service, setService] = useState("Residential");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhoneNumber(profile.phoneNumber || "");
      setService(profile.service || "Residential");
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phoneNumber", phoneNumber);
      formData.append("service", service);
      if (file) formData.append("profileImage", file);
      return userApi.updateProfile(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sp-profile"] });
      setFile(null);
      toast.success("Profile updated");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || "Failed to update profile"),
  });

  if (loading || !profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Profile & Account</CardTitle>
        <p className="text-xs text-gray-500">
          Manage your personal information and account settings.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14">
              {profile.profileImage?.url ? (
                <AvatarImage src={profile.profileImage.url} alt={profile.name} />
              ) : (
                <AvatarFallback className="text-lg">
                  {getInitials(profile.name || "U")}
                </AvatarFallback>
              )}
            </Avatar>
            <label className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-blue-600">
              <Camera className="h-3 w-3 text-white" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">Change Photo</p>
            <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
            {file ? (
              <p className="text-[10px] text-blue-400">Selected: {file.name}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <Input value={profile.email} readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number</Label>
            <Input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Service</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_SERVICES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          <Save className="mr-1 h-3.5 w-3.5" />
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

function BusinessPanel({ partner }: { partner: any }) {
  if (!partner) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-gray-500">
            Loading partner information...
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Business Information</CardTitle>
        <p className="text-xs text-gray-500">
          These details are managed by your admin. Contact support to change them.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Business name">{partner.businessName || "—"}</Row>
        <Row label="Tier">{partner.tier || "—"}</Row>
        <Row label="Status">{partner.status || "—"}</Row>
        <Row label="Commission rate">
          {partner.commissionRate != null ? `${partner.commissionRate}%` : "—"}
        </Row>
        <Row label="Territory">{partner.territory?.name || "Unassigned"}</Row>
        <Row label="Region">{partner.territory?.region || "—"}</Row>
        {partner.territory ? null : (
          <p className="text-xs text-gray-500">
            No territory assigned. Ask an admin to assign one in the Territories section.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationsPanel() {
  const [prefs, setPrefs] = useState(defaultNotifPrefs);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (raw) setPrefs({ ...defaultNotifPrefs, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
  }, []);

  const updatePref = (key: keyof typeof defaultNotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next));
      toast.success("Notification preference saved");
    } catch {
      // ignore
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Notifications</CardTitle>
        <p className="text-xs text-gray-500">
          Choose which events trigger a notification. Stored locally in this browser.
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">Events</p>
        <Toggle
          label="New lead assigned"
          checked={prefs.newLead}
          onChange={(value) => updatePref("newLead", value)}
        />
        <Toggle
          label="Hot lead alert"
          description="Notify when a lead's score is 70+."
          checked={prefs.hotLead}
          onChange={(value) => updatePref("hotLead", value)}
        />
        <Toggle
          label="New appointment booked"
          checked={prefs.newAppointment}
          onChange={(value) => updatePref("newAppointment", value)}
        />
        <Toggle
          label="Appointment cancelled"
          checked={prefs.appointmentCancelled}
          onChange={(value) => updatePref("appointmentCancelled", value)}
        />
        <Toggle
          label="Payout available"
          checked={prefs.payoutAvailable}
          onChange={(value) => updatePref("payoutAvailable", value)}
        />
        <Toggle
          label="New inbox message"
          checked={prefs.newMessage}
          onChange={(value) => updatePref("newMessage", value)}
        />
        <Toggle
          label="Weekly performance digest"
          checked={prefs.weeklyDigest}
          onChange={(value) => updatePref("weeklyDigest", value)}
        />

        <p className="mt-3 text-[11px] uppercase tracking-wide text-gray-500">Channels</p>
        <Toggle
          label="Email"
          checked={prefs.emailChannel}
          onChange={(value) => updatePref("emailChannel", value)}
        />
        <Toggle
          label="SMS"
          checked={prefs.smsChannel}
          onChange={(value) => updatePref("smsChannel", value)}
        />
        <Toggle
          label="Browser push"
          checked={prefs.pushChannel}
          onChange={(value) => updatePref("pushChannel", value)}
        />
      </CardContent>
    </Card>
  );
}

function LeadsPanel({
  partner,
  metrics,
  platform,
}: {
  partner: any;
  metrics: any;
  platform: any;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Lead & Sales Settings</CardTitle>
        <p className="text-xs text-gray-500">
          Your sales configuration set by the platform admin.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Commission rate">
          {partner?.commissionRate != null ? `${partner.commissionRate}%` : "—"}
        </Row>
        <Row label="Tier">{partner?.tier || "—"}</Row>
        <Row label="Total leads">{metrics?.totalLeads ?? "—"}</Row>
        <Row label="Conversion rate">{`${metrics?.conversionRate ?? 0}%`}</Row>
        <Row label="Deals closed">{metrics?.dealsClosed ?? "—"}</Row>
        {platform ? (
          <>
            <Row label="Default lead source">
              {platform.sales?.defaultLeadSource || "manual"}
            </Row>
            <Row label="Auto-assign leads">
              {platform.sales?.autoAssignLeads ? "Yes" : "No"}
            </Row>
            <Row label="Follow-up window">
              {`${platform.sales?.conversionFollowUpDays ?? 7} days`}
            </Row>
          </>
        ) : null}
        <div className="pt-2">
          <Link href="/leads">
            <Button size="sm" variant="outline" className="w-full">
              <Target className="mr-1 h-3.5 w-3.5" />
              Manage Leads
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function IntegrationsPanel({ platform }: { platform: any }) {
  const integrations = platform?.integrations || {};
  const rows = [
    {
      key: "googleCalendar",
      label: "Google Calendar",
      desc: "Sync appointments with your calendar.",
    },
    {
      key: "stripe",
      label: "Stripe",
      desc: "Accept payments through Stripe.",
    },
    {
      key: "twilio",
      label: "Twilio",
      desc: "Receive SMS notifications via Twilio.",
    },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Integrations</CardTitle>
        <p className="text-xs text-gray-500">
          Status of platform integrations. Toggles are managed by your admin.
        </p>
      </CardHeader>
      <CardContent>
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between border-b border-[#1e2d40] py-3 last:border-0"
          >
            <div>
              <p className="text-sm text-gray-200">{row.label}</p>
              <p className="text-xs text-gray-500">{row.desc}</p>
            </div>
            <Badge
              variant={integrations[row.key] ? "success" : "secondary"}
              className="text-[10px]"
            >
              {integrations[row.key] ? "Connected" : "Disabled"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SecurityPanel() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [twoFactor, setTwoFactor] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sp-2fa-pref");
      if (raw) setTwoFactor(raw === "1");
    } catch {
      // ignore
    }
  }, []);

  const passwordMutation = useMutation({
    mutationFn: () =>
      userApi.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Password changed");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || "Failed to change password"),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Current password</Label>
            <PasswordInput
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <PasswordInput
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm new password</Label>
            <PasswordInput
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
            />
          </div>
          <Button
            onClick={() => passwordMutation.mutate()}
            disabled={
              !currentPassword.trim() ||
              !newPassword.trim() ||
              !confirmNewPassword.trim() ||
              passwordMutation.isPending
            }
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            {passwordMutation.isPending ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <Toggle
            label="Enable 2FA preference"
            description="When enabled, you'll be reminded to set up 2FA at next login. Authenticator app integration coming soon."
            checked={twoFactor}
            onChange={(value) => {
              setTwoFactor(value);
              try {
                localStorage.setItem("sp-2fa-pref", value ? "1" : "0");
              } catch {
                // ignore
              }
              toast.info(value ? "2FA preference enabled" : "2FA preference disabled");
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PasswordInput(props: ComponentProps<typeof Input>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={showPassword ? "text" : "password"}
        className={`pr-10 ${props.className ?? ""}`.trim()}
      />
      <button
        type="button"
        onClick={() => setShowPassword((value) => !value)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function EarningsBillingPanel({
  metrics,
  partner,
}: {
  metrics: any;
  partner: any;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Earnings & Billing</CardTitle>
        <p className="text-xs text-gray-500">
          Snapshot of your earnings. Use the Earnings page for full management.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Total commission">
          {metrics?.totalCommission != null
            ? formatCurrency(metrics.totalCommission)
            : "—"}
        </Row>
        <Row label="This month">
          {metrics?.monthlyCommission != null
            ? formatCurrency(metrics.monthlyCommission)
            : "—"}
        </Row>
        <Row label="Deals closed">{metrics?.dealsClosed ?? "—"}</Row>
        <Row label="Commission rate">
          {partner?.commissionRate != null ? `${partner.commissionRate}%` : "—"}
        </Row>
        <div className="pt-2">
          <Link href="/earnings">
            <Button size="sm" variant="outline" className="w-full">
              <DollarSign className="mr-1 h-3.5 w-3.5" />
              Go to Earnings
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
