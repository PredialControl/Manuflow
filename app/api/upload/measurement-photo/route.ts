import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

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

        // Create date-based path: measurements/2026-02-19/medicao_timestamp.webp
        const now = new Date();
        const dateFolder = now.toISOString().split("T")[0];
        const timestamp = now.getTime();
        const pathname = `measurements/${dateFolder}/medicao_${timestamp}.webp`;

        // Upload to Vercel Blob
        const blob = await put(pathname, file, {
            access: "public",
            contentType: "image/webp",
        });

        return NextResponse.json({ url: blob.url });
    } catch (error) {
        console.error("[UPLOAD_MEASUREMENT_PHOTO]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
