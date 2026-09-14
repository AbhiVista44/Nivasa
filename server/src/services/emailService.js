// Email Dispatch Service with Resend API integration and offline simulation

export class EmailService {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || null;
    this.sender = process.env.EMAIL_FROM || 'Nivasa Community <notifications@nivasa.app>';
  }

  async sendEmail({ to, subject, html, text }) {
    if (this.apiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            from: this.sender,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            text: text || subject,
          }),
        });
        const data = await res.json();
        console.log(`✉️ [Resend API] Email sent to ${to} (Subject: "${subject}") -> ID: ${data.id}`);
        return { success: true, id: data.id, provider: 'resend' };
      } catch (err) {
        console.warn(`⚠️ [Resend API Error] Failed to send email to ${to}:`, err.message);
      }
    }

    // Offline / Development Fallback Simulation
    console.log(`\n==================================================`);
    console.log(`✉️ [OFFLINE EMAIL SIMULATION] To: ${to}`);
    console.log(`📌 Subject: ${subject}`);
    console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
    console.log(`📄 Text Snippet: ${(text || html.replace(/<[^>]*>?/gm, '')).slice(0, 150)}...`);
    console.log(`==================================================\n`);

    return {
      success: true,
      id: 'sim_' + Date.now(),
      provider: 'simulation-offline',
      recipient: to,
      subject,
    };
  }

  // 1. Visitor Arrival Alert Email
  async sendVisitorArrivalEmail(residentEmail, residentName, visitor, society) {
    const subject = `Gate Alert: ${visitor.name} has arrived at ${society?.name || 'Nivasa'}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0d5c52 0%, #0f766e 100%); padding: 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">Gate Pass Verification Alert</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #ccfbf1;">${society?.name || 'Gulmohar Greens Heights'}</p>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <p style="font-size: 14px; margin-top: 0;">Hello <strong>${residentName}</strong>,</p>
          <p style="font-size: 14px;">A visitor has reached the main security gate for your residence <strong>Flat ${visitor.flatNumber}</strong>:</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Visitor Name:</strong> ${visitor.name}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Phone:</strong> ${visitor.phone || 'Not provided'}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Vehicle:</strong> ${visitor.vehicleNumber || 'Pedestrian Entry'}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Gate:</strong> ${visitor.entryGate || 'Main Gate 1'}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Status:</strong> <span style="color: #0f766e; font-weight: bold;">${visitor.status}</span></p>
          </div>
          <p style="font-size: 13px; color: #64748b;">You can also verify or pre-authorize passes anytime directly inside your Nivasa Resident Dashboard.</p>
        </div>
      </div>
    `;

    return this.sendEmail({ to: residentEmail, subject, html });
  }

  // 2. Urgent Notice Broadcast Email
  async sendUrgentNoticeEmail(recipients, notice, society) {
    const subject = `🚨 URGENT NOTICE: ${notice.title} [${society?.name || 'Nivasa'}]`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #ef4444; border-radius: 16px; overflow: hidden;">
        <div style="background: #dc2626; padding: 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">🚨 URGENT COMMUNITY ANNOUNCEMENT</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #fee2e2;">${society?.name || 'Gulmohar Greens Heights'}</p>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <h3 style="color: #991b1b; margin-top: 0;">${notice.title}</h3>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 16px 0; white-space: pre-line; font-size: 14px; line-height: 1.6; color: #334155;">
            ${notice.body}
          </div>
          <p style="font-size: 12px; color: #64748b;">Published by: <strong>${notice.authorName || 'Society Administration'}</strong> on ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>
    `;

    return this.sendEmail({ to: recipients, subject, html });
  }

  // 3. Delivery Arrival Email
  async sendDeliveryArrivalEmail(residentEmail, residentName, delivery, society) {
    const subject = `📦 Parcel Arrived: ${delivery.carrier} package at Gate for Flat ${delivery.flatNumber}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: #0f766e; padding: 20px; color: #ffffff;">
          <h3 style="margin: 0;">Package Waiting at Security Gate</h3>
          <p style="margin: 4px 0 0; font-size: 12px; color: #ccfbf1;">${society?.name || 'Gulmohar Greens'}</p>
        </div>
        <div style="padding: 20px; font-size: 14px; color: #1e293b;">
          <p>Hello <strong>${residentName}</strong>,</p>
          <p>Your delivery from <strong>${delivery.carrier}</strong> (${delivery.packageCount || 1} parcel) has arrived at the Main Security Gate.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 10px; margin: 16px 0;">
            <p style="margin: 2px 0; font-size: 13px;"><strong>Pickup OTP / Gate Code:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #15803d;">${delivery.pickupOtp || 'N/A'}</span></p>
            <p style="margin: 2px 0; font-size: 12px; color: #64748b;">Held at: ${delivery.arrivalGate || 'Main Gate 1'}</p>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({ to: residentEmail, subject, html });
  }
}

export const emailService = new EmailService();
