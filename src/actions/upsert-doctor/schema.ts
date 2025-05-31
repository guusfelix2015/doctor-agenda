import { z } from "zod";

// Regex para validar formato de horário HH:MM ou HH:MM:SS
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

export const upsertDoctorSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, {
      message: "Nome é obrigatório.",
    }),
    specialty: z.string().trim().min(1, {
      message: "Especialidade é obrigatória.",
    }),
    appointmentPriceInCents: z.number().min(1, {
      message: "Preço da consulta é obrigatório.",
    }),
    availableFromWeekDay: z.number().min(0).max(6),
    availableToWeekDay: z.number().min(0).max(6),
    availableFromTime: z.string().min(1, {
      message: "Hora de início é obrigatória.",
    }).regex(timeRegex, {
      message: "Formato de horário inválido. Use HH:MM ou HH:MM:SS.",
    }),
    availableToTime: z.string().min(1, {
      message: "Hora de término é obrigatória.",
    }).regex(timeRegex, {
      message: "Formato de horário inválido. Use HH:MM ou HH:MM:SS.",
    }),
  })
  .refine(
    (data) => {
      // Normaliza os horários para comparação (adiciona :00 se necessário)
      const normalizeTime = (time: string) => {
        return time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
      };

      const fromTime = normalizeTime(data.availableFromTime);
      const toTime = normalizeTime(data.availableToTime);

      return fromTime < toTime;
    },
    {
      message:
        "O horário de início não pode ser anterior ao horário de término.",
      path: ["availableToTime"],
    },
  );

export type UpsertDoctorSchema = z.infer<typeof upsertDoctorSchema>;