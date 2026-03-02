export interface HealthStatus {
  online: boolean;
  status?: string;
  services?: Record<string, { status: string; version?: string }>;
  error?: string;
}

export async function checkBackendHealth(): Promise<HealthStatus> {
  const gatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL;
  if (!gatewayUrl) {
    return { online: false, error: 'API Gateway URL is not configured' };
  }
  try {
    const response = await fetch(`${gatewayUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    if (!response.ok) {
      return { online: false, error: `Health check returned ${response.status}` };
    }
    const data = await response.json();
    return {
      online: data.status === 'ok' || data.status === 'degraded',
      status: data.status,
      services: data.services,
    };
  } catch (err) {
    return { online: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
