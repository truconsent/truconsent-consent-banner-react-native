/**
 * Type definitions for TruConsent React Native SDK
 */

export interface Banner {
  banner_id: string;
  collection_point: string;
  version?: string;
  title: string;
  name?: string; // Alternative field name from API
  expiry_type?: string;
  asset?: Asset;
  purposes: Purpose[];
  data_elements?: DataElement[];
  legal_entities?: LegalEntity[];
  tools?: Tool[];
  processing_activities?: ProcessingActivity[];
  consent_type?: 'standard_consent' | 'cookie_consent' | 'general';
  cookie_config?: CookieConfig;
  banner_settings?: BannerSettings;
  organization?: Organization;
  organization_name?: string;
  cookie_data_elements?: DataElement[];
  show_purposes?: boolean;
}

export interface Purpose {
  id: string;
  name: string;
  description: string;
  is_mandatory: boolean;
  consented: 'accepted' | 'declined' | 'pending';
  expiry_period: string;
  expiry_label?: string;
  data_elements?: DataElement[];
  processing_activities?: ProcessingActivity[];
  legal_entities?: LegalEntity[];
  tools?: Tool[];
}

export interface DataElement {
  id: string;
  name: string;
  description?: string;
  display_id?: string;
}

export interface LegalEntity {
  id: string;
  name: string;
  description?: string;
  display_id?: string;
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  display_id?: string;
}

export interface ProcessingActivity {
  id: string;
  name: string;
  description?: string;
  display_id?: string;
}

export interface Asset {
  id: string;
  name: string;
  description?: string;
  asset_type?: string;
}

export interface CookieConfig {
  cookies?: Cookie[];
  selected_data_element_ids?: string[];
  selected_processing_activity_ids?: string[];
}

export interface Cookie {
  id?: string;
  name?: string;
  category?: string;
  domain?: string;
  expiry?: string;
}

export interface BannerSettings {
  font_type?: string;
  font_size?: string;
  primary_color?: string;
  secondary_color?: string;
  action_button_text?: string;
  warning_text?: string;
  logo_url?: string;
  banner_title?: string;
  disclaimer_text?: string;
  footer_text?: string;
  show_purposes?: boolean;
}

export interface Organization {
  name: string;
  legal_name?: string;
  trade_name?: string;
  logo_url?: string;
}

export type ConsentAction = 'approved' | 'declined' | 'no_action' | 'revoked' | 'partial_consent';

export interface ConsentRequest {
  userId: string;
  purposes: Purpose[];
  action: ConsentAction;
  requestId?: string;
}

export interface TruConsentConfig {
  apiKey: string;
  organizationId: string;
  bannerId: string;
  userId: string;
  apiBaseUrl?: string;
  logoUrl?: string;
  companyName?: string;
  onClose?: (action: ConsentAction) => void;
}

