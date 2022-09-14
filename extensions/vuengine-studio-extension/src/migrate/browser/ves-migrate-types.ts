import { VesAbstractMigration } from './migrations/ves-abstract-migration';

export interface MigrationRegistry {
  [key: string]: VesAbstractMigration
};

export enum Version {
  'Preview' = 'Preview',
  '1.0.0' = '1.0.0',
}
