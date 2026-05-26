import { NextResponse } from "next/server";
import { seedRepescagem } from "@/lib/seed-respescagem";

export async function POST() {
  try {
    const result = await seedRepescagem();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}