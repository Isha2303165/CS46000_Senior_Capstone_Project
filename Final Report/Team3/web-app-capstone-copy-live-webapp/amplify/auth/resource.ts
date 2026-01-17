import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    givenName: {
      required: true,
    },
    familyName: {
      required: true,
    },
    phoneNumber: {
      required: false,
    },
    // picture attribute is not supported in current Amplify v2
    // Use custom attributes instead
    'custom:role': {
      dataType: 'String',
      mutable: true,
    },
    'custom:notif_prefs': {
      dataType: 'String',
      mutable: true,
    },
    'custom:privacy_settings': {
      dataType: 'String',
      mutable: true,
    },
    'custom:security_settings': {
      dataType: 'String',
      mutable: true,
    },
  },
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
    sms: true,
  },
});
