import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { fromEnv } from "@aws-sdk/credential-providers";

// Validate AWS credentials are available
const hasValidCredentials = () => {
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  return accessKey && accessKey.length > 5 && secretKey && secretKey.length > 5;
};

// Debug function to check credential status
const debugCredentials = () => {
  // Only in development, provide some diagnostic info
  if (process.env.NODE_ENV !== 'production') {
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
    console.log(`AWS Credentials Check:
    - AWS_ACCESS_KEY_ID ${accessKey ? 'exists' : 'missing'} ${accessKey ? `(starts with ${accessKey.substring(0, 4)}...)` : ''}
    - AWS_SECRET_ACCESS_KEY ${secretKey ? 'exists' : 'missing'} ${secretKey ? '(proper length: ' + (secretKey.length > 15) + ')' : ''}
    - AWS_REGION: ${process.env.AWS_REGION || 'not set (using default)'}`);
  }
};

// Run diagnostic on module load
debugCredentials();

// Create AWS client config
const clientConfig = {
  region: process.env.AWS_REGION || 'us-east-1'
};

// Add credentials if available
if (hasValidCredentials()) {
  clientConfig.credentials = fromEnv();
}

// Export a function to create Bedrock clients (instead of a singleton)
// This allows for better error handling and proper credential refresh
export function getBedrockRuntime() {
  if (!hasValidCredentials()) {
    throw new Error('AWS credentials are not properly configured');
  }
  
  return new BedrockRuntimeClient(clientConfig);
}

// Helper function to check if AWS services are available/configured
export function isAwsConfigured() {
  return hasValidCredentials();
}
