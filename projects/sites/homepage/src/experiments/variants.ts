// A/B experiment layer: variant ids, traffic split, exposure buckets and conversion events live here.
// The skeleton ships a single default variant; wiring page copy through this resolver is the content phase.

export type VariantId = "default";

export function resolveVariant(_route: string, _seed: string | null): VariantId {
    return "default";
}
