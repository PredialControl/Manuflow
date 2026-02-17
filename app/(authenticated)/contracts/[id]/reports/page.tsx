import { redirect } from "next/navigation";

export default function ContractReportsPage({
    params,
}: {
    params: { id: string };
}) {
    redirect(`/contracts/${params.id}?tab=reports`);
}
