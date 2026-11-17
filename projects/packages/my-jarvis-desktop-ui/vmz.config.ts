import { defineConfig } from "@vmz/vmz";

export default defineConfig({
    application: { id: "my-jarvis-desktop" },
    delivery: {
        default: "desktop",
        profiles: {
            desktop: { host: "browser", assembly: "local-static", name: "app" },
        },
    },
});
