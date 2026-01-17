'use client';

import { Amplify } from 'aws-amplify';

export default function DebugConfigPage() {
  const config = Amplify.getConfig();
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Amplify Configuration Debug</h1>
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Current Amplify Config:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </div>
  );
}