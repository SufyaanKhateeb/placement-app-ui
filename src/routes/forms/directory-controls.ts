export type DirectoryView = "list" | "blocks";

export type DirectoryControls = {
    query: string;
    status: string;
    view: DirectoryView;
};

export const initialDirectoryControls: DirectoryControls = { query: "", status: "all", view: "list" };

export const reviewStatuses = [
    { value: "submitted", label: "Awaiting review" },
    { value: "changes_requested", label: "Changes requested" },
    { value: "approved", label: "Approved" },
];
