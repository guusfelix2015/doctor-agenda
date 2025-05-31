"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertDoctorSchema } from "./schema";

export const upsertDoctor = actionClient
  .schema(upsertDoctorSchema)
  .action(async ({ parsedInput }) => {
    const availableFromTime = parsedInput.availableFromTime; // "15:30" or "15:30:00"
    const availableToTime = parsedInput.availableToTime; // "16:00" or "16:00:00"

    // Função para normalizar horário para formato HH:MM:SS
    const normalizeTime = (timeString: string) => {
      const parts = timeString.split(":");
      const hour = String(parseInt(parts[0]) || 0).padStart(2, '0');
      const minute = String(parseInt(parts[1]) || 0).padStart(2, '0');
      const second = String(parseInt(parts[2]) || 0).padStart(2, '0');

      return `${hour}:${minute}:${second}`;
    };

    const normalizedFromTime = normalizeTime(availableFromTime);
    const normalizedToTime = normalizeTime(availableToTime);

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    await db
      .insert(doctorsTable)
      .values({
        ...parsedInput,
        id: parsedInput.id,
        clinicId: session?.user.clinic?.id,
        availableFromTime: normalizedFromTime,
        availableToTime: normalizedToTime,
      })
      .onConflictDoUpdate({
        target: [doctorsTable.id],
        set: {
          ...parsedInput,
          availableFromTime: normalizedFromTime,
          availableToTime: normalizedToTime,
        },
      });

    revalidatePath("/doctors");
  });