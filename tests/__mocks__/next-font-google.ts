const factory = (opts: { variable?: string; [key: string]: unknown }) => ({
  className: 'mock-font',
  variable: opts['variable'] ?? '',
  style: { fontFamily: 'mock' },
});

export const Kanit = factory;
export const IBM_Plex_Sans_Thai = factory;
export const Archivo = factory;
