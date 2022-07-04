export interface Migration {
  fromVersion: string
  toVersion: string
  name: string
  description: string
  function: () => void
};

export interface MigrationRegistry {
  [key: string]: Migration
};

export enum Version {
  'Preview' = 'Preview',
  '1.0.0' = '1.0.0',
}
