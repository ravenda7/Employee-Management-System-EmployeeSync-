// lib/email/send-leave-decision-email.ts
import { render } from "@react-email/components";
import LeaveDecisionEmail from "@/lib/emails/leave-decision-email";
import { transporter, FROM_EMAIL } from "@/lib/nodemailer";

export async function sendLeaveDecisionEmail(params: {
  employeeName: string;
  employeeEmail: string;
  companyName: string;
  leaveType: string;
  startDate: string; // already formatted for human (e.g. "Dec 1, 2025")
  endDate: string;
  duration: number;
  status: "APPROVED" | "REJECTED";
  decisionNote?: string;
  dashboardUrl: string;
}) {
  const {
    employeeName,
    employeeEmail,
    companyName,
    leaveType,
    startDate,
    endDate,
    duration,
    status,
    decisionNote,
    dashboardUrl,
  } = params;

  try {
    const html = await render(
      LeaveDecisionEmail({
        employeeName,
        companyName,
        leaveType,
        startDate,
        endDate,
        duration,
        status,
        decisionNote,
        dashboardUrl,
      })
    );

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: employeeEmail,
      subject: `Your leave request has been ${status.toLowerCase()}`,
      html,
    });

    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending leave decision email:", error);
    return { success: false, message: "Failed to send leave decision email" };
  }
}
