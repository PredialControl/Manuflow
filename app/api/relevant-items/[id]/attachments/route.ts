import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id: itemId } = await params;
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file provided", { status: 400 });
        }

        console.log("[ATTACHMENT_POST] Uploading file:", file.name, "Size:", file.size);

        // Check if BLOB_READ_WRITE_TOKEN is configured
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error("[ATTACHMENT_POST] BLOB_READ_WRITE_TOKEN not configured");
            return new NextResponse("Upload service not configured", { status: 500 });
        }

        // Upload to Vercel Blob
        const blob = await put(file.name, file, {
            access: "public",
            addRandomSuffix: true,
        });

        console.log("[ATTACHMENT_POST] Upload successful:", blob.url);

        // Determine file type
        const fileType = file.type.startsWith("image/")
            ? "image"
            : file.type === "application/pdf"
            ? "pdf"
            : "document";

        // Save attachment in database
        const attachment = await prisma.relevantItemAttachment.create({
            data: {
                companyId: session.user.companyId,
                itemId,
                url: blob.url,
                filename: file.name,
                fileType,
                size: file.size,
                uploadedBy: session.user.id,
            },
            include: {
                user: {
                    select: {
                        name: true,
                    }
                }
            }
        });

        console.log("[ATTACHMENT_POST] Attachment saved to DB:", attachment.id);
        return NextResponse.json(attachment);
    } catch (error: any) {
        console.error("[ATTACHMENT_POST] Error:", error);
        console.error("[ATTACHMENT_POST] Error message:", error?.message);
        console.error("[ATTACHMENT_POST] Error stack:", error?.stack);
        return new NextResponse(`Upload failed: ${error?.message || 'Unknown error'}`, { status: 500 });
    }
}
