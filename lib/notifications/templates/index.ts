export function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fa; color: #1a202c; margin: 0; padding: 20px; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; font-family: Georgia, serif; font-size: 24px; color: #ffffff; font-weight: normal; letter-spacing: 0.5px; }
    .header span { color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; }
    .content { padding: 32px; }
    .h2 { font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #0f172a; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }
    .details-row:last-child { border-bottom: none; font-weight: bold; font-size: 16px; padding-top: 12px; }
    .label { color: #64748b; }
    .val { color: #0f172a; text-align: right; }
    .btn { display: inline-block; background: #0f172a; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; margin-top: 20px; text-align: center; }
    .footer { background: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 4px; background: #dcfce7; color: #166534; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span>VABBOT RESORTS</span>
      <h1>Hospitality & Stays</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Vabbot Resorts Ltd. All rights reserved.</p>
      <p>Need assistance? Contact our concierge team or check your bookings online.</p>
    </div>
  </div>
</body>
</html>`;
}

function escape(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function bookingConfirmationTemplate(params: {
  guestName: string;
  referenceCode: string;
  propertyName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: string;
  checkInTime?: string;
  checkOutTime?: string;
  address?: string;
}): string {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge">Booking Confirmed</span>
      <h2 style="margin: 12px 0 4px 0; color: #0f172a;">Your stay is confirmed!</h2>
      <p style="margin: 0; color: #64748b;">Dear ${escape(params.guestName)}, we look forward to welcoming you.</p>
    </div>

    <div class="card">
      <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Reservation Details</div>
      <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">${escape(params.propertyName)}</div>
      <div style="font-size: 14px; color: #475569; margin-bottom: 16px;">${escape(params.roomName)}</div>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Booking Reference</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; font-family: monospace;">${escape(params.referenceCode)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Check-in</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${escape(params.checkIn)} (${escape(params.checkInTime || "14:00")})</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Check-out</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${escape(params.checkOut)} (${escape(params.checkOutTime || "11:00")})</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Guests</td>
          <td style="padding: 8px 0; text-align: right;">${params.guests} guest${params.guests > 1 ? "s" : ""}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0 4px 0; color: #0f172a; font-weight: bold; font-size: 16px;">Total Paid</td>
          <td style="padding: 12px 0 4px 0; text-align: right; color: #0f172a; font-weight: bold; font-size: 18px;">${escape(params.totalAmount)}</td>
        </tr>
      </table>
    </div>

    ${params.address ? `
    <div style="margin: 20px 0; font-size: 14px; color: #475569;">
      <strong>Property Address:</strong><br>${escape(params.address)}
    </div>` : ""}

    <div style="text-align: center; margin-top: 28px;">
      <a href="http://localhost:3000/bookings" class="btn">View Booking &amp; Download Invoice</a>
    </div>
  `;
  return baseLayout("Booking Confirmation - " + params.referenceCode, content);
}

export function paymentReceiptTemplate(params: {
  customerName: string;
  invoiceNumber: string;
  referenceCode: string;
  propertyName: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  paymentMethod: string;
  date: string;
}): string {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge">Payment Succeeded</span>
      <h2 style="margin: 12px 0 4px 0; color: #0f172a;">Official Payment Receipt</h2>
      <p style="margin: 0; color: #64748b;">Receipt for Invoice #${escape(params.invoiceNumber)}</p>
    </div>

    <div class="card">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Property</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${escape(params.propertyName)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Booking Reference</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace;">${escape(params.referenceCode)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Payment Date</td>
          <td style="padding: 8px 0; text-align: right;">${escape(params.date)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Payment Method</td>
          <td style="padding: 8px 0; text-align: right;">${escape(params.paymentMethod)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Subtotal</td>
          <td style="padding: 8px 0; text-align: right;">${escape(params.subtotal)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Taxes &amp; Fees</td>
          <td style="padding: 8px 0; text-align: right;">${escape(params.taxAmount)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0 4px 0; color: #0f172a; font-weight: bold; font-size: 16px;">Total Charged</td>
          <td style="padding: 12px 0 4px 0; text-align: right; color: #0f172a; font-weight: bold; font-size: 18px;">${escape(params.totalAmount)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 28px;">
      <a href="http://localhost:3000/bookings" class="btn">View in Account</a>
    </div>
  `;
  return baseLayout("Payment Receipt - " + params.invoiceNumber, content);
}

export function messageAlertTemplate(params: {
  recipientName: string;
  senderName: string;
  propertyName: string;
  messagePreview: string;
  actionUrl: string;
}): string {
  const content = `
    <h2 class="h2">New message regarding ${escape(params.propertyName)}</h2>
    <p>Hello ${escape(params.recipientName)},</p>
    <p>You have received a new message from <strong>${escape(params.senderName)}</strong>:</p>

    <div class="card" style="border-left: 4px solid #0f172a; background: #f8fafc; font-style: italic;">
      &ldquo;${escape(params.messagePreview)}&rdquo;
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${escape(params.actionUrl)}" class="btn">Reply to Message</a>
    </div>
  `;
  return baseLayout("New message from " + params.senderName, content);
}

export function stayRequestReceivedTemplate(params: {
  managerName: string;
  propertyName: string;
  guestName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
}): string {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background: #fef3c7; color: #92400e;">New Stay Request</span>
      <h2 style="margin: 12px 0 4px 0; color: #0f172a;">New reservation request received</h2>
      <p style="margin: 0; color: #64748b;">For ${escape(params.propertyName)}</p>
    </div>

    <div class="card">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Guest Name</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${escape(params.guestName)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Requested Room</td>
          <td style="padding: 8px 0; text-align: right;">${escape(params.roomName)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Dates</td>
          <td style="padding: 8px 0; text-align: right;">${escape(params.checkIn)} to ${escape(params.checkOut)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0 4px 0; color: #0f172a; font-weight: bold;">Estimated Total</td>
          <td style="padding: 12px 0 4px 0; text-align: right; color: #0f172a; font-weight: bold; font-size: 16px;">${escape(params.totalAmount)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="http://localhost:3001" class="btn">Open PMS &amp; Accept Request</a>
    </div>
  `;
  return baseLayout("New Stay Request - " + params.propertyName, content);
}

export function staffInvitationTemplate(params: {
  staffEmail: string;
  propertyName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}): string {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background: #e0e7ff; color: #3730a3;">Staff Invitation</span>
      <h2 style="margin: 12px 0 4px 0; color: #0f172a;">You're invited to join ${escape(params.propertyName)}</h2>
      <p style="margin: 0; color: #64748b;">${escape(params.inviterName)} has invited you to join the hotel team.</p>
    </div>

    <div class="card">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Property</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${escape(params.propertyName)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b;">Assigned Role</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${escape(params.role.replace(/_/g, " "))}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Invited Email</td>
          <td style="padding: 8px 0; text-align: right;">${escape(params.staffEmail)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${escape(params.inviteUrl)}" class="btn" style="background: #1e3a8a;">Accept Invitation &amp; Access PMS</a>
      <p style="margin-top: 12px; font-size: 12px; color: #64748b;">Sign in with your email ${escape(params.staffEmail)} to access your hotel property dashboard.</p>
    </div>
  `;
  return baseLayout("Staff Invitation to " + params.propertyName, content);
}

