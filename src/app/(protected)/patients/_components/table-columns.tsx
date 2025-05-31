"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deletePatient } from "@/actions/delete-patient";
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
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { patientsTable } from "@/db/schema";

import UpsertPatientForm from "./upsert-patient-form";

type Patient = typeof patientsTable.$inferSelect;

const PatientActionsCell = ({ patient }: { patient: Patient }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deletePatientAction = useAction(deletePatient, {
    onSuccess: () => {
      toast.success("Paciente excluído com sucesso.");
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error("Erro ao excluir paciente.");
    },
  });

  const handleDeletePatient = () => {
    deletePatientAction.execute({ id: patient.id });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <UpsertPatientForm
          patient={patient}
          onSuccess={() => setIsEditDialogOpen(false)}
        />
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tem certeza que deseja excluir este paciente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. Isso irá excluir permanentemente o paciente {patient.name} e todos os dados relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              disabled={deletePatientAction.isExecuting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePatientAction.isExecuting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const columns: ColumnDef<Patient>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Nome",
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "phoneNumber",
    accessorKey: "phoneNumber",
    header: "Telefone",
    cell: ({ row }) => {
      const phoneNumber = row.getValue("phoneNumber") as string;
      const cleaned = phoneNumber.replace(/\D/g, '');
      if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
      }
      return phoneNumber;
    },
  },
  {
    id: "sex",
    accessorKey: "sex",
    header: "Sexo",
    cell: ({ row }) => {
      const sex = row.getValue("sex") as "male" | "female";
      return sex === "male" ? "Masculino" : "Feminino";
    },
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const patient = row.original;
      return <PatientActionsCell patient={patient} />;
    },
  },
];
