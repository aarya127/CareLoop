import pino from 'pino';

const root = pino({ level: process.env.LOG_LEVEL ?? 'info' });

export function childLogger(name: string) {
  return root.child({ module: name });
}

export default root;
