"use server";

import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { createAppointmentSchema } from "./schema";

export const createAppointment = actionClient
  .schema(createAppointmentSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    // Combina a data com o horário para criar um timestamp completo
    const appointmentDateTime = dayjs(parsedInput.date)
      .set('hour', parseInt(parsedInput.time.split(':')[0]))
      .set('minute', parseInt(parsedInput.time.split(':')[1]))
      .set('second', 0)
      .set('millisecond', 0)
      .toDate();

    await db.insert(appointmentsTable).values({
      patientId: parsedInput.patientId,
      doctorId: parsedInput.doctorId,
      clinicId: session.user.clinic.id,
      appointmentDateTime,
      appointmentPriceInCents: parsedInput.appointmentPriceInCents,
    });

    revalidatePath("/appointments");
  }); 