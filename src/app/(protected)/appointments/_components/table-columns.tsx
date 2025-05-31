"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreVertical } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deleteAppointment } from "@/actions/delete-appointment";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";

type Appointment = typeof appointmentsTable.$inferSelect & {
  patient: typeof patientsTable.$inferSelect;
  doctor: typeof doctorsTable.$inferSelect;
};

const ActionsCell = ({ appointment }: { appointment: Appointment }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deleteAppointmentAction = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success("Agendamento deletado com sucesso.");
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error("Erro ao deletar agendamento.");
    },
  });

  const handleDeleteAppointment = () => {
    deleteAppointmentAction.execute({ id: appointment.id });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive"
          >
            Deletar agendamento
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja deletar este agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. O agendamento de <strong>{appointment.patient.name}</strong> com <strong>{appointment.doctor.name}</strong> será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointment}
              disabled={deleteAppointmentAction.isExecuting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
            >
              {deleteAppointmentAction.isExecuting ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const columns: ColumnDef<Appointment>[] = [
  {
    accessorKey: "patient.name",
    header: "Paciente",
    cell: ({ row }) => row.original.patient.name,
  },
  {
    accessorKey: "doctor.name",
    header: "Médico",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.doctor.name}</div>
        <div className="text-sm text-muted-foreground">{row.original.doctor.specialty}</div>
      </div>
    ),
  },
  {
    accessorKey: "appointmentDateTime",
    header: "Data e Horário",
    cell: ({ row }) => {
      const dateTime = new Date(row.getValue("appointmentDateTime"));
      return (
        <div>
          <div className="font-medium">
            {format(dateTime, "dd/MM/yyyy", { locale: ptBR })}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(dateTime, "HH:mm", { locale: ptBR })}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "appointmentPriceInCents",
    header: "Valor",
    cell: ({ row }) => {
      const amount = row.getValue("appointmentPriceInCents") as number;
      return formatCurrencyInCents(amount);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell appointment={row.original} />,
  },
]; 