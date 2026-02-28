import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/upload-helper";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id: reportId } = await params;
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file provided", { status: 400 });
        }

        console.log("[REPORT_PHOTO] Uploading file:", file.name, "Size:", file.size);

        // Upload file
        const fileUrl = await uploadFile(file);
        console.log("[REPORT_PHOTO] Upload successful:", fileUrl);

        // Save photo in database
        const photo = await prisma.photo.create({
            data: {
                companyId: session.user.companyId,
                reportId,
                url: fileUrl,
                filename: file.name,
                size: file.size,
            },
        });

        console.log("[REPORT_PHOTO] Photo saved to DB:", photo.id);
        return NextResponse.json(photo);
    } catch (error: any) {
        console.error("[REPORT_PHOTO] Error:", error);
        console.error("[REPORT_PHOTO] Error message:", error?.message);
        return new NextResponse(`Upload failed: ${error?.message || 'Unknown error'}`, { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id: reportId } = await params;

        const photos = await prisma.photo.findMany({
            where: { reportId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(photos);
    } catch (error: any) {
        console.error("[REPORT_PHOTO_GET] Error:", error);
        return new NextResponse(`Fetch failed: ${error?.message || 'Unknown error'}`, { status: 500 });
    }
}
