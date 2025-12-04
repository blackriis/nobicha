
// Mock for Supabase WebAuthnApi
export class WebAuthnApi {
  constructor(client) {
    this.client = client;
  }
  
  async signIn() { throw new Error('WebAuthn not supported in this environment'); }
  async signUp() { throw new Error('WebAuthn not supported in this environment'); }
  async list() { return { data: [], error: null }; }
  async create() { throw new Error('WebAuthn not supported in this environment'); }
  async delete() { throw new Error('WebAuthn not supported in this environment'); }
  async update() { throw new Error('WebAuthn not supported in this environment'); }
  async verify() { throw new Error('WebAuthn not supported in this environment'); }
}

// Mock functions for WebAuthn serialization/deserialization
// These are required by @supabase/auth-js GoTrueClient but not used in our app
export function serializeCredentialRequestResponse(response) {
  // Mock implementation - returns empty object since WebAuthn is not used
  return {};
}

export function deserializeCredentialRequestOptions(options) {
  // Mock implementation - returns empty object since WebAuthn is not used
  return {};
}

export function deserializeCredentialCreationOptions(options) {
  // Mock implementation - returns empty object since WebAuthn is not used
  return {};
}

export function serializeCredentialCreationResponse(response) {
  // Mock implementation - returns empty object since WebAuthn is not used
  return {};
}

// Mock for other modules if needed
export const ethereum = {};
export const vectors = {};

