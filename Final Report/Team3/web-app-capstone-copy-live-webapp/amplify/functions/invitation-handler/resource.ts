import { defineFunction } from '@aws-amplify/backend';

export const invitationHandler = defineFunction({
  name: 'invitation-handler',
  entry: './handler.ts',
  environment: {
    SES_REGION: 'us-east-1',
    FROM_EMAIL: 'noreply@healthcare-app.com',
    FRONTEND_URL: 'https://localhost:3000', // Will be updated for production
  },
  runtime: 20,
  timeoutSeconds: 30,
});