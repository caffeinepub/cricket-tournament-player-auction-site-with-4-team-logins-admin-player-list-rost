export interface RuntimeDebugInfo {
  url: string;
  origin: string;
  hash: string;
  pathname: string;
  search: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  userAgent: string;
  timestamp: string;
  buildInfo: {
    mode: string;
    nodeEnv: string;
  };
}

export function getRuntimeDebugInfo(): RuntimeDebugInfo {
  return {
    url: window.location.href,
    origin: window.location.origin,
    hash: window.location.hash,
    pathname: window.location.pathname,
    search: window.location.search,
    protocol: window.location.protocol,
    host: window.location.host,
    hostname: window.location.hostname,
    port: window.location.port,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    buildInfo: {
      mode: import.meta.env.MODE || 'unknown',
      nodeEnv: import.meta.env.NODE_ENV || 'unknown',
    },
  };
}

export function formatDebugInfo(info: RuntimeDebugInfo): string {
  return JSON.stringify(info, null, 2);
}

export function logDebugInfo(label: string = 'Runtime Debug Info') {
  const info = getRuntimeDebugInfo();
  console.log(`[${label}]`, info);
  return info;
}
