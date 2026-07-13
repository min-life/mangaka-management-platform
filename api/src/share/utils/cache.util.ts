import * as crypto from 'crypto';

export function hashQuery(query: any): string {
  if (!query) return 'empty';
  const str = JSON.stringify(query);
  return crypto.createHash('md5').update(str).digest('hex').substring(0, 8);
}
