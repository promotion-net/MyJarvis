import { defineConfig } from "@vmz/vmz";

export default defineConfig({
    application: { id: "my-jarvis-homepage" },
    delivery: {
        default: "web",
        profiles: {
            web: { host: "browser", assembly: "web-static", name: "cdn" },
        },
    },
});
