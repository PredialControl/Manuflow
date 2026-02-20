import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("photo") as File;

        if (!file) {
            return new NextResponse("No file provided", { status: 400 });
        }

        // Create date-based folder: uploads/measurements/2026-02-19/
        const now = new Date();
        const dateFolder = now.toISOString().split("T")[0]; // YYYY-MM-DD
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "measurements", dateFolder);
        await fs.mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const timestamp = now.getTime();
        const filename = `medicao_${timestamp}.webp`;
        const filePath = path.join(uploadsDir, filename);

        // Convert to WebP using sharp
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await sharp(buffer)
            .resize(1280, 960, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(filePath);

        // Return the public URL
        const publicUrl = `/uploads/measurements/${dateFolder}/${filename}`;

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("[UPLOAD_MEASUREMENT_PHOTO]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
