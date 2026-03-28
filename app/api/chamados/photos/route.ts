import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFile } from "@/lib/upload-helper";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("photo") as File;
        const type = (formData.get("type") as string) || "execution"; // "pre" ou "execution"
        const chamadoId = formData.get("chamadoId") as string;

        if (!file) {
            return new NextResponse("No file provided", { status: 400 });
        }

        const now = new Date();
        const dateFolder = now.toISOString().split("T")[0];
        const timestamp = now.getTime();
        const pathname = `chamados/${dateFolder}/${type}_${chamadoId || "unknown"}_${timestamp}.webp`;

        const url = await uploadFile(file, pathname);

        return NextResponse.json({ url });
    } catch (error) {
        console.error("[UPLOAD_CHAMADO_PHOTO]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
