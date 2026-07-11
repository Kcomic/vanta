// Minimal stub for next/navigation in Vitest (node env).
// Only the symbols referenced by next-intl's createNavigation need to be present.

export const useRouter = () => ({ push: () => {}, replace: () => {}, back: () => {} });
export const usePathname = () => '/';
export const useParams = () => ({});
export const useSearchParams = () => new URLSearchParams();
export const redirect = () => {};
export const permanentRedirect = () => {};
export const notFound = () => {};
export const useSelectedLayoutSegment = () => null;
export const useSelectedLayoutSegments = () => [];
export const ReadonlyURLSearchParams = URLSearchParams;
