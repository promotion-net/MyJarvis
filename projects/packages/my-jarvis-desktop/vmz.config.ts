import { defineConfig } from "@vmz/plugin";

export default defineConfig({
    application: { id: "my-jarvis-desktop" },
    delivery: {
        default: "desktop",
        profiles: {
            desktop: { host: "browser", assembly: "local-static", name: "app" },
        },
    },
});
