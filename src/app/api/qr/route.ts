import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { PDFDocument, rgb } from "pdf-lib";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function generateBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
}

// GET /api/qr?format=png|pdf
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const format = req.nextUrl.searchParams.get("format") ?? "png";
  const quoteUrl = `${APP_URL}/quote/${company.id}`;
  const qrBuffer = await generateBuffer(quoteUrl);

  if (format === "png") {
    return new NextResponse(qrBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="lead-form-qr.png"`,
      },
    });
  }

  if (format === "pdf") {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size

    const qrImage = await pdfDoc.embedPng(qrBuffer);
    const qrSize = 360;
    const x = (page.getWidth() - qrSize) / 2;
    const y = (page.getHeight() - qrSize) / 2 + 40;

    page.drawImage(qrImage, { x, y, width: qrSize, height: qrSize });

    const title = "Scan for a free painting estimate";
    page.drawText(title, {
      x: page.getWidth() / 2 - (title.length * 6.2),
      y: y + qrSize + 28,
      size: 22,
      color: rgb(0, 0, 0),
    });

    page.drawText(company.businessName, {
      x: page.getWidth() / 2 - (company.businessName.length * 4.5),
      y: y - 36,
      size: 16,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(quoteUrl, {
      x: page.getWidth() / 2 - (quoteUrl.length * 2.8),
      y: y - 60,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lead-form-qr.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid format" }, { status: 400 });
}
