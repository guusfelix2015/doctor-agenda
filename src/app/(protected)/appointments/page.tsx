import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/ui/data-table";
import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent, PageHeaderDescription, PageHeaderTitle } from "@/components/ui/page-container";
import { db } from "@/db";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import AddAppointmentButton from "./_components/add-appointment-button";
import { appointmentsTableColumns } from "./_components/table-columns";

const AppointmentsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  const [doctors, patients, appointments] = await Promise.all([
    db.query.doctorsTable.findMany({
      where: eq(doctorsTable.clinicId, session.user.clinic.id),
      orderBy: (doctors, { asc }) => [asc(doctors.name)],
    }),
    db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, session.user.clinic.id),
      orderBy: (patients, { asc }) => [asc(patients.name)],
    }),
    db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.clinicId, session.user.clinic.id),
      with: {
        patient: true,
        doctor: true,
      },
      orderBy: (appointments, { desc }) => [desc(appointments.appointmentDateTime)],
    }),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Agendamentos</PageHeaderTitle>
          <PageHeaderDescription>Gerencie os agendamentos do sistema</PageHeaderDescription>
        </PageHeaderContent>
        <PageActions>
          <AddAppointmentButton
            doctors={doctors}
            patients={patients}
            existingAppointments={appointments.map(appointment => ({
              ...appointment,
              patient: appointment.patient!,
              doctor: appointment.doctor!
            }))}
          />
        </PageActions>
      </PageHeader>
      <PageContent>
        {appointments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Nenhum agendamento cadastrado ainda.</p>
            <p className="text-sm">Clique em &quot;Novo agendamento&quot; para começar.</p>
          </div>
        ) : (
          <DataTable
            columns={appointmentsTableColumns}
            data={appointments.map(appointment => ({
              ...appointment,
              patient: appointment.patient!,
              doctor: appointment.doctor!
            }))}
          />
        )}
      </PageContent>
    </PageContainer>
  );
};

export default AppointmentsPage; 