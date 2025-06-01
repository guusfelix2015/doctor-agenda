import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent, PageHeaderDescription, PageHeaderTitle } from "@/components/ui/page-container";
import { auth } from "@/lib/auth";

import { DatePicker } from "./_components/date-picker";



const DashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Pacientes</PageHeaderTitle>
          <PageHeaderDescription>Gerencie os pacientes cadastrados no sistema</PageHeaderDescription>
        </PageHeaderContent>
        <PageActions>
          <DatePicker />
        </PageActions>
      </PageHeader>
      <PageContent>
        <></>
      </PageContent>
    </PageContainer>
  );
};

export default DashboardPage; 