
export * from './packages/types/index';

export interface EnvVarGroup {
  provider: string;
  vars: {
    key: string;
    description: string;
    required: boolean;
  }[];
}
