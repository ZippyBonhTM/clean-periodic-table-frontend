import ElementsWorkspace from '@/components/templates/ElementsWorkspace';
import { listPublicElementsServer } from '@/shared/api/backendServerApi';

export default async function SearchPage() {
  const { elements, isPubliclyAvailable } = await listPublicElementsServer();

  return (
    <ElementsWorkspace
      tableMode="explore"
      initialElements={elements}
      hasPublicElements={isPubliclyAvailable}
    />
  );
}
