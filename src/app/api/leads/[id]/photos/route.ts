import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getLeadById } from "@/lib/db/queries/leads";
import { getPhotosByLeadId, createLeadPhoto, deleteLeadPhoto, getLeadPhotoById } from "@/lib/db/queries/lead-photos";
import { deleteLeadPhotoFromStorage } from "@/lib/storage";

const JOB_PHOTO_TYPES = ["before", "progress", "after"] as const;
type JobPhotoType = typeof JOB_PHOTO_TYPES[number];

async function getAuthedLead(userId: string, leadId: string) {
  const company = await getCompanyByClerkId(userId);
  if (!company) return null;
  const lead = await getLeadById(leadId);
  if (!lead || lead.companyId !== company.id) return null;
  return lead;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lead = await getAuthedLead(userId, id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const photos = await getPhotosByLeadId(id);
  return NextResponse.json({
    photos: photos.map((p) => ({ id: p.id, url: p.photoUrl, photoType: p.photoType })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lead = await getAuthedLead(userId, id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { photoUrl, photoType } = await req.json();
  if (!photoUrl) return NextResponse.json({ error: "photoUrl is required" }, { status: 400 });
  if (!JOB_PHOTO_TYPES.includes(photoType as JobPhotoType)) {
    return NextResponse.json({ error: "photoType must be before, progress, or after" }, { status: 400 });
  }

  const photo = await createLeadPhoto({ leadId: id, photoUrl, photoType });
  return NextResponse.json({ id: photo.id, url: photo.photoUrl, photoType: photo.photoType }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lead = await getAuthedLead(userId, id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { photoId } = await req.json();
  if (!photoId) return NextResponse.json({ error: "photoId is required" }, { status: 400 });

  const photo = await getLeadPhotoById(photoId);
  if (photo) {
    await deleteLeadPhotoFromStorage(photo.photoUrl);
  }
  await deleteLeadPhoto(photoId);
  return NextResponse.json({ success: true });
}
