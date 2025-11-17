import { render } from "@react-email/components";
import CredentialsEmail from "@/lib/emails/credientals-email";
import { transporter, FROM_EMAIL } from "@/lib/nodemailer";

export async function sendCredientalsEmail(
  username: string,
  companyName: string,
  loginUrl: string,
  supportEmail: string,
  tempPassword: string,
  email: string
) {
  try {
    const html = await render(
      CredentialsEmail({
        username,
        companyName,
        loginUrl,
        supportEmail,
        tempPassword,
      })
    );

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: "Important: Please Change Your Default Password",
      html,
    });
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: "Failed to send email" };
  }
}
