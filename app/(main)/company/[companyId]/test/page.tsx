'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestEmailPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const sendTestEmail = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/test/email", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResult("✅ Email sent successfully!");
      } else {
        setResult(`❌ Failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setResult("❌ Error occurred while sending the email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-[400px] text-center space-y-4">
        <h1 className="text-xl font-semibold">Test Email Sender</h1>
        <p className="text-gray-500">Click below to test your Nodemailer + React Email setup.</p>
        <Button onClick={sendTestEmail} disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send Test Email"}
        </Button>
        {result && <p className="mt-3 text-sm font-medium">{result}</p>}
      </div>
    </div>
  );
}
