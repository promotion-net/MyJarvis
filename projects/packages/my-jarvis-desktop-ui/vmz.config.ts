// Plain default export: `defineConfig` is not part of the published `@vmz/*` 0.3.16 surface yet.
export default {
    application: { id: "my-jarvis-desktop" },
    delivery: {
        default: "desktop",
        profiles: {
            desktop: { host: "browser", assembly: "local-static", name: "app" },
        },
    },
};
