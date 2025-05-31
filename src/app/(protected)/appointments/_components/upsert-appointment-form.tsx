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
import { doctorsTable, patientsTable } from "@/db/schema";
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

interface UpsertAppointmentFormProps {
  doctors: (typeof doctorsTable.$inferSelect)[];
  patients: (typeof patientsTable.$inferSelect)[];
  onSuccess?: () => void;
}

// Função para gerar horários disponíveis baseados na disponibilidade do médico
const generateTimeSlots = (startTime: string, endTime: string) => {
  const slots = [];
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);

  const current = new Date(start);

  while (current < end) {
    const timeString = current.toTimeString().slice(0, 5); // HH:MM format
    slots.push({
      value: timeString,
      label: timeString,
    });

    // Adiciona 30 minutos
    current.setMinutes(current.getMinutes() + 30);
  }

  return slots;
};

const UpsertAppointmentForm = ({ doctors, patients, onSuccess }: UpsertAppointmentFormProps) => {
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
  const selectedDoctor = doctors.find(doctor => doctor.id === watchedDoctorId);

  // Gera os horários disponíveis baseados no médico selecionado
  const availableTimeSlots = useMemo(() => {
    if (!selectedDoctor?.availableFromTime || !selectedDoctor?.availableToTime) {
      return [];
    }

    return generateTimeSlots(
      selectedDoctor.availableFromTime,
      selectedDoctor.availableToTime
    );
  }, [selectedDoctor]);

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

  // Limpa o horário quando o médico muda
  useEffect(() => {
    form.setValue("time", "");
  }, [watchedDoctorId, form]);

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
                  disabled={!isPatientAndDoctorSelected}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableTimeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
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

export default UpsertAppointmentForm; 