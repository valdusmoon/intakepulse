import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getContractByToken, updateContract } from "@/lib/db/queries/contracts";
import { getCompanyById } from "@/lib/db/queries/companies";
import { getLeadById, updateLead } from "@/lib/db/queries/leads";
import { sendContractSignedNotification, sendContractSignedHomeownerConfirmation } from "@/lib/email/notifications";
import { sendSms, smsContractSigned } from "@/lib/sms";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function generateSignedPdf(
  contractBody: string,
  signerName: string,
  signerEmail: string,
  businessName: string,
  signedAt: Date
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const pageWidth = 612;
  const pageHeight = 792;
  const lineHeight = 16;
  const fontSize = 11;
  const maxWidth = pageWidth - margin * 2;

  // Word-wrap helper
  function wrapText(text: string, size: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function checkNewPage() {
    if (y < margin + 80) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  // Title
  page.drawText(businessName, { x: margin, y, font: boldFont, size: 16, color: rgb(0.06, 0.09, 0.16) });
  y -= 24;
  page.drawText("Service Agreement / Contract", { x: margin, y, font: boldFont, size: 13, color: rgb(0.27, 0.34, 0.42) });
  y -= 28;

  // Divider
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: rgb(0.88, 0.89, 0.9) });
  y -= 20;

  // Contract body — paragraph by paragraph
  const paragraphs = contractBody.split("\n");
  for (const para of paragraphs) {
    checkNewPage();
    if (!para.trim()) { y -= lineHeight * 0.6; continue; }
    const lines = wrapText(para, fontSize);
    for (const line of lines) {
      checkNewPage();
      page.drawText(line, { x: margin, y, font, size: fontSize, color: rgb(0.13, 0.18, 0.25) });
      y -= lineHeight;
    }
    y -= 4;
  }

  // Signature block
  y -= 20;
  checkNewPage();
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: rgb(0.88, 0.89, 0.9) });
  y -= 20;

  page.drawText("Electronic Signature", { x: margin, y, font: boldFont, size: 11, color: rgb(0.27, 0.34, 0.42) });
  y -= 18;
  page.drawText(`Signed by: ${signerName}`, { x: margin, y, font: boldFont, size: 12, color: rgb(0.06, 0.09, 0.16) });
  y -= 16;
  page.drawText(`Email: ${signerEmail}`, { x: margin, y, font, size: 10, color: rgb(0.42, 0.47, 0.53) });
  y -= 14;
  page.drawText(
    `Date: ${signedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${signedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}`,
    { x: margin, y, font, size: 10, color: rgb(0.42, 0.47, 0.53) }
  );
  y -= 14;
  page.drawText("Electronically signed — valid under the ESIGN Act (15 U.S.C. § 7001)", {
    x: margin, y, font, size: 9, color: rgb(0.6, 0.65, 0.7),
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { token, signerName } = body as { token: string; signerName: string };

  if (!token || !signerName?.trim()) {
    return NextResponse.json({ error: "Missing token or name" }, { status: 400 });
  }

  const contract = await getContractByToken(token);
  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (contract.id !== id) return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  if (contract.signedAt) return NextResponse.json({ error: "Already signed" }, { status: 409 });
  if (contract.status === "void") return NextResponse.json({ error: "Contract is void" }, { status: 410 });

  const lead = contract.leadId ? await getLeadById(contract.leadId) : null;
  const company = await getCompanyById(contract.companyId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const signerEmail = lead?.homeownerEmail ?? "";
  const signerIp = getClientIp(req);
  const signedAt = new Date();

  // Update contract
  const updated = await updateContract(id, {
    status: "signed",
    signerName: signerName.trim(),
    signerEmail,
    signerIp,
    signedAt,
  });

  // Auto-sync lead status to won (never regress from completed)
  if (lead && !["won", "completed"].includes(lead.status)) {
    updateLead(lead.id, { status: "won" }).catch(() => {});
  }

  // Generate signed PDF and email painter
  try {
    const pdfBuffer = await generateSignedPdf(
      contract.contractBody,
      signerName.trim(),
      signerEmail,
      company.businessName,
      signedAt
    );

    if (lead) {
      await Promise.allSettled([
        company.notificationPreferences?.contractSigned !== false
          ? sendContractSignedNotification({
              painterEmail: company.ownerEmail,
              businessName: company.businessName,
              homeownerName: lead.homeownerName,
              homeownerPhone: lead.homeownerPhone,
              homeownerEmail: lead.homeownerEmail ?? null,
              leadId: lead.id,
              signedPdfBuffer: pdfBuffer,
            })
          : Promise.resolve(),
        lead.homeownerEmail
          ? sendContractSignedHomeownerConfirmation({
              homeownerEmail: lead.homeownerEmail,
              homeownerName: lead.homeownerName,
              businessName: company.businessName,
              businessPhone: company.businessPhone ?? null,
              signedPdfBuffer: pdfBuffer,
            })
          : Promise.resolve(),
        company.notificationPreferences?.smsContractSigned !== false
          ? sendSms(company.ownerPhone, smsContractSigned(lead.homeownerName))
          : Promise.resolve(),
      ]);
    }
  } catch {
    // fire-and-forget — signing already recorded
  }

  return NextResponse.json(updated);
}
