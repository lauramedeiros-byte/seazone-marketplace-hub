"use server"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createRepescagemEmpreendimento(
  nomeEmpreendimento: string,
  userId?: string
) {
  try {
    console.log("DEBUG: Creating with", { nomeEmpreendimento, userId });
    const result = await db.repescagemEmpreendimento.create({
      data: { nomeEmpreendimento, criadoPorId: userId || null },
    });
    console.log("DEBUG: Created", result.id);
    revalidatePath("/respescagem");
    return { success: true, id: result.id };
  } catch (error) {
    console.error("DEBUG ERROR:", error);
    throw error;
  }
}