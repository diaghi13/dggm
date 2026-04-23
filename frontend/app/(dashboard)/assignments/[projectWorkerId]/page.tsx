import { AssignmentDaysClient } from './_components/assignment-days-client';

interface Props {
  params: Promise<{ projectWorkerId: string }>;
}

export default async function AssignmentPage({ params }: Props) {
  const { projectWorkerId } = await params;
  return <AssignmentDaysClient projectWorkerId={parseInt(projectWorkerId, 10)} />;
}
