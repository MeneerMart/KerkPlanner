/** Haalt de foutmelding van de API op (de backend stuurt meldingen als platte tekst). */
export function errorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    if (typeof response?.data === 'string') return response.data;
  }
  return fallback;
}
