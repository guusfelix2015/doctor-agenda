import { z } from "zod";

export const deleteAppointmentSchema = z.object({
  id: z.string().uuid({
    message: "ID do agendamento é obrigatório.",
  }),
});

export type DeleteAppointmentSchema = z.infer<typeof deleteAppointmentSchema>; 