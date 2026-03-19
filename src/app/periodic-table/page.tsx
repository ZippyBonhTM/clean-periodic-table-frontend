import ElementsWorkspace from '@/components/templates/ElementsWorkspace';
import { listPublicElementsServer } from '@/shared/api/backendServerApi';

export default async function PeriodicTablePage() {
  const { elements, isPubliclyAvailable } = await listPublicElementsServer();

  return (
    <ElementsWorkspace
      tableMode="table"
      initialElements={elements}
      hasPublicElements={isPubliclyAvailable}
    />
  );
}
