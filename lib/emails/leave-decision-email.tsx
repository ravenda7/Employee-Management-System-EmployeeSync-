// lib/emails/leave-decision-email.tsx
import {
  Html,
  Head,
  Font,
  Preview,
  Heading,
  Section,
  Text,
  Button,
  Container,
} from "@react-email/components";

interface LeaveDecisionEmailProps {
  employeeName: string;
  companyName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: "APPROVED" | "REJECTED";
  decisionNote?: string;
  dashboardUrl: string;
}

export default function LeaveDecisionEmail({
  employeeName,
  companyName,
  leaveType,
  startDate,
  endDate,
  duration,
  status,
  decisionNote,
  dashboardUrl,
}: LeaveDecisionEmailProps) {
  const statusColor = status === "APPROVED" ? "#0D923A" : "#D21F3C";
  const humanStatus = status === "APPROVED" ? "approved" : "rejected";

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Your leave request has been {humanStatus}</title>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>

      <Preview>Leave request {humanStatus} – {companyName}</Preview>

      <Container
        style={{
          backgroundColor: "#ffffff",
          padding: "40px 24px",
          borderRadius: "8px",
          maxWidth: "600px",
          margin: "0 auto",
          fontFamily: "Roboto, Verdana, sans-serif",
          color: "#333",
        }}
      >
        <Section>
          <Heading
            as="h2"
            style={{
              color: statusColor,
              marginBottom: "16px",
            }}
          >
            Your leave request has been {humanStatus}
          </Heading>

          <Text style={{ marginBottom: "12px", lineHeight: "1.6" }}>
            Hello {employeeName},
          </Text>

          <Text style={{ marginBottom: "16px", lineHeight: "1.6" }}>
            Your leave request with <strong>{companyName}</strong> has been{" "}
            <strong style={{ color: statusColor }}>{humanStatus}</strong>.
          </Text>

          <Text style={{ marginBottom: "16px", lineHeight: "1.6" }}>
            <strong>Leave type:</strong> {leaveType}
            <br />
            <strong>Dates:</strong> {startDate} → {endDate}
            <br />
            <strong>Duration:</strong> {duration} day{duration === 1 ? "" : "s"}
          </Text>

          {decisionNote && (
            <Text
              style={{
                marginTop: "16px",
                marginBottom: "16px",
                padding: "12px",
                backgroundColor: "#f7f7f7",
                borderLeft: `4px solid ${statusColor}`,
                borderRadius: "4px",
                fontStyle: "italic",
              }}
            >
              {decisionNote}
            </Text>
          )}

          <Button
            href={dashboardUrl}
            style={{
              backgroundColor: statusColor,
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              display: "inline-block",
              fontWeight: 500,
            }}
          >
            View Leave Status
          </Button>

          <Text style={{ marginTop: "32px", color: "#666", lineHeight: "1.6" }}>
            Best regards,
            <br />
            The {companyName} Team
          </Text>
        </Section>
      </Container>
    </Html>
  );
}
