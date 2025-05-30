import { Button } from "@/components/ui/button";
import { PageActions, PageContainer, PageHeader, PageHeaderContent, PageHeaderDescription, PageHeaderTitle } from "@/components/ui/page-container";

const DoctorsPage = async () => {
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

    </PageContainer>
  )
}

export default DoctorsPage;