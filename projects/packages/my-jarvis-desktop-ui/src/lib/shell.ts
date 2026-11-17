// Desktop shell view model: modules, accounts, conversations and messages.
// Local mock data until the corresponding `mj.*` contracts land.

export type ModuleStatus = "ready" | "partial" | "missing";

export interface ModuleDef {
    id: string;
    label: string;
    icon: string;
    status: ModuleStatus;
    dot: boolean;
    capability: string;
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
    tone: string;
}

export interface ConversationDef {
    id: string;
    title: string;
    preview: string;
    time: string;
    unread: number;
    group: string;
    initials: string;
    tone: string;
    pinned: boolean;
}

export interface MessageDef {
    id: number;
    role: "user" | "agent" | "system";
    text: string;
    time: string;
}

const MODULES: ModuleDef[] = [
    { id: "messages", label: "Messages", icon: "message", status: "missing", dot: true, capability: "mj.im.*" },
    { id: "mail", label: "Mail", icon: "mail", status: "missing", dot: false, capability: "mj.mail.*" },
    { id: "docs", label: "Docs", icon: "doc", status: "missing", dot: false, capability: "mj.doc.*" },
    { id: "space", label: "Space", icon: "space", status: "partial", dot: false, capability: "mj.space.*" },
    { id: "assistant", label: "Assistant", icon: "spark", status: "ready", dot: false, capability: "mj.llm.complete" },
    { id: "calendar", label: "Calendar", icon: "calendar", status: "missing", dot: false, capability: "mj.calendar.*" },
    { id: "meetings", label: "Meetings", icon: "meeting", status: "missing", dot: false, capability: "mj.meeting.*" },
    { id: "contacts", label: "Contacts", icon: "contacts", status: "missing", dot: false, capability: "mj.contact.*" },
];

const ACCOUNTS: AccountDef[] = [
    {
        id: "acc-lin",
        name: "Lin Wan",
        initials: "L",
        plan: "Pro",
        quota: "1,240 pts left",
        lastActive: "Today 09:12",
        role: "member",
        workspace: "Personal",
        tone: "blue",
    },
    {
        id: "acc-chen",
        name: "Chen Mo",
        initials: "C",
        plan: "Free",
        quota: "86 pts left",
        lastActive: "Yesterday 22:40",
        role: "member",
        workspace: "Personal",
        tone: "violet",
    },
    {
        id: "acc-acme",
        name: "Acme Workspace",
        initials: "A",
        plan: "Enterprise",
        quota: "12 of 40 seats",
        lastActive: "Today 08:30",
        role: "admin",
        workspace: "Acme",
        tone: "green",
    },
];

const CONVERSATIONS: ConversationDef[] = [
    {
        id: "c1",
        title: "Chief",
        preview: "Summary done, draft ready — sending needs your approval.",
        time: "10:54",
        unread: 2,
        group: "Pinned",
        initials: "C",
        tone: "green",
        pinned: true,
    },
    {
        id: "c2",
        title: "Quarterly report",
        preview: "You: summarize the Q3 numbers for the review.",
        time: "09:41",
        unread: 0,
        group: "Today",
        initials: "Q",
        tone: "blue",
        pinned: false,
    },
    {
        id: "c3",
        title: "Release notes agent",
        preview: "Agent: three items still block the release.",
        time: "09:02",
        unread: 5,
        group: "Today",
        initials: "R",
        tone: "violet",
        pinned: false,
    },
    {
        id: "c4",
        title: "Zhang Ming",
        preview: "Mail draft is waiting in Mail.",
        time: "Yesterday",
        unread: 0,
        group: "Today",
        initials: "Z",
        tone: "amber",
        pinned: false,
    },
    {
        id: "c5",
        title: "SMS bridge",
        preview: "Delivery receipt confirmed.",
        time: "Yesterday",
        unread: 0,
        group: "Earlier",
        initials: "S",
        tone: "slate",
        pinned: false,
    },
];

const MESSAGES: MessageDef[] = [
    { id: 1, role: "user", text: "Summarize the quarterly report and draft a reply to Zhang Ming.", time: "10:51" },
    { id: 2, role: "agent", text: "Summary is ready in Docs. The draft reply is written and attached to a pending mail action.", time: "10:52" },
    { id: 3, role: "system", text: "mj.llm.complete finished · mj.mail.send awaits approval", time: "10:53" },
    { id: 4, role: "agent", text: "Approve the mail action on the right and I will send it.", time: "10:53" },
];

const NOTES: Record<string, string> = {
    messages: "Conversations appear here once a channel is connected.",
    mail: "Your inbox appears here once a mail account is connected.",
    docs: "Documents are stored in the local database once the contract lands.",
    space: "Asset hosting exists in the runtime; the public contract is pending.",
    calendar: "Events and reminders appear here once the contract lands.",
    meetings: "Meeting details and minutes appear here once the contract lands.",
    contacts: "People resolve through contacts once the contract lands.",
};

// Factory helpers keep VMZ class-field initializers as call expressions.

export function defaultModules(): ModuleDef[] {
    return MODULES;
}

export function defaultAccounts(): AccountDef[] {
    return ACCOUNTS;
}

export function defaultConversations(): ConversationDef[] {
    return CONVERSATIONS;
}

export function defaultMessages(): MessageDef[] {
    return MESSAGES;
}

export function firstAccount(): AccountDef {
    return ACCOUNTS[0]!;
}

export function moduleNote(id: string): string {
    return NOTES[id] ?? "";
}
