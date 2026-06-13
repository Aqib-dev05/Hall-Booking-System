import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // your gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // 16-digit Google App Password
  },
});

// Helper to format date cleanly
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
};

// Generate Google Calendar Add Link
const generateGoogleCalendarLink = (booking: any) => {
  const text = encodeURIComponent(`Booking at ${booking.venue.name}`);
  const details = encodeURIComponent(
    `Event Type: ${booking.eventType}\nGuests: ${booking.guestCount}\nSpecial Requests: ${booking.specialRequests || "None"}`
  );
  const location = encodeURIComponent(`${booking.venue.location}, ${booking.venue.city}`);
  
  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
  const startDate = new Date(booking.eventDate);
  const [startHr, startMin] = booking.startTime.split(":");
  startDate.setHours(parseInt(startHr), parseInt(startMin), 0);
  
  const endDate = new Date(booking.eventDate);
  const [endHr, endMin] = booking.endTime.split(":");
  endDate.setHours(parseInt(endHr), parseInt(endMin), 0);

  const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const dates = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
};

export const sendBookingConfirmationEmail = async (to: string, booking: any) => {
  const gcalLink = generateGoogleCalendarLink(booking);
  // Using an absolute URL placeholder; in a real app you'd use NEXT_PUBLIC_BASE_URL
  const bookingLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/bookings`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #10b981;">Booking Confirmed! 🎉</h2>
      <p>Thank you for choosing <strong>${booking.venue.name}</strong>. Your booking has been successfully confirmed.</p>
      
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #111827;">Booking Details</h3>
        <p><strong>Booking ID:</strong> ${booking._id}</p>
        <p><strong>Venue:</strong> ${booking.venue.name}</p>
        <p><strong>Event Date:</strong> ${formatDate(booking.eventDate)}</p>
        <p><strong>Time Slot:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Guest Count:</strong> ${booking.guestCount}</p>
        <p><strong>Total Paid:</strong> $${booking.totalAmount.toLocaleString()}</p>
      </div>

      <div style="margin: 30px 0;">
        <a href="${gcalLink}" style="background-color: #4285f4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
          📅 Add to Google Calendar
        </a>
        <a href="${bookingLink}" style="background-color: #111827; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          🔍 View My Bookings
        </a>
      </div>
      
      <p style="font-size: 12px; color: #6b7280;">If you have any questions, please reply to this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Elysian Fields" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Booking Confirmed – ${booking.venue.name}`,
    html,
  });
};

export const sendBookingReminderEmail = async (to: string, booking: any) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #f59e0b;">Your event is tomorrow! ⏰</h2>
      <p>This is a friendly reminder for your upcoming event at <strong>${booking.venue.name}</strong>.</p>
      
      <div style="background-color: #fdfbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #92400e;">Event Summary</h3>
        <p><strong>Date:</strong> ${formatDate(booking.eventDate)}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Guests:</strong> ${booking.guestCount}</p>
        <p><strong>Venue Address:</strong> ${booking.venue.location}, ${booking.venue.city}</p>
      </div>
      
      <p>We look forward to hosting you!</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Elysian Fields" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Reminder: Your Event is Tomorrow – ${booking.venue.name}`,
    html,
  });
};

export const sendCancellationEmail = async (to: string, booking: any) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #ef4444;">Booking Cancelled</h2>
      <p>Your booking at <strong>${booking.venue.name}</strong> for ${formatDate(booking.eventDate)} has been cancelled.</p>
      
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0; color: #b91c1c;">
          <strong>Refund Note:</strong> Any eligible refund will be processed in 5–7 business days.
        </p>
      </div>
      
      <p style="font-size: 12px; color: #6b7280;">If this was a mistake, please contact us immediately.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Elysian Fields" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Booking Cancelled – ${booking.venue.name}`,
    html,
  });
};

export const sendAdminNewBookingAlert = async (booking: any, customerEmail: string, customerName: string) => {
  const adminEmail = process.env.GMAIL_USER;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #3b82f6;">New Booking Received</h2>
      <p>A new booking has been confirmed for <strong>${booking.venue.name}</strong>.</p>
      
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e3a8a;">Booking Details</h3>
        <p><strong>Customer Name:</strong> ${customerName}</p>
        <p><strong>Customer Email:</strong> ${customerEmail}</p>
        <p><strong>Venue:</strong> ${booking.venue.name}</p>
        <p><strong>Date:</strong> ${formatDate(booking.eventDate)}</p>
        <p><strong>Time Slot:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Total Amount:</strong> $${booking.totalAmount.toLocaleString()}</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Elysian Fields Alerts" <${adminEmail}>`,
    to: adminEmail,
    subject: `New Booking Received – ${booking.venue.name}`,
    html,
  });
};
