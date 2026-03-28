// Rota desativada após uso
import { NextResponse } from "next/server";
export async function GET() {
    return NextResponse.json({ message: "Setup já executado. Rota desativada." }, { status: 410 });
}
