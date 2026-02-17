import { redirect } from "next/navigation";

export default function ContractInspectionsPage({
    params,
}: {
    params: { id: string };
}) {
    redirect(`/contracts/${params.id}?tab=inspections`);
}
