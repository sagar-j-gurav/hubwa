/**
 * API Service - Backend Communication for HubSpot WhatsApp Calling
 */

import axios, { AxiosInstance } from 'axios';
import {
  ApiResponse,
  CallPermission,
  PermissionCheckResult,
  PermissionRequestResponse,
  PermissionStatusResponse,
} from '../types';

class ApiService {
  private client: AxiosInstance;
  private backendUrl: string;
  private fromNumber: string;

  constructor() {
    this.backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    this.fromNumber = process.env.REACT_APP_TWILIO_WHATSAPP_NUMBER || '+447366331247';

    this.client = axios.create({
      baseURL: this.backendUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        throw error;
      }
    );
  }

  // ============================================================================
  // Permission Management
  // ============================================================================

  /**
   * Request call permission for a contact (Meta compliance)
   */
  async requestPermission(
    phoneNumber: string,
    hubspotContactId: string
  ): Promise<PermissionRequestResponse> {
    try {
      const response = await this.client.post<ApiResponse<PermissionRequestResponse>>(
        '/wacall/api/permissions/request',
        { phoneNumber, hubspotContactId }
      );

      if (response.data.data) {
        return response.data.data;
      }

      return {
        status: 'unknown',
        error: 'Invalid response format',
      };
    } catch (error: any) {
      if (error.response?.status === 429) {
        return {
          status: error.response.data.data?.status || 'rate_limited',
          error: error.response.data.error || 'Rate limit exceeded. Please try again later.',
          permission: error.response.data.data?.permission,
        };
      }
      throw error;
    }
  }

  /**
   * Check permission status for a phone number
   */
  async checkPermissionStatus(phoneNumber: string): Promise<PermissionStatusResponse> {
    try {
      const encodedNumber = encodeURIComponent(phoneNumber);
      const response = await this.client.get<ApiResponse<PermissionStatusResponse>>(
        `/wacall/api/permissions/status/${encodedNumber}`
      );

      return response.data.data || {
        status: 'error',
        permission: {} as CallPermission,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          status: 'not_found',
          permission: {} as CallPermission,
        };
      }
      throw error;
    }
  }

  /**
   * Validate permission before making a call
   */
  async validatePermission(phoneNumber: string): Promise<PermissionCheckResult> {
    try {
      const response = await this.client.post<ApiResponse<PermissionCheckResult>>(
        '/wacall/api/permissions/validate',
        { phoneNumber }
      );

      return response.data.data || { canCall: false, reason: 'Unknown error' };
    } catch (error) {
      return {
        canCall: false,
        reason: 'Failed to validate permission. Please try again.',
      };
    }
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  /**
   * Get Twilio access token for WebRTC
   */
  async getAccessToken(identity: string): Promise<{ token: string; identity: string }> {
    try {
      const response = await this.client.get<ApiResponse<{ token: string; identity: string }>>(
        '/wacall/api/token',
        { params: { identity } }
      );

      if (response.data.data) {
        return response.data.data;
      }
      throw new Error('Invalid token response');
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw error;
    }
  }

  // ============================================================================
  // Call Management
  // ============================================================================

  /**
   * Initiate outbound call
   */
  async initiateCall(data: {
    phoneNumber: string;
    contactId: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.client.post<ApiResponse>(
        '/wacall/api/calls/initiate',
        {
          phoneNumber: data.phoneNumber,
          hubspotContactId: data.contactId,
        }
      );

      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Failed to initiate call:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to initiate call',
      };
    }
  }

  /**
   * Get call status
   */
  async getCallStatus(callSid: string): Promise<{
    status: string;
    duration?: number;
    recordingUrl?: string;
  }> {
    try {
      const response = await this.client.get<ApiResponse>(
        `/wacall/api/calls/status/${callSid}`
      );

      return response.data.data || { status: 'unknown' };
    } catch (error) {
      console.error('Failed to get call status:', error);
      return { status: 'unknown' };
    }
  }

  /**
   * Answer incoming call
   */
  async answerCall(callSid: string): Promise<void> {
    try {
      await this.client.post('/wacall/api/calls/answer', { callSid });
    } catch (error) {
      console.error('Failed to answer call:', error);
    }
  }

  /**
   * Decline incoming call
   */
  async declineCall(callSid: string): Promise<void> {
    try {
      await this.client.post('/wacall/api/calls/decline', { callSid });
    } catch (error) {
      console.error('Failed to decline call:', error);
    }
  }

  /**
   * End active call
   */
  async endCall(callSid: string, status?: string): Promise<void> {
    try {
      await this.client.post('/wacall/api/calls/end', { callSid, status });
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  }

  // ============================================================================
  // Contact Management
  // ============================================================================

  /**
   * Get contact by phone number
   */
  async getContact(phoneNumber: string): Promise<any> {
    try {
      const encodedNumber = encodeURIComponent(phoneNumber);
      const response = await this.client.get<ApiResponse>(
        `/wacall/api/contacts/${encodedNumber}`
      );

      return response.data.data;
    } catch (error) {
      console.error('Failed to get contact:', error);
      return null;
    }
  }

  // ============================================================================
  // Recording Management (for transcriptions)
  // ============================================================================

  /**
   * Signal recording is ready for transcription
   */
  async signalRecordingReady(engagementId: number): Promise<void> {
    try {
      await this.client.post('/wacall/api/recordings/ready', { engagementId });
    } catch (error) {
      console.error('Failed to signal recording ready:', error);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.post('/wacall/api/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  getBackendUrl(): string {
    return this.backendUrl;
  }

  getFromNumber(): string {
    return this.fromNumber;
  }
}

export default new ApiService();
