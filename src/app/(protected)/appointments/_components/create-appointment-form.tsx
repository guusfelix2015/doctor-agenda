"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { createAppointment } from "@/actions/create-appointment";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  patientId: z.string().uuid({
    message: "Paciente é obrigatório.",
  }),
  doctorId: z.string().uuid({
    message: "Médico é obrigatório.",
  }),
  appointmentPrice: z.number().min(1, {
    message: "Valor da consulta é obrigatório.",
  }),
  date: z.date({
    required_error: "Data é obrigatória.",
  }),
  time: z.string().min(1, {
    message: "Horário é obrigatório.",
  }),
});

type ExistingAppointment = typeof appointmentsTable.$inferSelect & {
  patient: typeof patientsTable.$inferSelect;
  doctor: typeof doctorsTable.$inferSelect;
};

interface CreateAppointmentFormProps {
  doctors: (typeof doctorsTable.$inferSelect)[];
  patients: (typeof patientsTable.$inferSelect)[];
  existingAppointments: ExistingAppointment[];
  onSuccess?: () => void;
}

// Função para gerar horários disponíveis baseados na disponibilidade do médico
const generateTimeSlots = (startTime: string, endTime: string) => {
  const slots = [];

  // Parse do horário inicial
  const startParts = startTime.split(':');
  let currentHour = parseInt(startParts[0]);
  let currentMinute = parseInt(startParts[1]);

  // Parse do horário final
  const endParts = endTime.split(':');
  const endHour = parseInt(endParts[0]);
  const endMinute = parseInt(endParts[1]);

  // Converte tudo para minutos para comparação mais fácil
  const endTotalMinutes = endHour * 60 + endMinute;

  while (true) {
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Para quando chegar no horário final
    if (currentTotalMinutes >= endTotalMinutes) {
      break;
    }

    // Formata o horário atual
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    slots.push({
      value: timeString,
      label: timeString,
      disabled: false,
    });

    // Adiciona 30 minutos
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentMinute -= 60;
      currentHour += 1;
    }
  }

  return slots;
};

// Função para marcar horários ocupados como indisponíveis
const markUnavailableSlots = (
  allSlots: { value: string; label: string; disabled: boolean }[],
  existingAppointments: ExistingAppointment[],
  doctorId: string,
  selectedDate: Date
) => {
  if (!selectedDate || !doctorId) return allSlots;

  // Filtra agendamentos do médico na data selecionada
  const appointmentsOnDate = existingAppointments.filter(appointment => {
    if (appointment.doctorId !== doctorId) return false;

    const appointmentDate = new Date(appointment.appointmentDateTime);
    const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
    const appointmentDateString = format(appointmentDate, 'yyyy-MM-dd');

    return selectedDateString === appointmentDateString;
  });

  // Cria set com horários ocupados
  const occupiedTimes = new Set(
    appointmentsOnDate.map(appointment => {
      const appointmentDate = new Date(appointment.appointmentDateTime);
      return format(appointmentDate, 'HH:mm');
    })
  );

  // Marca horários ocupados como disabled e adiciona texto
  return allSlots.map(slot => ({
    ...slot,
    disabled: occupiedTimes.has(slot.value),
    label: occupiedTimes.has(slot.value)
      ? `${slot.value} (indisponível)`
      : slot.value,
  }));
};

const CreateAppointmentForm = ({ doctors, patients, existingAppointments, onSuccess }: CreateAppointmentFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      appointmentPrice: 0,
      date: undefined,
      time: "",
    },
  });

  const watchedDoctorId = form.watch("doctorId");
  const watchedPatientId = form.watch("patientId");
  const watchedDate = form.watch("date");
  const selectedDoctor = doctors.find(doctor => doctor.id === watchedDoctorId);

  // Gera os horários disponíveis baseados no médico selecionado e filtra os ocupados
  const availableTimeSlots = useMemo(() => {
    if (!selectedDoctor?.availableFromTime || !selectedDoctor?.availableToTime) {
      return [];
    }

    // Gera todos os horários possíveis
    const allSlots = generateTimeSlots(
      selectedDoctor.availableFromTime,
      selectedDoctor.availableToTime
    );

    // Filtra horários já ocupados
    return markUnavailableSlots(
      allSlots,
      existingAppointments,
      watchedDoctorId,
      watchedDate
    );
  }, [selectedDoctor, existingAppointments, watchedDoctorId, watchedDate]);

  // Server Action
  const createAppointmentAction = useAction(createAppointment, {
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso!");
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao criar agendamento.");
    },
  });

  // Atualiza o preço quando o médico é selecionado
  useEffect(() => {
    if (selectedDoctor?.appointmentPriceInCents) {
      form.setValue("appointmentPrice", selectedDoctor.appointmentPriceInCents / 100);
    }
  }, [selectedDoctor, form]);

  // Limpa o horário quando o médico ou data muda
  useEffect(() => {
    form.setValue("time", "");
  }, [watchedDoctorId, watchedDate, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createAppointmentAction.execute({
      patientId: values.patientId,
      doctorId: values.doctorId,
      appointmentPriceInCents: values.appointmentPrice * 100,
      date: values.date,
      time: values.time,
    });
  };

  // Verifica se paciente e médico estão selecionados
  const isPatientAndDoctorSelected = watchedPatientId && watchedDoctorId;

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Novo agendamento</DialogTitle>
        <DialogDescription>
          Preencha as informações para criar um novo agendamento.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Médico</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um médico" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appointmentPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da consulta</FormLabel>
                <FormControl>
                  <NumericFormat
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value.floatValue);
                    }}
                    decimalScale={2}
                    fixedDecimalScale
                    decimalSeparator=","
                    allowNegative={false}
                    allowLeadingZeros={false}
                    thousandSeparator="."
                    customInput={Input}
                    prefix="R$ "
                    placeholder="R$ 0,00"
                    disabled={!selectedDoctor}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={!isPatientAndDoctorSelected}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!isPatientAndDoctorSelected || !watchedDate}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        !watchedDate
                          ? "Selecione uma data primeiro"
                          : availableTimeSlots.length === 0
                            ? "Nenhum horário disponível"
                            : "Selecione um horário"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableTimeSlots.map((slot) => (
                      <SelectItem
                        key={slot.value}
                        value={slot.value}
                        disabled={slot.disabled}
                      >
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="submit"
              disabled={createAppointmentAction.isExecuting}
              className="w-full"
            >
              {createAppointmentAction.isExecuting ? "Criando agendamento..." : "Criar agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default CreateAppointmentForm; 