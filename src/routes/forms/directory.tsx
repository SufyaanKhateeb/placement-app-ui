import type { ReactNode } from "react";
import { ChevronRight, FileText, LayoutGrid, List, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DirectoryControls, DirectoryView } from "./directory-controls";

type StatusOption = { value: string; label: string };

export function DirectoryToolbar({ controls, onChange, options, searchLabel, count }: {
    controls: DirectoryControls;
    onChange: (controls: DirectoryControls) => void;
    options: readonly StatusOption[];
    searchLabel: string;
    count?: string;
}) {
    return (
        <div className="directory-toolbar">
            <div className="directory-search">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input aria-label={searchLabel} placeholder={searchLabel} value={controls.query} className="h-8 pl-8 pr-8"
                    maxLength={256} onChange={event => onChange({ ...controls, query: event.target.value })} />
                {controls.query && (
                    <Button type="button" size="sm" variant="ghost" className="absolute right-0.5 top-0.5 size-7 p-0"
                        aria-label="Clear search" onClick={() => onChange({ ...controls, query: "" })}>
                        <X className="size-3.5" aria-hidden="true" />
                    </Button>
                )}
            </div>
            {options.length > 0 && (
                <Select value={controls.status} onValueChange={status => onChange({ ...controls, status: status || "all" })}>
                    <SelectTrigger aria-label="Filter by status" className="h-8 w-auto gap-2 px-2.5">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="all">All statuses</SelectItem>
                            {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            )}
            <span role="status" className="directory-count">{count}</span>
            <div role="group" aria-label="View layout" className="directory-switcher">
                <Button type="button" size="sm" variant="ghost" aria-pressed={controls.view === "list"}
                    aria-label="List view" title="List view" onClick={() => onChange({ ...controls, view: "list" })}>
                    <List className="size-4" aria-hidden="true" />
                </Button>
                <Button type="button" size="sm" variant="ghost" aria-pressed={controls.view === "blocks"}
                    aria-label="Block view" title="Block view" onClick={() => onChange({ ...controls, view: "blocks" })}>
                    <LayoutGrid className="size-4" aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}

type DirectoryItem = {
    href: string;
    title: string;
    subtitle?: string;
    status?: ReactNode;
    version?: number;
    action?: string;
};

export function DirectoryItems({ items, view }: { items: DirectoryItem[]; view: DirectoryView }) {
    return (
        <ul className="directory-list" data-view={view}>
            {items.map(item => (
                <li key={item.href}>
                    <Link className="directory-link" to={item.href}>
                        <span className="directory-name">
                            <span className="directory-icon"><FileText className="size-3.5" aria-hidden="true" /></span>
                            <span className="min-w-0 break-words">
                                <span className="block font-medium">{item.title}</span>
                                {item.subtitle && <span className="block text-xs text-muted-foreground">{item.subtitle}</span>}
                            </span>
                        </span>
                        {item.status && <span className="directory-status">{item.status}</span>}
                        {item.version !== undefined && (
                            <span className="directory-version">
                                <span className="sr-only">Version </span><span aria-hidden="true">v</span>{item.version}
                            </span>
                        )}
                        <span className="directory-action">
                            {item.action && <span>{item.action}</span>}
                            <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

export function DirectoryNoResults({ onReset }: { onReset: () => void }) {
    return (
        <Empty className="mx-auto max-w-sm">
            <EmptyHeader><EmptyTitle>No matches</EmptyTitle></EmptyHeader>
            <Button type="button" size="sm" variant="outline" onClick={onReset}>Clear search and filters</Button>
        </Empty>
    );
}
