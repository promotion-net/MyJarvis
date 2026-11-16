// Shell view model for the desktop surface (D1): module registry, accounts and
// capability visibility. Data is local mock until the runtime capabilities land.

export type ModuleStatus = "ready" | "partial" | "missing";

export interface ModuleDef {
    id: string;
    label: string;
    glyph: string;
    status: ModuleStatus;
    badge: number;
    /** Capability namespace the module needs, shown in the empty state. */
    capability: string;
    /** Work-scenario module: hidden in the personal scenario. */
    work: boolean;
}

export interface AccountDef {
    id: string;
    name: string;
    initials: string;
    plan: string;
    quota: string;
    lastActive: string;
    role: "member" | "admin";
    workspace: string;
}

export const MODULES: ModuleDef[] = [
    { id: "messages", label: "Messages", glyph: "M", status: "missing", badge: 3, capability: "mj.im.*", work: false },
    { id: "mail", label: "Mail", glyph: "E", status: "missing", badge: 0, capability: "mj.mail.*", work: false },
    { id: "docs", label: "Docs", glyph: "D", status: "missing", badge: 0, capability: "mj.doc.*", work: false },
    { id: "space", label: "Space", glyph: "S", status: "partial", badge: 0, capability: "mj.space.*", work: false },
    { id: "assistant", label: "Assistant", glyph: "A", status: "ready", badge: 0, capability: "mj.llm.complete", work: false },
    { id: "calendar", label: "Calendar", glyph: "C", status: "missing", badge: 0, capability: "mj.calendar.*", work: true },
    { id: "meetings", label: "Meetings", glyph: "V", status: "missing", badge: 0, capability: "mj.meeting.*", work: true },
    { id: "contacts", label: "Contacts", glyph: "P", status: "missing", badge: 0, capability: "mj.contact.*", work: true },
];

export const ACCOUNTS: AccountDef[] = [
    {
        id: "acc-lin",
        name: "Lin Wan",
        initials: "L",
        plan: "Pro",
        quota: "1,240 pts left",
        lastActive: "Today 09:12",
        role: "member",
        workspace: "Personal · Lin Wan",
    },
    {
        id: "acc-chen",
        name: "Chen Mo",
        initials: "C",
        plan: "Free",
        quota: "86 pts left",
        lastActive: "Yesterday 22:40",
        role: "member",
        workspace: "Personal · Chen Mo",
    },
    {
        id: "acc-acme",
        name: "Acme Workspace",
        initials: "A",
        plan: "Enterprise",
        quota: "seats 12/40",
        lastActive: "Today 08:30",
        role: "admin",
        workspace: "Acme · admin",
    },
];

export const STATUS_TAG: Record<ModuleStatus, string> = {
    ready: "",
    partial: "partial",
    missing: "not connected",
};

// Factory helpers: VMZ class-field initializers must be call expressions, not
// bare imported identifiers, so the reactive compiler keeps the field names.

export function defaultModules(): ModuleDef[] {
    return MODULES;
}

export function defaultAccounts(): AccountDef[] {
    return ACCOUNTS;
}

export function firstAccount(): AccountDef {
    return ACCOUNTS[0]!;
}
