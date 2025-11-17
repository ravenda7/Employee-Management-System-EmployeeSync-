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

interface CredentialsEmailProps {
  username: string;
  companyName: string;
  loginUrl: string;
  supportEmail: string;
  tempPassword: string;
}

export default function CredentialsEmail({
  username,
  companyName,
  loginUrl,
  supportEmail,
  tempPassword,
}: CredentialsEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Important: Please Change Your Default Password</title>
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

      <Preview>Welcome to {companyName}! Please change your default password.</Preview>

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
          <Heading as="h2" style={{ color: "#0d6efd", marginBottom: "16px" }}>
            Welcome to {companyName}, {username}!
          </Heading>

          <Text style={{ marginBottom: "16px", lineHeight: "1.6" }}>
            Your account has been created by the administrator with a temporary default password.
            For your security, please log in as soon as possible and change your password.
          </Text>

          <Text style={{ marginBottom: "16px", lineHeight: "1.6" }}>
            <strong>Temporary Password:</strong> {tempPassword}
          </Text>

          <Button
            href={loginUrl}
            style={{
              backgroundColor: "#0d6efd",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              display: "inline-block",
              fontWeight: 500,
            }}
          >
            Log In & Change Password
          </Button>

          <Text style={{ marginTop: "24px", lineHeight: "1.6" }}>
            If you experience any issues, contact our support team at{" "}
            <a href={`mailto:${supportEmail}`} style={{ color: "#0d6efd" }}>
              {supportEmail}
            </a>.
          </Text>

          <Text style={{ marginTop: "32px", color: "#666" }}>
            Best regards,<br />
            The {companyName} Team
          </Text>
        </Section>
      </Container>
    </Html>
  );
}
