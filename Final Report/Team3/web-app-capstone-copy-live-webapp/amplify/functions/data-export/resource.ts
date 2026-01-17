import { defineFunction } from '@aws-amplify/backend';

export const dataExportHandler = defineFunction({
  entry: './handler.ts',
  environment: {
    STORAGE_BUCKET_NAME: 'healthcare-app-exports',
  },
  timeoutSeconds: 300, // 5 minutes for large exports
});