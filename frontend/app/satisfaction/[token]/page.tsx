import { SatisfactionExperience } from "../../../features/satisfaction/components/SatisfactionExperience";

export default async function SatisfactionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SatisfactionExperience token={token} />;
}
