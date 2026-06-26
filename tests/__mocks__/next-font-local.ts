const localFont = (opts: { variable?: string; [key: string]: unknown }) => ({
  className: 'mock-font',
  variable: opts['variable'] ?? '',
  style: { fontFamily: 'mock' },
});

export default localFont;
