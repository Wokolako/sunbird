"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Printer, Send, ShieldCheck, RefreshCw, Check, Calendar, ChevronDown, ChevronUp } from "lucide-react";

type Row = Record<string, any>;
type Section = "operations" | "rates" | "team" | "reports" | "finance";
const money = (minor = 0) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(minor / 100);
const values = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); return Object.fromEntries(new FormData(event.currentTarget)); };

type StaffPermissionKey =
  | "canManageRates"
  | "canManageInventory"
  | "canAssignRooms"
  | "canManageTasks"
  | "canViewFinancials"
  | "canMessageGuests";

const PERMISSION_LABELS: Record<StaffPermissionKey, { label: string; desc: string }> = {
  canManageRates: { label: "Rates & Pricing", desc: "Create rate plans & seasonal rates" },
  canManageInventory: { label: "Room Availability", desc: "Adjust available units & close dates" },
  canAssignRooms: { label: "Room Assignment", desc: "Assign physical rooms to reservations" },
  canManageTasks: { label: "Housekeeping & Tasks", desc: "Create tasks & update room cleanliness" },
  canViewFinancials: { label: "Financial Reports", desc: "View revenue, ADR, RevPAR & payouts" },
  canMessageGuests: { label: "Guest Messaging", desc: "Reply to enquiries and chat with guests" },
};

export function ManagerPmsPanels({ section, propertyId, rooms, finance, refreshWorkspace }: { section: Section; propertyId: string; rooms: Row[]; finance: Row; refreshWorkspace: () => Promise<void> }) {
  const [data, setData] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeMemberPermissions, setActiveMemberPermissions] = useState<string | null>(null);
  const [permissionDraft, setPermissionDraft] = useState<Record<string, boolean>>({});
  const [reportPeriod, setReportPeriod] = useState<"7" | "30" | "90">("30");

  const load = useCallback(async () => {
    if (!propertyId || section === "finance") return;
    const response = await fetch(`/api/backend/api/pms/properties/${propertyId}/dashboard`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load property operations.");
    setData(result);
  }, [propertyId, section]);

  useEffect(() => {
    void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load this property."));
  }, [load]);

  async function pms(payload: Row, success: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/backend/api/pms/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, propertyId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(success);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function platform(payload: Row, success: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/backend/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result?.url || result?.data?.url) {
        window.location.assign(result.url || result.data.url);
        return;
      }
      setMessage(success);
      await refreshWorkspace();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  function downloadReportCsv() {
    const report = data?.report || {};
    const propertyName = rooms[0]?.property_name || "Property";
    const rows = [
      ["Vabbot Resorts PMS - Operating & Financial Report"],
      ["Property ID", propertyId],
      ["Period", `Last ${reportPeriod} Days`],
      ["Generated At", new Date().toISOString()],
      [],
      ["Key Performance Indicators"],
      ["Metric", "Value"],
      ["Occupancy Rate", `${report.occupancyPercent || 0}%`],
      ["Gross Revenue", `£${((report.revenueMinor || 0) / 100).toFixed(2)}`],
      ["Average Daily Rate (ADR)", `£${((report.adrMinor || 0) / 100).toFixed(2)}`],
      ["Revenue Per Available Room (RevPAR)", `£${((report.revparMinor || 0) / 100).toFixed(2)}`],
      ["Total Reservations", report.bookings || 0],
      ["Sold Room Nights", report.roomNights || 0],
      ["Available Room Nights", report.availableRoomNights || 0],
      [],
      ["Room Inventory Status"],
      ["Room Label", "Room Type", "Status"],
      ...(data?.units || []).map((u: Row) => [u.label, u.room_name, u.status]),
      [],
      ["Upcoming Reservations"],
      ["Guest Name", "Room", "Check In", "Check Out", "Status", "Total"],
      ...(data?.reservations || []).map((r: Row) => [r.guest_name, r.room_name, r.check_in, r.check_out, r.status, `£${(r.total_minor / 100).toFixed(2)}`]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map((cell: any) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pms-operating-report-${propertyId}-${reportPeriod}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadPayoutCsv() {
    const payouts = finance?.payouts || [];
    const rows = [
      ["Vabbot Resorts - Payout History Statement"],
      ["Property ID", propertyId],
      ["Generated At", new Date().toISOString()],
      [],
      ["Reference", "Period Start", "Period End", "Gross Revenue", "Commission Fee", "Net Payout", "Status"],
      ...payouts.map((p: Row) => [
        p.reference,
        p.period_start,
        p.period_end,
        p.gross_minor ? `£${(p.gross_minor / 100).toFixed(2)}` : "",
        p.fee_minor ? `£${(p.fee_minor / 100).toFixed(2)}` : "",
        `£${(p.net_minor / 100).toFixed(2)}`,
        p.status,
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map((cell: any) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payout-history-${propertyId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function togglePermissionsEditor(member: Row) {
    if (activeMemberPermissions === member.id) {
      setActiveMemberPermissions(null);
    } else {
      setActiveMemberPermissions(member.id);
      setPermissionDraft(member.permissions || {});
    }
  }

  async function saveStaffPermissions(userId: string) {
    await pms({
      action: "update-staff-permissions",
      userId,
      permissions: permissionDraft,
    }, "Staff permissions saved successfully.");
    setActiveMemberPermissions(null);
  }

  if (!propertyId && section !== "finance") return <div className="card"><h2>Add a property first</h2><p>PMS tools become available after a property has been created.</p></div>;

  return (
    <section className="stack" id={`manager-panel-${section}`} role="tabpanel">
      {error && <p className="status error" role="alert">{error}</p>}
      {message && <p className="status">{message}</p>}

      {section === "operations" && (
        <>
          <div className="grid-2">
            <div className="card"><h2>Arrivals today</h2><BookingRows rows={data?.arrivals || []} empty="No arrivals today." /></div>
            <div className="card"><h2>Departures today</h2><BookingRows rows={data?.departures || []} empty="No departures today." /></div>
          </div>
          <div className="card">
            <h2>Room assignment</h2>
            <p>Assign a physical room to each upcoming reservation. Occupied dates are checked before saving.</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Guest</th><th>Dates</th><th>Room type</th><th>Physical room</th></tr>
                </thead>
                <tbody>
                  {(data?.reservations || []).map((booking: Row) => (
                    <tr key={booking.id}>
                      <td>{booking.guest_name}</td>
                      <td>{booking.check_in} to {booking.check_out}</td>
                      <td>{booking.room_name}</td>
                      <td>
                        <select
                          aria-label={`Room for ${booking.guest_name}`}
                          value={booking.room_unit_id || ""}
                          disabled={busy}
                          onChange={(event) => void pms({ action: "assign-room", reservationId: booking.id, unitId: event.target.value }, "Room assigned.")}
                        >
                          <option value="">Choose room</option>
                          {(data?.units || []).filter((unit: Row) => unit.room_id === booking.room_id).map((unit: Row) => (
                            <option key={unit.id} value={unit.id}>{unit.label} · {unit.status.replaceAll("_", " ")}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid-2">
            <div className="card">
              <h2>Room status</h2>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Room</th><th>Type</th><th>Status</th></tr></thead>
                  <tbody>
                    {(data?.units || []).map((unit: Row) => (
                      <tr key={unit.id}>
                        <td>{unit.label}</td>
                        <td>{unit.room_name}</td>
                        <td>
                          <select
                            value={unit.status === "vacant_clean" ? "clean" : unit.status === "vacant_dirty" ? "dirty" : unit.status}
                            disabled={busy}
                            onChange={(event) => void pms({ action: "set-unit-status", unitId: unit.id, status: event.target.value }, "Room status updated.")}
                          >
                            <option value="clean">Vacant clean</option>
                            <option value="dirty">Vacant dirty</option>
                            <option value="occupied">Occupied</option>
                            <option value="cleaning">Cleaning</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card">
              <h2>Housekeeping &amp; maintenance</h2>
              <form onSubmit={(event) => { const input = values(event); void pms({ action: "create-task", ...input }, "Task created."); event.currentTarget.reset(); }}>
                <div className="form-grid">
                  <label className="field">Task type<select name="type"><option value="housekeeping">Housekeeping</option><option value="maintenance">Maintenance</option></select></label>
                  <label className="field">Room<select name="roomUnitId"><option value="">General property task</option>{(data?.units || []).map((unit: Row) => <option value={unit.id} key={unit.id}>{unit.label}</option>)}</select></label>
                  <label className="field full">Work required<input name="note" required /></label>
                </div>
                <div className="form-actions"><button className="button" disabled={busy}>Create task</button></div>
              </form>
              {(data?.tasks || []).map((task: Row) => (
                <div className="toolbar" key={task.id}>
                  <span><strong>{task.type}</strong> · {task.unit_label || "Property"}<br/><small>{task.note}</small></span>
                  <button className="button secondary small" disabled={busy} onClick={() => void pms({ action: "update-task-status", taskId: task.id, status: "completed" }, "Task completed.")}>Complete</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {section === "rates" && (
        <div className="grid-2">
          <div className="card">
            <h2>Rate plans</h2>
            <form onSubmit={(event) => void pms({ action: "create-rate-plan", ...values(event) }, "Rate plan created.")}>
              <div className="form-grid">
                <label className="field full">Plan name<input name="name" placeholder="Flexible" required /></label>
                <label className="field">Minimum stay<input name="minimumStay" type="number" min="1" defaultValue="1" required /></label>
                <label className="field">Tax (%)<input name="taxPercent" type="number" min="0" max="100" step="0.01" defaultValue="0" onChange={(e) => { const hidden = e.currentTarget.form?.elements.namedItem("taxBps") as HTMLInputElement; if (hidden) hidden.value = String(Math.round(Number(e.currentTarget.value) * 100)); }} /><input name="taxBps" type="hidden" defaultValue="0" /></label>
                <label className="field full">Service fee (£)<input name="serviceFee" type="number" min="0" step="0.01" defaultValue="0" /></label>
              </div>
              <button className="button" disabled={busy}>Add rate plan</button>
            </form>
            {(data?.ratePlans || []).map((plan: Row) => <p key={plan.id}><strong>{plan.name}</strong> · {plan.minimum_stay} night minimum · {plan.tax_bps / 100}% tax · {money(plan.service_fee_minor)} fee</p>)}
          </div>
          <div className="card">
            <h2>Seasonal pricing</h2>
            <form onSubmit={(event) => void pms({ action: "create-rate-rule", ...values(event) }, "Seasonal rate saved.")}>
              <div className="form-grid">
                <label className="field">Room type<select name="roomId">{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label>
                <label className="field">Rate plan<select name="ratePlanId">{(data?.ratePlans || []).map((plan: Row) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>
                <label className="field">From<input name="start" type="date" required /></label>
                <label className="field">Through<input name="end" type="date" required /></label>
                <label className="field full">Nightly price (£)<input name="nightlyRate" type="number" min="1" step="0.01" required /></label>
              </div>
              <button className="button" disabled={busy || !data?.ratePlans?.length}>Add seasonal rate</button>
            </form>
            {(data?.rateRules || []).map((rule: Row) => <p key={rule.id}><strong>{rule.room_name}</strong> · {rule.start_date} to {rule.end_date} · {money(rule.nightly_rate_minor)} · {rule.rate_plan_name}</p>)}
          </div>
        </div>
      )}

      {section === "team" && (
        <div className="grid-2">
          <div className="card">
            <h2>Property staff &amp; permissions</h2>
            <p style={{ margin: "0 0 1rem", fontSize: "13px", color: "var(--color-muted, #64748b)" }}>
              Manage team access. Configure fine-grained permissions per staff member below.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.staff || []).map((member: Row) => (
                    <>
                      <tr key={member.id}>
                        <td>
                          <strong>{member.name || member.email}</strong>
                          <br /><small style={{ color: "#64748b" }}>{member.email}</small>
                        </td>
                        <td>
                          <span style={{ textTransform: "capitalize", fontWeight: 600 }}>
                            {member.role.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: member.active ? "#dcfce7" : "#fef3c7",
                            color: member.active ? "#166534" : "#92400e",
                          }}>
                            {member.active ? "Active" : "Invited"}
                          </span>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            className="button secondary small"
                            style={{ marginRight: "4px" }}
                            onClick={() => togglePermissionsEditor(member)}
                          >
                            <ShieldCheck size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "2px" }} />
                            Permissions
                          </button>
                          <button
                            type="button"
                            className="button secondary small"
                            disabled={busy}
                            onClick={() => void pms({ action: "resend-invite", membershipId: member.id }, `Invitation email resent to ${member.email}.`)}
                          >
                            <Send size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "2px" }} />
                            Invite
                          </button>
                        </td>
                      </tr>
                      {activeMemberPermissions === member.id && (
                        <tr key={`${member.id}-perms`} style={{ background: "#f8fafc" }}>
                          <td colSpan={4} style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <strong>Fine-Grained Permissions for {member.name || member.email}</strong>
                              <button
                                type="button"
                                className="button small"
                                disabled={busy}
                                onClick={() => void saveStaffPermissions(member.user_id)}
                              >
                                Save Permissions
                              </button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                              {(Object.keys(PERMISSION_LABELS) as StaffPermissionKey[]).map((key) => (
                                <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                                  <input
                                    type="checkbox"
                                    checked={permissionDraft[key] ?? member.permissions?.[key] ?? false}
                                    onChange={(e) => setPermissionDraft((prev) => ({ ...prev, [key]: e.target.checked }))}
                                    style={{ marginTop: "2px" }}
                                  />
                                  <span>
                                    <strong>{PERMISSION_LABELS[key].label}</strong>
                                    <br /><span style={{ color: "#64748b", fontSize: "11px" }}>{PERMISSION_LABELS[key].desc}</span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2>Emailed staff invitation</h2>
            <p>Invite a colleague to your property team. A branded invitation email with login link is automatically dispatched.</p>
            <form onSubmit={(event) => void pms({ action: "upsert-staff", ...values(event) }, "Staff invited and invitation email dispatched.")}>
              <label className="field">Account email<input name="email" type="email" placeholder="colleague@example.com" required /></label>
              <label className="field">Property role
                <select name="role">
                  <option value="manager">Manager</option>
                  <option value="front_desk">Front desk</option>
                  <option value="housekeeper">Housekeeper</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </label>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px", borderRadius: "6px", fontSize: "12px", color: "#166534", margin: "8px 0" }}>
                ✨ <strong>Automatic Account &amp; Email:</strong> An account will be created if they do not yet exist, and an invitation email will be delivered to their inbox.
              </div>
              <button className="button" disabled={busy}>
                <Send size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                Send Staff Invitation
              </button>
            </form>
          </div>
        </div>
      )}

      {section === "reports" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Period:</span>
              {(["7", "30", "90"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`button small ${reportPeriod === period ? "" : "secondary"}`}
                  onClick={() => setReportPeriod(period)}
                >
                  {period} Days
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="button secondary small" onClick={downloadReportCsv}>
                <Download size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                Download CSV Report
              </button>
              <button type="button" className="button secondary small" onClick={() => window.print()}>
                <Printer size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                Print / Save PDF
              </button>
            </div>
          </div>

          <div className="metric-grid">
            <Metric label="Occupancy" value={`${data?.report?.occupancyPercent || 0}%`} />
            <Metric label={`Revenue (${reportPeriod} days)`} value={money(data?.report?.revenueMinor)} />
            <Metric label="ADR (Average Daily Rate)" value={money(data?.report?.adrMinor)} />
            <Metric label="RevPAR" value={money(data?.report?.revparMinor)} />
          </div>

          <div className="card" id="printable-operating-report">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>{reportPeriod}-Day Operating &amp; Performance Summary</h2>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Live Neon DB Data</span>
            </div>
            <p>
              {data?.report?.bookings || 0} reservations account for {data?.report?.roomNights || 0} occupied room nights out of {data?.report?.availableRoomNights || 0} available room nights.
            </p>
            <div className="grid-2" style={{ marginTop: "1rem" }}>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 4px 0" }}>Room Inventory Overview</h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  {(data?.units || []).length} total physical units across {rooms.length} room categories.
                </p>
              </div>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 4px 0" }}>Financial Performance</h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Average revenue per occupied night: {money(data?.report?.adrMinor)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {section === "finance" && (
        <>
          <div className="metric-grid">
            <Metric label="Gross revenue" value={money(finance?.summary?.grossMinor)} />
            <Metric label="Refunded" value={money(finance?.summary?.refundedMinor)} />
            <Metric label="Platform commission" value={money(finance?.summary?.commissionMinor)} />
            <Metric label="Paid out" value={money(finance?.summary?.paidOutMinor)} />
          </div>

          <div className="card">
            <div className="toolbar" style={{ flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2>Automated payout schedule</h2>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
                  Scheduled payouts are automatically generated by the background worker according to your property schedule (Weekly / 7-day reserve).
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => void platform({ action: "run-payouts", propertyId }, "Automated payout cycle evaluated.")}
                >
                  <RefreshCw size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                  Run Payouts Check
                </button>
                <button
                  type="button"
                  className="button"
                  disabled={busy}
                  onClick={() => void platform({ action: "connect-onboarding" }, "Stripe onboarding opened.")}
                >
                  Set up Stripe payouts
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Payments and refunds</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Guest</th><th>Property</th><th>Paid</th><th>Commission</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {(finance?.payments || []).map((payment: Row) => (
                    <tr key={payment.id}>
                      <td>{payment.guest_name}</td>
                      <td>{payment.property_name}</td>
                      <td>{money(payment.amount_minor)}</td>
                      <td>{money(payment.application_fee_minor)}</td>
                      <td>{payment.status}</td>
                      <td>
                        {payment.refundable_minor > 0 && (
                          <button className="button secondary small" disabled={busy} onClick={() => void platform({ action: "request-refund", reservationId: payment.reservation_id }, "Refund sent for administrator approval.")}>
                            Request refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h2>Payout history</h2>
              {(finance?.payouts || []).length > 0 && (
                <button type="button" className="button secondary small" onClick={downloadPayoutCsv}>
                  <Download size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                  Export CSV
                </button>
              )}
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Reference</th><th>Period</th><th>Net payout</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {(finance?.payouts || []).map((payout: Row) => (
                    <tr key={payout.id}>
                      <td>{payout.reference}</td>
                      <td>{payout.period_start} to {payout.period_end}</td>
                      <td>{money(payout.net_minor)}</td>
                      <td>{payout.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
function BookingRows({ rows, empty }: { rows: Row[]; empty: string }) { return rows.length ? <div className="table-wrap"><table><thead><tr><th>Guest</th><th>Room</th><th>Time</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.guest_name}</td><td>{row.room_unit_name || row.room_name}</td><td>{row.check_in} to {row.check_out}</td></tr>)}</tbody></table></div> : <p className="empty-state">{empty}</p>; }
