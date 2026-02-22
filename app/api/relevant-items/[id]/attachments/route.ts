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

        // Upload to Vercel Blob
        const blob = await put(file.name, file, {
            access: "public",
            addRandomSuffix: true,
        });

        // Determine file type
        const fileType = file.type.startsWith("image/")
            ? "image"
            : file.type === "application/pdf"
            ? "pdf"
            : "document";

        // Save attachment in database
        const attachment = await prisma.relevantItemAttachment.create({
            data: {
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

        return NextResponse.json(attachment);
    } catch (error) {
        console.error("[ATTACHMENT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
