import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import type { Schema } from '@/amplify/data/resource';
import amplifyconfig from '../../amplify_outputs.json';

// Ensure Amplify is configured before creating the client
if (!Amplify.getConfig().Auth) {
  Amplify.configure(amplifyconfig);
}

// Create the Amplify GraphQL client
export const client = generateClient<Schema>();

// Export types for convenience
export type { Schema };