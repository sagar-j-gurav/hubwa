/**
 * WebRTC Service - Twilio Voice SDK for WhatsApp Calling
 */

import { Device, Call } from '@twilio/voice-sdk';
import apiService from './api.service';

type CallStatusCallback = (status: string, call?: Call) => void;
type IncomingCallCallback = (call: Call) => void;

class WebRTCService {
  private device: Device | null = null;
  private currentCall: Call | null = null;
  private identity: string | null = null;
  private callStatusCallbacks: Set<CallStatusCallback> = new Set();
  private incomingCallCallbacks: Set<IncomingCallCallback> = new Set();
  private isInitializing: boolean = false;

  /**
   * Initialize Twilio Device with access token
   */
  async initialize(identity: string): Promise<void> {
    if (this.isInitializing) {
      console.log('WebRTC already initializing');
      return;
    }

    if (this.device && this.identity === identity) {
      console.log('WebRTC already initialized with same identity');
      return;
    }

    this.isInitializing = true;
    this.identity = identity;

    try {
      // Get access token from backend
      const { token } = await apiService.getAccessToken(identity);

      // Destroy existing device if any
      if (this.device) {
        this.device.destroy();
      }

      // Create new Twilio Device
      this.device = new Device(token, {
        codecPreferences: [Call.Codec.PCMU, Call.Codec.Opus],
        allowIncomingWhileBusy: false,
        closeProtection: true,
        logLevel: 1,
      });

      this.setupDeviceListeners();

      // Register the device
      await this.device.register();
      console.log('Twilio Device registered successfully');
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Setup device event listeners
   */
  private setupDeviceListeners(): void {
    if (!this.device) return;

    this.device.on('registered', () => {
      console.log('Twilio Device registered');
      this.notifyCallStatus('registered');
    });

    this.device.on('unregistered', () => {
      console.log('Twilio Device unregistered');
      this.notifyCallStatus('unregistered');
    });

    this.device.on('error', (error) => {
      console.error('Twilio Device error:', error);
      this.notifyCallStatus('error');
    });

    // Handle incoming calls
    this.device.on('incoming', (call: Call) => {
      console.log('Incoming call received:', call.parameters);
      this.currentCall = call;
      this.setupCallListeners(call);
      this.incomingCallCallbacks.forEach((cb) => cb(call));
    });

    this.device.on('tokenWillExpire', async () => {
      console.log('Token will expire, refreshing...');
      if (this.identity) {
        try {
          const { token } = await apiService.getAccessToken(this.identity);
          this.device?.updateToken(token);
        } catch (error) {
          console.error('Failed to refresh token:', error);
        }
      }
    });
  }

  /**
   * Setup call event listeners
   */
  private setupCallListeners(call: Call): void {
    call.on('accept', () => {
      console.log('Call accepted');
      this.notifyCallStatus('accepted', call);
    });

    call.on('disconnect', () => {
      console.log('Call disconnected');
      this.notifyCallStatus('disconnected', call);
      this.currentCall = null;
    });

    call.on('cancel', () => {
      console.log('Call canceled');
      this.notifyCallStatus('canceled', call);
      this.currentCall = null;
    });

    call.on('reject', () => {
      console.log('Call rejected');
      this.notifyCallStatus('rejected', call);
      this.currentCall = null;
    });

    call.on('error', (error) => {
      console.error('Call error:', error);
      this.notifyCallStatus('error', call);
    });

    call.on('ringing', () => {
      console.log('Call ringing');
      this.notifyCallStatus('ringing', call);
    });

    call.on('reconnecting', (error) => {
      console.log('Call reconnecting:', error);
      this.notifyCallStatus('reconnecting', call);
    });

    call.on('reconnected', () => {
      console.log('Call reconnected');
      this.notifyCallStatus('reconnected', call);
    });
  }

  /**
   * Make outbound call to WhatsApp number
   */
  async makeCall(phoneNumber: string): Promise<Call | null> {
    if (!this.device) {
      console.error('Device not initialized');
      return null;
    }

    try {
      // Clean phone number format
      const cleanNumber = phoneNumber.replace(/\s/g, '');

      console.log('Making call to:', cleanNumber);

      const call = await this.device.connect({
        params: {
          To: cleanNumber,
          phoneNumber: cleanNumber,
        },
      });

      this.currentCall = call;
      this.setupCallListeners(call);

      return call;
    } catch (error) {
      console.error('Failed to make call:', error);
      throw error;
    }
  }

  /**
   * Accept incoming call
   */
  acceptCall(): void {
    if (this.currentCall) {
      this.currentCall.accept();
      console.log('Accepted incoming call');
    } else {
      console.warn('No incoming call to accept');
    }
  }

  /**
   * Reject incoming call
   */
  rejectCall(): void {
    if (this.currentCall) {
      this.currentCall.reject();
      console.log('Rejected incoming call');
      this.currentCall = null;
    } else {
      console.warn('No incoming call to reject');
    }
  }

  /**
   * End current call
   */
  endCall(): void {
    if (this.currentCall) {
      this.currentCall.disconnect();
      console.log('Ended call');
      this.currentCall = null;
    } else {
      console.warn('No active call to end');
    }
  }

  /**
   * Mute/unmute call
   */
  setMute(muted: boolean): void {
    if (this.currentCall) {
      this.currentCall.mute(muted);
      console.log(`Call ${muted ? 'muted' : 'unmuted'}`);
    }
  }

  /**
   * Check if call is muted
   */
  isMuted(): boolean {
    return this.currentCall?.isMuted() || false;
  }

  /**
   * Send DTMF digits
   */
  sendDigits(digits: string): void {
    if (this.currentCall) {
      this.currentCall.sendDigits(digits);
      console.log(`Sent DTMF: ${digits}`);
    }
  }

  /**
   * Get current call
   */
  getCurrentCall(): Call | null {
    return this.currentCall;
  }

  /**
   * Get call SID
   */
  getCallSid(): string | null {
    return this.currentCall?.parameters?.CallSid || null;
  }

  /**
   * Check if device is registered
   */
  isRegistered(): boolean {
    return this.device?.state === Device.State.Registered;
  }

  /**
   * Register call status callback
   */
  onCallStatus(callback: CallStatusCallback): () => void {
    this.callStatusCallbacks.add(callback);
    return () => {
      this.callStatusCallbacks.delete(callback);
    };
  }

  /**
   * Register incoming call callback
   */
  onIncomingCall(callback: IncomingCallCallback): () => void {
    this.incomingCallCallbacks.add(callback);
    return () => {
      this.incomingCallCallbacks.delete(callback);
    };
  }

  /**
   * Notify all call status callbacks
   */
  private notifyCallStatus(status: string, call?: Call): void {
    this.callStatusCallbacks.forEach((cb) => cb(status, call));
  }

  /**
   * Destroy device and cleanup
   */
  destroy(): void {
    if (this.currentCall) {
      this.currentCall.disconnect();
      this.currentCall = null;
    }
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
    this.identity = null;
    this.callStatusCallbacks.clear();
    this.incomingCallCallbacks.clear();
    console.log('WebRTC service destroyed');
  }
}

export default new WebRTCService();
