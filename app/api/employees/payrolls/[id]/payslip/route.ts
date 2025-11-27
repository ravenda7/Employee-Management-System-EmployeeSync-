// app/api/employee/payrolls/[id]/payslip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
// Use the standalone JS build so it doesn't try to load .afm files from disk
// @ts-expect-error: standalone build has no TS types
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

// Ensure Node.js runtime (no edge) so pdfkit + Buffer work correctly
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; companyId?: string } | undefined;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payrollId = params.id;

  const payroll = await db.payroll.findUnique({
    where: { id: payrollId },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          companyId: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!payroll) {
    return NextResponse.json(
      { message: "Payslip not found" },
      { status: 404 }
    );
  }

  // ensure this payroll belongs to the logged-in employee
  if (payroll.empId !== user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // optional: extra safety if user has companyId
  if (user.companyId && user.companyId !== payroll.companyId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const pdfBuffer = await generatePayslipPdf({
    companyName: payroll.company?.name || "Company",
    employeeName: payroll.employee?.name || "Employee",
    employeeEmail: payroll.employee?.email || "",
    periodStart: payroll.startDate,
    periodEnd: payroll.endDate,
    gross: payroll.gross,
    net: payroll.net,
    deductions: payroll.deductions,
    regularHours: payroll.regularHours,
    overtimeHours: payroll.overtimeHours,
    isPaid: payroll.isPaid,
    paidDate: payroll.paidDate,
    note: payroll.note,
  });

  const fileName = `payslip-${new Date(
    payroll.startDate
  ).toISOString().slice(0, 10)}-${new Date(
    payroll.endDate
  ).toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}

type PayslipData = {
  companyName: string;
  employeeName: string;
  employeeEmail: string;
  periodStart: Date;
  periodEnd: Date;
  gross: number;
  net: number;
  deductions: number;
  regularHours: number;
  overtimeHours: number;
  isPaid: boolean;
  paidDate: Date | null;
  note: string | null;
};

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

async function generatePayslipPdf(data: PayslipData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err: Error) => reject(err));

    // === Header ===
    doc
      .fontSize(20)
      .text(data.companyName, { align: "left" })
      .moveDown(0.3);

    doc
      .fontSize(12)
      .fillColor("#444444")
      .text("PAYSLIP", { align: "right" })
      .moveDown(0.2);

    doc
      .fontSize(10)
      .text(
        `Period: ${formatDate(data.periodStart)} - ${formatDate(
          data.periodEnd
        )}`,
        {
          align: "right",
        }
      )
      .moveDown(1);

    // separator
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#dddddd")
      .stroke()
      .moveDown(1);

    // === Employee details ===
    doc
      .fontSize(11)
      .fillColor("#000000")
      .text("Employee Details", { underline: true })
      .moveDown(0.4);

    doc
      .fontSize(10)
      .text(`Name: ${data.employeeName}`)
      .text(`Email: ${data.employeeEmail || "-"}`)
      .moveDown(1);

    // === Payment summary ===
    doc
      .fontSize(11)
      .text("Payment Summary", { underline: true })
      .moveDown(0.4);

    const startX = doc.page.margins.left;
    const col1Width = 200;
    const col2X = startX + col1Width + 40;

    doc
      .fontSize(10)
      .text("Gross Pay:", startX, doc.y)
      .text(data.gross.toFixed(2), col2X, doc.y, { align: "left" });

    doc
      .moveDown(0.2)
      .text("Deductions:", startX, doc.y)
      .text(data.deductions.toFixed(2), col2X, doc.y, { align: "left" });

    doc
      .moveDown(0.2)
      .font("Helvetica-Bold")
      .text("Net Pay:", startX, doc.y)
      .text(data.net.toFixed(2), col2X, doc.y, { align: "left" })
      .font("Helvetica")
      .moveDown(1);

    // === Work hours ===
    doc
      .fontSize(11)
      .text("Work Hours", { underline: true })
      .moveDown(0.4);

    doc
      .fontSize(10)
      .text("Regular Hours:", startX, doc.y)
      .text(data.regularHours.toFixed(2), col2X, doc.y, { align: "left" });

    doc
      .moveDown(0.2)
      .text("Overtime Hours:", startX, doc.y)
      .text(data.overtimeHours.toFixed(2), col2X, doc.y, { align: "left" })
      .moveDown(1);

    // === Status ===
    doc
      .fontSize(11)
      .text("Payment Status", { underline: true })
      .moveDown(0.4);

    doc
      .fontSize(10)
      .text(`Status: ${data.isPaid ? "Paid" : "Pending"}`, startX, doc.y);

    if (data.isPaid && data.paidDate) {
      doc
        .moveDown(0.2)
        .text(`Paid on: ${formatDate(data.paidDate)}`, startX, doc.y);
    }

    if (data.note) {
      doc.moveDown(0.5).text(`Note: ${data.note}`, {
        width: 400,
      });
    }

    // footer
    doc
      .moveDown(3)
      .fontSize(9)
      .fillColor("#777777")
      .text(
        "This is a system-generated payslip. If you see any discrepancy, please contact your HR department.",
        { align: "center" }
      );

    doc.end();
  });
}
