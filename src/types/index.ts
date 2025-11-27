// Screen Types
export enum ScreenNames {
  Loading = 0,
  Login = 1,
  Keypad = 2,
  PermissionRequest = 3,
  PermissionPending = 4,
  PermissionDenied = 5,
  Dialing = 6,
  Incoming = 7,
  Calling = 8,
  CallEnded = 9,
}

export type Direction = 'INBOUND' | 'OUTBOUND';
export type Availability = 'AVAILABLE' | 'UNAVAILABLE';
export type CallStatus =
  | 'connecting'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no-answer'
  | 'canceled';

// Permission Types
export type PermissionStatus =
  | 'granted'
  | 'pending'
  | 'denied'
  | 'revoked'
  | 'expired'
  | 'not_found'
  | 'rate_limited';

export interface CallPermission {
  id?: string;
  phone_number: string;
  hubspot_contact_id: string;
  permission_status: PermissionStatus;
  permission_requested_at?: string;
  permission_granted_at?: string;
  permission_expires_at?: string;
  missed_call_count: number;
  last_call_attempt?: string;
  last_successful_call?: string;
}

export interface PermissionCheckResult {
  canCall: boolean;
  reason?: string;
  permission?: CallPermission;
}

export interface PermissionRequestResponse {
  status: string;
  error?: string;
  permission?: CallPermission;
  messageSid?: string;
}

export interface PermissionStatusResponse {
  status: string;
  permission?: CallPermission;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Incoming Call Types
export interface IncomingCallData {
  type: 'incoming_call';
  callSid: string;
  fromNumber: string;
  contactId?: string;
  contactName?: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  engagementId?: number;
}

// HubSpot Types
export interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    phone?: string;
    mobilephone?: string;
    email?: string;
    hubspot_owner_id?: string;
  };
}

export interface HubSpotOwner {
  id: string;
  userId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// Call Engagement Properties
export interface CallEngagementProperties {
  hs_timestamp: number;
  hs_call_body?: string;
  hs_call_callee_object_id?: string;
  hs_call_callee_object_type?: string;
  hs_call_direction?: 'INBOUND' | 'OUTBOUND';
  hs_call_disposition?: string;
  hs_call_duration?: string;
  hs_call_from_number?: string;
  hs_call_recording_url?: string;
  hs_call_status?: string;
  hs_call_title?: string;
  hs_call_source?: string;
  hs_call_to_number?: string;
  hubspot_owner_id?: string;
}

// Component Props
export interface ScreenProps {
  handleNextScreen: () => void;
  handlePreviousScreen: () => void;
  handleNavigateToScreen: (screen: ScreenNames) => void;
  dialNumber: string;
  setDialNumber: (num: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  isCallRecorded: boolean;
  setIsCallRecorded: (recorded: boolean) => void;
  callDuration: number;
  callDurationString: string;
  startTimer: (startTime: number) => void;
  stopTimer: () => void;
  fromNumber: string;
  setFromNumber: (num: string) => void;
  incomingNumber: string;
  setIncomingNumber: (num: string) => void;
  availability: Availability;
  setAvailability: (avail: Availability) => void;
  direction: Direction;
  setDirection: (dir: Direction) => void;
  callStatus: CallStatus | null;
  setCallStatus: (status: CallStatus | null) => void;
  engagementId: number | null;
  contactId: string | null;
  contactName: string;
  incomingContactName: string;
  currentCallSid: string | null;
  setCurrentCallSid: (sid: string | null) => void;
  handleOutgoingCallStarted: () => void;
  handleIncomingCall: (data: IncomingCallData) => void;
  handleCallAnswered: () => void;
  handleCallEnded: (status?: string) => void;
  handleCallCompleted: () => void;
  // Permission props
  permissionStatus: PermissionStatus | null;
  isCheckingPermission: boolean;
  isRequestingPermission: boolean;
  checkPermission: (phoneNumber: string) => Promise<void>;
  requestPermission: (phoneNumber: string, contactId: string) => Promise<void>;
  canMakeCall: boolean;
  permissionError: string | null;
  // HubSpot CTI
  cti: any;
  portalId: number;
  userId: number;
  ownerId: string;
}

// Window type extension for BroadcastChannel
declare global {
  interface Window {
    broadcastChannel?: BroadcastChannel;
  }
}
