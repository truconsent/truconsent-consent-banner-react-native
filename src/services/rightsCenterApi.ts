/**
 * Rights Center API Service
 * Handles all API calls for the Rights Center feature
 */

export interface ConsentGroup {
  collection_point: string;
  title: string;
  purposes: Purpose[];
  data_elements?: DataElement[];
  shown_to_principal?: boolean;
}

export interface Purpose {
  id: string;
  name: string;
  description: string;
  expiry_period: string;
  is_mandatory: boolean;
  consented: 'accepted' | 'declined' | 'pending';
}

export interface DataElement {
  name: string;
  description: string;
}

export interface DPOInfo {
  full_name?: string;
  email?: string;
  appointment_date?: string;
  qualifications?: string;
  responsibilities?: string;
}

export interface Nominee {
  id?: string;
  nominee_name: string;
  relationship: string;
  nominee_email: string;
  nominee_mobile: string;
  purpose_of_appointment?: string;
  user_id?: string;
}

export interface GrievanceTicket {
  id?: string;
  subject: string;
  category: string;
  description: string;
  status?: string;
  created_at?: string;
  client_user_id?: string;
}

export interface ConsentPayload {
  userId: string;
  purposes: Array<{
    id: string;
    name: string;
    consented: 'accepted' | 'declined';
  }>;
  action: 'approved' | 'revoked' | 'declined';
  changedPurposes?: string[];
}

class RightsCenterApi {
  private baseUrl: string;
  private apiKey: string;
  private organizationId: string;

  constructor(baseUrl: string, apiKey: string, organizationId: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.organizationId = organizationId;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    if (this.organizationId) {
      headers['X-Org-Id'] = this.organizationId;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure baseUrl doesn't end with / and endpoint starts with /
    const cleanBaseUrl = this.baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${cleanBaseUrl}${cleanEndpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers || {}) };

    try {
      console.log('[RightsCenterApi] Request:', url);
      console.log('[RightsCenterApi] Headers:', Object.keys(headers).join(', '));
      console.log('[RightsCenterApi] Method:', options.method || 'GET');
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('[RightsCenterApi] Response status:', response.status);
      console.log('[RightsCenterApi] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        // If it's a 404 for root endpoint, this is expected - don't log as error
        if (response.status === 404 && (endpoint === '/' || endpoint === '')) {
          console.log('[RightsCenterApi] Root endpoint (/) returned 404 (expected)');
          return [] as T;
        }
        // If it's a 404 for user endpoint, return empty array
        if (response.status === 404 && endpoint.includes('/user/')) {
          console.warn('[RightsCenterApi] 404 for user endpoint, returning empty array');
          return [] as T;
        }
        // For other errors, log and throw
        console.error('[RightsCenterApi] Error response:', errorText.substring(0, 200));
        throw new Error(
          `API Error ${response.status}: ${errorText.substring(0, 100) || response.statusText}`
        );
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        console.log('[RightsCenterApi] Response data type:', Array.isArray(data) ? `Array(${data.length})` : 'Object');
        return data as T;
      } else {
        const text = await response.text();
        console.warn('[RightsCenterApi] Non-JSON response:', text.substring(0, 100));
        // Try to parse as JSON anyway
        try {
          return JSON.parse(text) as T;
        } catch {
          throw new Error('Invalid response format: expected JSON');
        }
      }
    } catch (error: any) {
      console.error('[RightsCenterApi] Request failed:', error);
      if (error.message && error.message.includes('API Error')) {
        throw error;
      }
      throw new Error(`Network error: ${error.message || 'Failed to fetch'}`);
    }
  }

  // Consent endpoints
  async getUserConsents(userId: string): Promise<ConsentGroup[]> {
    try {
      // API requires first 6 characters of user ID (data principal ID format)
      // Web platform uses: user.id.slice(0,6)
      const dataPrincipalId = userId.length >= 6 ? userId.substring(0, 6) : userId;
      console.log('[RightsCenterApi] getUserConsents - Full userId:', userId, 'Using dataPrincipalId:', dataPrincipalId);
      const result = await this.request<ConsentGroup[]>(`/user/${encodeURIComponent(dataPrincipalId)}`);
      console.log('[RightsCenterApi] getUserConsents - Received', Array.isArray(result) ? result.length : 0, 'user consent records');
      if (Array.isArray(result) && result.length > 0) {
        console.log('[RightsCenterApi] getUserConsents - Sample record:', JSON.stringify(result[0], null, 2).substring(0, 200));
      }
      return result;
    } catch (error: any) {
      // If 404 or other error, return empty array instead of throwing
      if (error.message && error.message.includes('404')) {
        console.warn('[RightsCenterApi] getUserConsents returned 404, using empty array');
        return [];
      }
      throw error;
    }
  }

  async getAllBanners(): Promise<ConsentGroup[]> {
    try {
      // Try root endpoint first
      const result = await this.request<ConsentGroup[]>('/');
      console.log('[RightsCenterApi] getAllBanners - Received', Array.isArray(result) ? result.length : 0, 'banners');
      if (Array.isArray(result) && result.length > 0) {
        console.log('[RightsCenterApi] getAllBanners - Sample banner:', JSON.stringify(result[0], null, 2).substring(0, 200));
      }
      return result;
    } catch (error: any) {
      // If 404, fetch all collection points individually by their IDs
      if (error.message && error.message.includes('404')) {
        console.warn('[RightsCenterApi] Root endpoint (/) returned 404. Fetching all collection points individually...');
        return await this.fetchAllCollectionPointsByID();
      }
      throw error;
    }
  }

  /**
   * Fetch all collection points by their individual IDs
   * This is a fallback when the root endpoint doesn't work
   */
  private async fetchAllCollectionPointsByID(): Promise<ConsentGroup[]> {
    // Known collection point IDs (CP002-CP014 based on system configuration)
    const collectionPointIds = [
      'CP002', // Expense Tracker
      'CP003', // KYC Document Upload Form
      'CP004', // Marketing Consent Banner
      'CP006', // Account Dashboard
      'CP007', // Signup Page
      'CP008', // Credit Card Application Form
      'CP009', // Fixed Deposit Page
      'CP010', // Mutual Funds Investment Section
      'CP011', // Digital Gold Investment Interface
      'CP012', // Loan Application Page
      'CP013', // Demat Account Creation
      'CP014', // Federal Bank Account Opening Form
    ];

    console.log('[RightsCenterApi] Fetching', collectionPointIds.length, 'collection points individually...');
    
    const results = await Promise.allSettled(
      collectionPointIds.map(async (cpId) => {
        try {
          // Fetch individual collection point - returns a single ConsentGroup object
          const response = await this.request<ConsentGroup | ConsentGroup[]>(`/${encodeURIComponent(cpId)}`);
          // Handle both single object and array responses
          if (Array.isArray(response)) {
            return response.length > 0 ? response[0] : null;
          }
          return response as ConsentGroup;
        } catch (err: any) {
          // If a specific collection point doesn't exist, skip it
          console.warn(`[RightsCenterApi] Collection point ${cpId} not found, skipping`);
          return null;
        }
      })
    );

    const banners = results
      .filter((result): result is PromiseFulfilledResult<ConsentGroup> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    console.log('[RightsCenterApi] Successfully fetched', banners.length, 'collection points');
    return banners;
  }

  async saveConsent(
    collectionId: string,
    payload: ConsentPayload
  ): Promise<void> {
    await this.request(`/${encodeURIComponent(collectionId)}/consent`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // DPO endpoint
  async getDPOInfo(): Promise<DPOInfo> {
    return this.request<DPOInfo>('/dpo_information');
  }

  // Nominee endpoints
  async getNominees(userId: string): Promise<Nominee[]> {
    return this.request<Nominee[]>(
      `/user_nominees/user/${encodeURIComponent(userId)}`
    );
  }

  async createNominee(nominee: Nominee): Promise<Nominee> {
    return this.request<Nominee>('/user_nominees', {
      method: 'POST',
      body: JSON.stringify(nominee),
    });
  }

  async updateNominee(id: string, nominee: Nominee): Promise<Nominee> {
    return this.request<Nominee>(`/user_nominees/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(nominee),
    });
  }

  async deleteNominee(id: string): Promise<void> {
    await this.request(`/user_nominees/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // Grievance endpoints
  async getGrievanceTickets(userId: string): Promise<GrievanceTicket[]> {
    return this.request<GrievanceTicket[]>(
      `/grievance_tickets/user/${encodeURIComponent(userId)}`
    );
  }

  async createGrievanceTicket(
    ticket: GrievanceTicket
  ): Promise<GrievanceTicket> {
    return this.request<GrievanceTicket>('/grievance_tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  }
}

export default RightsCenterApi;

