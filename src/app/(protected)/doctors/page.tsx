import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent, PageHeaderDescription, PageHeaderTitle } from "@/components/ui/page-container";
import { auth } from "@/lib/auth";

const DoctorsPage = async () => {
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
          <PageHeaderTitle>Médicos</PageHeaderTitle>
          <PageHeaderDescription>Gerencie os médicos cadastrados no sistema</PageHeaderDescription>
        </PageHeaderContent>
        <PageActions>
          <Button>Adicionar Médico</Button>
        </PageActions>
      </PageHeader>
      <PageContent>
        Médicos
      </PageContent>
    </PageContainer>
  )
}

export default DoctorsPage;