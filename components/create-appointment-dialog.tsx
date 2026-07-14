/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { appointmentsApi, calendarApi, customersApi, employeesApi } from "@/lib/api";
import { asArray } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Check, ChevronDown, Clock, Search } from "lucide-react";
import { DatePickerPopover } from "@/components/date-picker-popover";
import { TimePickerPopover } from "@/components/time-picker-popover";

const DEFAULT_LOCATION = "Fade Masters Barbershop";

const COLOR_SWATCHES = [
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#ea580c",
  "#db2777",
  "#0891b2",
  "#6b7280",
];

const DURATION_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
  { label: "120 min", value: 120 },
];

const REPEAT_OPTIONS = [
  { label: "Does not repeat", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const REMINDER_OPTIONS = [
  { label: "No reminder", value: "none" },
  { label: "At start time", value: "0" },
  { label: "5 minutes before", value: "5" },
  { label: "15 minutes before", value: "15" },
  { label: "30 minutes before", value: "30" },
  { label: "1 hour before", value: "60" },
];

const LOCATION_OPTIONS = [
  "Fade Masters Barbershop",
  "Downtown Salon",
  "Mobile Visit",
  "Customer Location",
];

const APPOINTMENT_TYPE_OPTIONS = [
  "Onboarding",
  "Consultation",
  "Review",
  "Strategy Call",
  "Follow-up",
  "Internal Meeting",
];

const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toTimeValue = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const addMinutes = (timeValue: string, minutes: number) => {
  const [hours, mins] = timeValue.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const safeTotal = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const newHours = Math.floor(safeTotal / 60);
  const newMins = safeTotal % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
};

const minutesBetween = (start: string, end: string) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const format12Hour = (value: string) => {
  if (!value) return "--:--";
  const [hStr = "00", mStr = "00"] = value.split(":");
  let hours = Number(hStr);
  const minutes = Number(mStr);
  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${meridiem}`;
};

const formatDateOnlyLabel = (value: string) => {
  if (!value) return "Pick a date";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  if (Number.isNaN(date.getTime())) return "Pick a date";
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date | null;
  onCreated?: () => void;
};

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  defaultDate = null,
  onCreated,
}: Props) {
  const queryClient = useQueryClient();

  const now = useMemo(() => new Date(), []);
  const oneHourLater = useMemo(() => new Date(now.getTime() + 60 * 60 * 1000), [now]);
  const defaultDateValue = useMemo(
    () => toDateValue(defaultDate || now),
    [defaultDate, now]
  );

  const [title, setTitle] = useState("");
  const [customer, setCustomer] = useState("");
  const [employee, setEmployee] = useState("");
  const [appointmentType, setAppointmentType] = useState(APPOINTMENT_TYPE_OPTIONS[0]);
  const [date, setDate] = useState(defaultDateValue);
  const [startTime, setStartTime] = useState(toTimeValue(now));
  const [endTime, setEndTime] = useState(toTimeValue(oneHourLater));
  const [duration, setDuration] = useState(60);
  const [allDay, setAllDay] = useState(false);
  const [repeat, setRepeat] = useState("none");
  const [reminder, setReminder] = useState("15");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState(COLOR_SWATCHES[0]);

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [assignedUserOpen, setAssignedUserOpen] = useState(false);
  const [assignedUserSearch, setAssignedUserSearch] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: customersResponse } = useQuery({
    queryKey: ["calendar-create-customers"],
    queryFn: () => customersApi.getAll({ limit: 100 }).then((response) => response.data),
    enabled: open,
  });

  const { data: employeesResponse } = useQuery({
    queryKey: ["calendar-create-employees"],
    queryFn: () => employeesApi.getAll({ limit: 100 }).then((response) => response.data),
    enabled: open,
  });

  const customerOptions = asArray(
    customersResponse?.data?.customers ||
      customersResponse?.data?.data?.customers ||
      customersResponse?.data?.data ||
      customersResponse?.data ||
      customersResponse
  );
  const employeeOptions = asArray(
    employeesResponse?.data?.employees ||
      employeesResponse?.data?.data?.employees ||
      employeesResponse?.data?.data ||
      employeesResponse?.data ||
      employeesResponse
  );
  const assignedUserOptions = employeeOptions.map((item: any, index: number) => {
    const user = item.userId || item.user || item;
    const id = String(user._id || item._id || item.id || index);
    const name = user.name || item.name || user.email || "User";
    const email = user.email || item.email || "";
    const role = String(user.role || item.role || "calendar user").replace(/_/g, " ");
    const label = `${name} - ${role}`;
    const searchText = `${name} ${email} ${role}`.toLowerCase();

    return { id, label, searchText };
  });
  const filteredAssignedUserOptions = assignedUserOptions.filter((option) =>
    option.searchText.includes(assignedUserSearch.trim().toLowerCase())
  );
  const selectedAssignedUser = assignedUserOptions.find((option) => option.id === employee);

  const resetForm = () => {
    const current = new Date();
    const later = new Date(current.getTime() + 60 * 60 * 1000);
    setTitle("");
    setCustomer("");
    setEmployee("");
    setAppointmentType(APPOINTMENT_TYPE_OPTIONS[0]);
    setDate(defaultDateValue);
    setStartTime(toTimeValue(current));
    setEndTime(toTimeValue(later));
    setDuration(60);
    setAllDay(false);
    setRepeat("none");
    setReminder("15");
    setLocation(DEFAULT_LOCATION);
    setNotes("");
    setColor(COLOR_SWATCHES[0]);
    setAssignedUserOpen(false);
    setAssignedUserSearch("");
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
      setSubmitError(null);
      setAssignedUserOpen(false);
      setAssignedUserSearch("");
    }
    onOpenChange(nextOpen);
  };

  const handleDurationChange = (value: number) => {
    setDuration(value);
    setEndTime(addMinutes(startTime, value));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      setSubmitError(null);
      const effectiveStart = allDay ? "08:00" : startTime;
      const effectiveEnd = allDay ? "17:00" : endTime;

      const response = await appointmentsApi.create({
        appointmentDate: date,
        startTime: effectiveStart,
        endTime: effectiveEnd,
        customer,
        employee,
        bookingNotes: notes,
        title,
        service: appointmentType,
        location,
        color,
        reminder,
        repeat,
      });

      try {
        await calendarApi.sync();
      } catch {
        // sync is best-effort
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-insights"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-appointments"] });
      toast.success("Appointment created");
      setSubmitError(null);
      onOpenChange(false);
      onCreated?.();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || "Failed to create appointment";
      setSubmitError(message);
      toast.error(message);
    },
  });

  const canSubmit =
    Boolean(date) &&
    Boolean(customer) &&
    Boolean(employee) &&
    (allDay || (Boolean(startTime) && Boolean(endTime) && minutesBetween(startTime, endTime) > 0)) &&
    !createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400">
              <CalendarDays className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">Create Appointment</DialogTitle>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            {/* Customer */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Customer</label>
              <Select value={customer} onValueChange={setCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.length === 0 ? (
                    <SelectItem value="no-customers" disabled>
                      No customers found
                    </SelectItem>
                  ) : null}
                  {customerOptions.map((item: any, index: number) => {
                    const id = String(item._id || item.id || index);
                    const name = item.name || item.fullName || item.email || "Customer";
                    return (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned User */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Assigned User</label>
              <div
                className="relative"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setAssignedUserOpen(false);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={() => setAssignedUserOpen((current) => !current)}
                  className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[#2a3547] bg-[#0d1526] px-3 py-2 text-left text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className={selectedAssignedUser ? "truncate" : "truncate text-gray-500"}>
                    {selectedAssignedUser?.label || "Select partner or employee..."}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
                {assignedUserOpen ? (
                  <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-[#2a3547] bg-[#0d1a2d] text-gray-200 shadow-lg">
                    <div className="border-b border-[#1e2d40] p-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                        <input
                          value={assignedUserSearch}
                          onChange={(event) => setAssignedUserSearch(event.target.value)}
                          placeholder="Search users..."
                          className="h-9 w-full rounded-md border border-[#2a3547] bg-[#0d1526] pl-9 pr-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                      {assignedUserOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No users found</div>
                      ) : null}
                      {assignedUserOptions.length > 0 && filteredAssignedUserOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No matching users</div>
                      ) : null}
                      {filteredAssignedUserOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setEmployee(option.id);
                            setAssignedUserOpen(false);
                            setAssignedUserSearch("");
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-[#1e2d40] focus:bg-[#1e2d40]"
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                            {employee === option.id ? <Check className="h-4 w-4" /> : null}
                          </span>
                          <span className="truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Date</label>
              <button
                type="button"
                onClick={() => setDatePickerOpen(true)}
                className="flex h-10 w-full items-center gap-2 rounded-lg border border-[#2a3547] bg-[#0d1526] px-3 text-left text-sm text-gray-200 hover:bg-[#162338] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
                <span>{formatDateOnlyLabel(date)}</span>
              </button>
              <p className="text-[10px] text-gray-500">
                {formatDateLabel(new Date(date))}
              </p>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Time</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => !allDay && setTimePickerOpen(true)}
                  disabled={allDay}
                  className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-[#2a3547] bg-[#0d1526] px-3 text-left text-sm text-gray-200 hover:bg-[#162338] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                  <span>{format12Hour(startTime)}</span>
                </button>
                <span className="text-xs text-gray-500">-</span>
                <button
                  type="button"
                  onClick={() => !allDay && setTimePickerOpen(true)}
                  disabled={allDay}
                  className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-[#2a3547] bg-[#0d1526] px-3 text-left text-sm text-gray-200 hover:bg-[#162338] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                  <span>{format12Hour(endTime)}</span>
                </button>
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(event) => {
                      const next = event.target.checked;
                      setAllDay(next);
                      if (next) {
                        setStartTime("08:00");
                        setEndTime("17:00");
                        setDuration(540);
                      }
                    }}
                    className="h-3.5 w-3.5 rounded border-[#2a3547] bg-[#0d1526]"
                  />
                  All day
                </label>
              </div>
            </div>

            {/* Repeat */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">
                Repeat <span className="text-gray-500">(Optional)</span>
              </label>
              <Select value={repeat} onValueChange={setRepeat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPEAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reminder */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">
                Reminder <span className="text-gray-500">(Optional)</span>
              </label>
              <Select value={reminder} onValueChange={setReminder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {/* Appointment Type */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Appointment Type</label>
              <Select value={appointmentType} onValueChange={setAppointmentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-medium text-gray-300">
                <span>Title</span>
                <span className="text-[10px] text-gray-500">
                  {title.length}/100
                </span>
              </label>
              <Input
                value={title}
                maxLength={100}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Add a title for this appointment..."
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Duration</label>
              <Select
                value={String(duration)}
                onValueChange={(value) => handleDurationChange(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`${duration} min`} />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.every((option) => option.value !== duration) ? (
                    <SelectItem value={String(duration)}>{duration} min</SelectItem>
                  ) : null}
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Location</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-medium text-gray-300">
                <span>
                  Notes <span className="text-gray-500">(Optional)</span>
                </span>
                <span className="text-[10px] text-gray-500">
                  {notes.length}/500
                </span>
              </label>
              <textarea
                value={notes}
                maxLength={500}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add notes about this appointment..."
                className="min-h-[120px] w-full rounded-lg border border-[#2a3547] bg-[#0d1526] px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Color</label>
              <div className="flex flex-wrap gap-3">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setColor(swatch)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform ${
                      color === swatch
                        ? "scale-105 border-white"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: swatch }}
                  >
                    {color === swatch ? (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {submitError ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full bg-red-500/30 text-center text-[10px] leading-4 text-red-200">
              !
            </span>
            <span>{submitError}</span>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 border-t border-[#1e2d40] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[11px] text-gray-500">
            {title ? `Booking: ${title}` : "Add a title to proceed"}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!canSubmit}
            >
              {createMutation.isPending ? "Creating..." : "Create Appointment"}
            </Button>
          </div>
        </div>

        <DatePickerPopover
          open={datePickerOpen}
          onOpenChange={setDatePickerOpen}
          value={date}
          onChange={setDate}
        />

        <TimePickerPopover
          open={timePickerOpen}
          onOpenChange={setTimePickerOpen}
          startValue={startTime}
          endValue={endTime}
          onChange={(start, end) => {
            setStartTime(start);
            setEndTime(end);
            const diff = minutesBetween(start, end);
            if (diff > 0) setDuration(diff);
          }}
          mode="12"
        />
      </DialogContent>
    </Dialog>
  );
}
