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

export interface ScenarioDef {
    id: string;
    label: string;
    modules: string[];
}

export interface MailFolder {
    id: string;
    label: string;
    unread: number;
}

export interface MailItem {
    id: string;
    folder: string;
    sender: string;
    to: string;
    subject: string;
    preview: string;
    body: string[];
    time: string;
    starred: boolean;
    initials: string;
    tone: string;
}

export interface DocItem {
    id: string;
    title: string;
    group: string;
    updated: string;
    body: string;
    versions: { label: string; time: string; author: string }[];
}

export interface SpaceObject {
    id: string;
    kind: "file" | "device" | "repo" | "workspace";
    name: string;
    detail: string;
    size: string;
}

export interface SpaceItem {
    id: string;
    name: string;
    kind: "personal" | "team" | "project";
    quotaUsed: number;
    objects: SpaceObject[];
}

export interface CalendarEvent {
    id: string;
    day: number;
    start: string;
    end: string;
    title: string;
    where: string;
    attendees: number;
    tone: string;
}

export interface MeetingItem {
    id: string;
    title: string;
    when: string;
    organizer: string;
    attendees: number;
    agenda: string[];
    minutes: string;
    status: "scheduled" | "past";
}

export interface ContactItem {
    id: string;
    name: string;
    title: string;
    dept: string;
    email: string;
    phone: string;
    initials: string;
    tone: string;
}

export interface AdminSection {
    id: string;
    label: string;
    icon: string;
    note: string;
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

export interface AgentDef {
    id: string;
    name: string;
    initials: string;
    tone: string;
    isChief: boolean;
    models: string[];
    capabilities: string[];
    space: string;
    spaceId: string;
    lastUsed: string;
    calls24h: number;
    pendingApprovals: number;
}

const MODULES: ModuleDef[] = [
    { id: "messages", label: "Messages", icon: "nav.chat", status: "missing", dot: true, capability: "mj.im.*" },
    { id: "mail", label: "Mail", icon: "action.mail", status: "missing", dot: false, capability: "mj.mail.*" },
    { id: "docs", label: "Docs", icon: "file.document", status: "missing", dot: false, capability: "mj.doc.*" },
    { id: "space", label: "Space", icon: "file.folder", status: "partial", dot: false, capability: "mj.space.*" },
    { id: "agents", label: "Agents", icon: "feature.assistant", status: "ready", dot: false, capability: "mj.agent.*" },
    { id: "calendar", label: "Calendar", icon: "action.calendar", status: "missing", dot: false, capability: "mj.calendar.*" },
    { id: "meetings", label: "Meetings", icon: "media.camera", status: "missing", dot: false, capability: "mj.meeting.*" },
    { id: "contacts", label: "Contacts", icon: "nav.contacts", status: "missing", dot: false, capability: "mj.contact.*" },
    { id: "dev", label: "Developer", icon: "develop.terminal", status: "ready", dot: false, capability: "mj.*" },
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

const AGENTS: AgentDef[] = [
    {
        id: "agent-chief",
        name: "Chief",
        initials: "C",
        tone: "green",
        isChief: true,
        models: ["fast", "balanced"],
        capabilities: ["mj.agent.turn", "mj.mail.draft", "mj.doc.summarize"],
        space: "Personal",
        spaceId: "7f3ac91d54b84f0a93cd0e21b6a4d5c8",
        lastUsed: "2 minutes ago",
        calls24h: 148,
        pendingApprovals: 1,
    },
    {
        id: "agent-release",
        name: "Release notes",
        initials: "R",
        tone: "violet",
        isChief: false,
        models: ["balanced"],
        capabilities: ["mj.agent.turn", "mj.git.read", "mj.doc.write"],
        space: "Acme workspace",
        spaceId: "b1d0e7a34c6f49a2a8f5c3e70d2194bb",
        lastUsed: "1 hour ago",
        calls24h: 23,
        pendingApprovals: 0,
    },
    {
        id: "agent-research",
        name: "Research",
        initials: "S",
        tone: "blue",
        isChief: false,
        models: ["balanced", "reasoning"],
        capabilities: ["mj.agent.turn", "mj.space.read", "mj.doc.write"],
        space: "Personal",
        spaceId: "7f3ac91d54b84f0a93cd0e21b6a4d5c8",
        lastUsed: "Yesterday",
        calls24h: 6,
        pendingApprovals: 0,
    },
];

const MODEL_CATALOG: string[] = ["fast", "balanced", "reasoning"];

const MESSAGES: MessageDef[] = [
    { id: 1, role: "user", text: "Summarize the quarterly report and draft a reply to Zhang Ming.", time: "10:51" },
    { id: 2, role: "agent", text: "Summary is ready in Docs. The draft reply is written and attached to a pending mail action.", time: "10:52" },
    { id: 3, role: "system", text: "mj.agent.turn finished · mj.mail.send awaits approval", time: "10:53" },
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

export function defaultAgents(): AgentDef[] {
    return AGENTS;
}

export function defaultModelCatalog(): string[] {
    return MODEL_CATALOG;
}

export function firstAccount(): AccountDef {
    return ACCOUNTS[0]!;
}

export function moduleNote(id: string): string {
    return NOTES[id] ?? "";
}

// Scenario presets (06 §3.2): switching a scenario only changes the rail set.

const SCENARIOS: ScenarioDef[] = [
    { id: "personal", label: "Personal", modules: ["messages", "mail", "docs", "space", "agents"] },
    { id: "work", label: "Work", modules: ["messages", "mail", "docs", "space", "agents", "calendar", "meetings", "contacts"] },
    { id: "admin", label: "Management", modules: ["messages", "mail", "docs", "space", "agents", "calendar", "meetings", "contacts", "admin"] },
];

export function defaultScenarios(): ScenarioDef[] {
    return SCENARIOS;
}

export function scenarioModules(scenario: string): string[] {
    return SCENARIOS.find((s) => s.id === scenario)?.modules ?? SCENARIOS[0]!.modules;
}

const MAIL_FOLDERS: MailFolder[] = [
    { id: "inbox", label: "Inbox", unread: 4 },
    { id: "sent", label: "Sent", unread: 0 },
    { id: "drafts", label: "Drafts", unread: 1 },
    { id: "archive", label: "Archive", unread: 0 },
];

const MAIL_ITEMS: MailItem[] = [
    {
        id: "m1",
        folder: "inbox",
        sender: "Zhang Ming",
        to: "me",
        subject: "Q3 review numbers",
        preview: "Attaching the consolidated numbers for the review on Thursday.",
        body: [
            "Hi,",
            "Attaching the consolidated numbers for the review on Thursday. The headline is the 12% margin lift in the second half of the quarter.",
            "Could you summarize the three most important changes before Wednesday? That gives us time to react.",
            "— Zhang Ming",
        ],
        time: "09:12",
        starred: true,
        initials: "Z",
        tone: "amber",
    },
    {
        id: "m2",
        folder: "inbox",
        sender: "Acme CI",
        to: "me",
        subject: "Release 2.4 blocked by three items",
        preview: "Build #2214 failed: two contract tests and one flaky smoke run.",
        body: ["Build #2214 failed.", "Two contract tests and one flaky smoke run are blocking the release train.", "See the pipeline log for details."],
        time: "08:47",
        starred: false,
        initials: "A",
        tone: "slate",
    },
    {
        id: "m3",
        folder: "inbox",
        sender: "Lin Wan",
        to: "me",
        subject: "Doc review: storage layout",
        preview: "Left two comments on the `.yydx` section — mostly about the object tree.",
        body: ["Left two comments on the storage section, mostly about the object tree wording.", "Nothing blocking, take a look when you can."],
        time: "Yesterday",
        starred: false,
        initials: "L",
        tone: "blue",
    },
    {
        id: "d1",
        folder: "drafts",
        sender: "me",
        to: "Zhang Ming",
        subject: "Re: Q3 review numbers",
        preview: "Draft started by the Chief — awaiting your edit.",
        body: ["Drafted by the assistant from the mail summary. Edit before sending."],
        time: "10:53",
        starred: false,
        initials: "M",
        tone: "green",
    },
];

export function defaultMailFolders(): MailFolder[] {
    return MAIL_FOLDERS;
}

export function defaultMails(): MailItem[] {
    return MAIL_ITEMS;
}

const DOCS: DocItem[] = [
    {
        id: "doc1",
        title: "Quarterly report",
        group: "Recent",
        updated: "Today 10:52",
        body: "# Q3 summary\n\nMargin lifted 12% in the second half.\n\n- Costs held flat\n- Revenue mix shifted to recurring",
        versions: [
            { label: "v4 · assistant summary", time: "10:52", author: "Chief" },
            { label: "v3 · numbers refresh", time: "09:30", author: "me" },
            { label: "v2 · outline", time: "Mon", author: "me" },
        ],
    },
    {
        id: "doc2",
        title: "Release notes 2.4",
        group: "Shared",
        updated: "Today 08:40",
        body: "# Release notes\n\nThree items still block the release; two are contract tests.",
        versions: [{ label: "v2 · blockers section", time: "08:40", author: "Release notes agent" }],
    },
    {
        id: "doc3",
        title: "Storage layout notes",
        group: "Recent",
        updated: "Yesterday",
        body: "# `.yydx` layout\n\nMain file keeps pages and records; objects over 1 KiB go to the content-addressed tree.",
        versions: [{ label: "v7 · wording", time: "Yesterday", author: "me" }],
    },
];

export function defaultDocs(): DocItem[] {
    return DOCS;
}

const SPACES: SpaceItem[] = [
    {
        id: "7f3ac91d54b84f0a93cd0e21b6a4d5c8",
        name: "Personal",
        kind: "personal",
        quotaUsed: 41,
        objects: [
            { id: "o1", kind: "file", name: "q3-report.pdf", detail: "Referenced by 2 messages", size: "1.2 MiB" },
            { id: "o2", kind: "workspace", name: "vmz dogfood", detail: "Active workspace", size: "—" },
            { id: "o3", kind: "device", name: "Studio laptop", detail: "Seen today 08:30", size: "—" },
        ],
    },
    {
        id: "b1d0e7a34c6f49a2a8f5c3e70d2194bb",
        name: "Acme workspace",
        kind: "team",
        quotaUsed: 67,
        objects: [
            { id: "o4", kind: "repo", name: "my-jarvis", detail: "main @ 9855ac3", size: "—" },
            { id: "o5", kind: "file", name: "release-2.4.zip", detail: "Draft artifact", size: "18.4 MiB" },
        ],
    },
];

export function defaultSpaces(): SpaceItem[] {
    return SPACES;
}

const CALENDAR_EVENTS: CalendarEvent[] = [
    { id: "e1", day: 2, start: "09:30", end: "10:00", title: "Standup", where: "Bridge", attendees: 6, tone: "blue" },
    { id: "e2", day: 2, start: "14:00", end: "15:30", title: "Q3 review", where: "Room 4", attendees: 9, tone: "green" },
    { id: "e3", day: 3, start: "11:00", end: "11:30", title: "1:1 with Chen", where: "Call", attendees: 2, tone: "violet" },
    { id: "e4", day: 4, start: "10:00", end: "12:00", title: "Release sync", where: "Bridge", attendees: 8, tone: "amber" },
];

export function defaultCalendarEvents(): CalendarEvent[] {
    return CALENDAR_EVENTS;
}

const MEETINGS: MeetingItem[] = [
    {
        id: "mt1",
        title: "Q3 review",
        when: "Thu 14:00",
        organizer: "Zhang Ming",
        attendees: 9,
        agenda: ["Margin lift breakdown", "Cost lines", "Next-quarter forecast"],
        minutes: "",
        status: "scheduled",
    },
    {
        id: "mt2",
        title: "Release sync",
        when: "Mon 10:00 (past)",
        organizer: "me",
        attendees: 8,
        agenda: ["Blocker triage", "Go / no-go"],
        minutes: "Three blockers confirmed; two contract tests assigned. Chief drafted the follow-up mail.",
        status: "past",
    },
];

export function defaultMeetings(): MeetingItem[] {
    return MEETINGS;
}

const CONTACTS: ContactItem[] = [
    { id: "p1", name: "Zhang Ming", title: "Finance lead", dept: "Finance", email: "zhang@acme.example", phone: "+86 138-0000-0001", initials: "Z", tone: "amber" },
    { id: "p2", name: "Lin Wan", title: "Product", dept: "Product", email: "lin@acme.example", phone: "+86 138-0000-0002", initials: "L", tone: "blue" },
    { id: "p3", name: "Chen Mo", title: "Engineering", dept: "Platform", email: "chen@acme.example", phone: "+86 138-0000-0003", initials: "C", tone: "violet" },
];

export function defaultContacts(): ContactItem[] {
    return CONTACTS;
}

const ADMIN_SECTIONS: AdminSection[] = [
    { id: "org", label: "Organization", icon: "nav.contacts", note: "Department tree and members need `mj.org.*` (gap). Data plane is host-owned." },
    { id: "approvals", label: "Approvals", icon: "action.shield", note: "Agent capability approval queue needs the policy plane (not built)." },
    { id: "devices", label: "Devices", icon: "hardware.laptop", note: "Device list shows host-reported sessions; bulk kick requires confirmation." },
    { id: "billing", label: "Billing & quota", icon: "action.credit", note: "Ledger read endpoint is pending; prototype numbers only." },
    { id: "audit", label: "Audit", icon: "action.history", note: "Read-only call and approval stream lands with the audit data plane (not built)." },
    { id: "credentials", label: "Credentials", icon: "action.key", note: "BYOK write path needs the vault plane; UI never echoes secrets." },
];

export function defaultAdminSections(): AdminSection[] {
    return ADMIN_SECTIONS;
}

const ADMIN_DEVICES = [
    { id: "dv1", name: "Studio laptop", lastActive: "Today 08:30", points: "1,240 left", today: "312 pts", flagged: false },
    { id: "dv2", name: "Office desktop", lastActive: "Today 07:55", points: "86 left", today: "44 pts", flagged: false },
    { id: "dv3", name: "Unknown device", lastActive: "3 days ago", points: "—", today: "1,980 pts", flagged: true },
];

export function defaultAdminDevices() {
    return ADMIN_DEVICES;
}

// Shell preferences live in localStorage only; the host never sees them.

export interface ShellNav {
    hidden: string[];
    order: string[];
}

const NAV_KEY = "mj.shell.navigation";
const THEME_KEY = "mj.shell.theme";
const SCENARIO_KEY = "mj.shell.scenario";

function storage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function loadShellNav(): ShellNav {
    const store = storage();
    if (store) {
        try {
            const raw = store.getItem(NAV_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<ShellNav>;
                return { hidden: parsed.hidden ?? [], order: parsed.order ?? [] };
            }
        } catch {
            // Corrupt value: fall through to defaults.
        }
    }
    return { hidden: [], order: [] };
}

export function saveShellNav(nav: ShellNav) {
    storage()?.setItem(NAV_KEY, JSON.stringify(nav));
}

export function loadShellTheme(): string {
    return storage()?.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

export function saveShellTheme(theme: string) {
    storage()?.setItem(THEME_KEY, theme === "dark" ? "dark" : "light");
}

export function loadShellScenario(): string {
    const id = storage()?.getItem(SCENARIO_KEY) ?? "";
    return SCENARIOS.some((s) => s.id === id) ? id : SCENARIOS[0]!.id;
}

export function saveShellScenario(id: string) {
    if (SCENARIOS.some((s) => s.id === id)) storage()?.setItem(SCENARIO_KEY, id);
}

// Rail = scenario set minus hidden ids, ordered by the saved order first.
export function applyNav(scenario: string, nav: ShellNav): ModuleDef[] {
    const byId = new Map(MODULES.map((m) => [m.id, m]));
    const ids = scenarioModules(scenario)
        .map((id) => byId.get(id))
        .filter((m): m is ModuleDef => Boolean(m) && !nav.hidden.includes((m as ModuleDef).id));
    // Developer access stays pinned to the rail in every scenario unless hidden by hand.
    const dev = byId.get("dev");
    if (dev && !nav.hidden.includes("dev") && !ids.some((m) => m && m.id === "dev")) ids.push(dev);
    const ordered: ModuleDef[] = [];
    for (const id of nav.order) {
        const found = ids.find((m) => m && m.id === id);
        if (found) ordered.push(found);
    }
    for (const m of ids) {
        if (m && !nav.order.includes(m.id)) ordered.push(m);
    }
    return ordered;
}
