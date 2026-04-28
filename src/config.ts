function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export const DEFAULT_SECTOR_NAME = getRequiredEnv('DEFAULT_SECTOR_NAME');
export const DEFAULT_CITY = getRequiredEnv('DEFAULT_CITY');
export const DEFAULT_PROPERTY_TYPE = getRequiredEnv('DEFAULT_PROPERTY_TYPE') as 'flat' | 'plot';

