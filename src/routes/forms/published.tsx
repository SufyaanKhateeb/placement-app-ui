import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { axiosInstance } from "@/config/axios";
import { publishedFormsPath, requestError } from "./api";
import type { FormSummary, PublishedForm } from "./api";
import { FormPreview } from "./form-preview";

export function PublishedFormsPage() {
    const forms = useQuery({
        queryKey: ["publishedForms"],
        queryFn: async () => (await axiosInstance.get<FormSummary[]>(publishedFormsPath)).data,
        retry: false,
    });
    return (
        <section className="mx-auto w-full max-w-3xl space-y-5 px-6 py-10">
            <h1 className="text-2xl font-semibold">Forms</h1>
            {forms.isPending && <p role="status">Loading forms…</p>}
            {forms.isError && <p role="alert">Could not load forms.</p>}
            {forms.data?.length === 0 && <p className="text-sm text-muted-foreground">No forms have been published.</p>}
            {!!forms.data?.length && <ul className="divide-y overflow-hidden rounded-lg border">
                {forms.data.map(form => <li key={form.id}>
                    <Link className="block px-4 py-3 hover:bg-muted/50" to={publishedFormsPath + "/" + form.id}>{form.title}</Link>
                </li>)}
            </ul>}
        </section>
    );
}

export function PublishedFormPage() {
    const { id } = useParams();
    const form = useQuery({
        queryKey: ["publishedForms", id],
        queryFn: async () => (await axiosInstance.get<PublishedForm>(publishedFormsPath + "/" + id)).data,
        retry: false,
    });
    return (
        <section className="mx-auto w-full max-w-2xl space-y-5 px-6 py-10">
            <Link className="text-sm text-muted-foreground hover:underline" to="/forms">All forms</Link>
            {form.isPending && <p role="status">Loading form…</p>}
            {form.isError && <p role="alert">{requestError(form.error, "Could not load form.")}</p>}
            {form.data && <div className="space-y-5 rounded-lg border p-5">
                <FormPreview definition={form.data.definition} />
                <p className="text-sm text-muted-foreground">Submissions are not available yet.</p>
            </div>}
        </section>
    );
}