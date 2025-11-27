/**
 * useCti Hook - HubSpot Calling Extensions SDK Integration
 */

import CallingExtensions, {
  CompanyIdMatch,
  ContactIdMatch,
  OnCallAnswered,
  OnCallCompleted,
  OnCallEnded,
  OnCallTransferred,
  OnError,
  OnIncomingCall,
  OnInitialized,
  OnMessage,
  OnNavigateToRecord,
  OnOutgoingCall,
  OnResize,
  Options,
  Constants,
  OnFinalizeEngagement,
} from '@hubspot/calling-extensions-sdk';
import { useMemo, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const { thirdPartyToHostEvents } = Constants;

interface CallingExtensionsContract {
  initialized: (userData: OnInitialized) => void;
  userAvailable: () => void;
  userUnavailable: () => void;
  userLoggedIn: () => void;
  userLoggedOut: () => void;
  incomingCall: (callDetails: OnIncomingCall) => void;
  outgoingCall: (callDetails: OnOutgoingCall) => void;
  callAnswered: (payload: OnCallAnswered) => void;
  callTransferred: (payload: OnCallTransferred) => void;
  callData: (data: unknown) => void;
  callEnded: (engagementData: OnCallEnded) => void;
  callCompleted: (callCompletedData: OnCallCompleted) => void;
  sendError: (errorData: OnError) => void;
  resizeWidget: (sizeInfo: OnResize) => void;
  sendMessage: (message: OnMessage) => void;
  logDebugMessage: (messageData: unknown) => void;
  finalizeEngagement: (data: OnFinalizeEngagement) => void;
}

class CallingExtensionsWrapper implements CallingExtensionsContract {
  private _cti: CallingExtensions;
  private _incomingNumber = '';
  private _externalCallId = '';
  private _iframeLocation = '';
  private _usesCallingWindow = true;

  portalId = 0;
  userId = 0;
  hostUrl = '';

  broadcastChannel: BroadcastChannel = new BroadcastChannel('hubspot-whatsapp-calling');

  constructor(options: Options) {
    this._cti = new CallingExtensions(options);
    window.broadcastChannel = this.broadcastChannel;
  }

  get contract() {
    return this._cti;
  }

  get externalCallId() {
    return this._externalCallId;
  }

  set externalCallId(id: string) {
    this._externalCallId = id;
  }

  get incomingNumber() {
    return this._incomingNumber;
  }

  set incomingNumber(number: string) {
    this._incomingNumber = number;
  }

  get iframeLocation() {
    return this._iframeLocation;
  }

  set iframeLocation(location: string) {
    this._iframeLocation = location;
  }

  get usesCallingWindow() {
    return this._usesCallingWindow;
  }

  set usesCallingWindow(usesCallingWindow: boolean) {
    this._usesCallingWindow = usesCallingWindow;
  }

  get isFromRemoteWithoutWindow() {
    return !this._usesCallingWindow && this._iframeLocation === 'remote';
  }

  get isFromRemote() {
    return this._usesCallingWindow && this._iframeLocation === 'remote';
  }

  get isFromWindow() {
    return this._iframeLocation === 'window';
  }

  get isFromRemoteOrWindow() {
    return this.isFromWindow || this.isFromRemote;
  }

  initialized(userData: OnInitialized) {
    if (this.isFromRemoteOrWindow) {
      this.broadcastMessage({
        type: thirdPartyToHostEvents.INITIALIZED,
        payload: userData,
      });
    }

    if (this.isFromRemote) {
      return;
    }

    if (userData.iframeLocation) {
      this._iframeLocation = userData.iframeLocation;
    }

    if (userData.usesCallingWindow !== undefined) {
      this._usesCallingWindow = userData.usesCallingWindow;
    }

    if (userData.portalId) {
      this.portalId = userData.portalId;
    }

    if (userData.hostUrl) {
      this.hostUrl = userData.hostUrl;
    }

    return this._cti.initialized(userData);
  }

  userAvailable() {
    if (this.isFromRemoteOrWindow) {
      this.broadcastMessage({ type: thirdPartyToHostEvents.USER_AVAILABLE });
    }

    if (this.isFromRemote) {
      return;
    }

    return this._cti.userAvailable();
  }

  userUnavailable() {
    if (this.isFromRemoteOrWindow) {
      this.broadcastMessage({ type: thirdPartyToHostEvents.USER_UNAVAILABLE });
    }

    if (this.isFromRemote) {
      return;
    }

    return this._cti.userUnavailable();
  }

  userLoggedIn() {
    if (this.isFromRemoteOrWindow) {
      this.broadcastMessage({ type: thirdPartyToHostEvents.LOGGED_IN });
    }

    if (this.isFromRemote) {
      return;
    }

    return this._cti.userLoggedIn();
  }

  userLoggedOut() {
    if (this.isFromRemoteOrWindow) {
      this.broadcastMessage({ type: thirdPartyToHostEvents.LOGGED_OUT });
    }

    if (this.isFromRemote) {
      return;
    }

    return this._cti.userLoggedOut();
  }

  incomingCall(callDetails: OnIncomingCall) {
    if (this.isFromRemoteOrWindow) {
      this.broadcastMessage({
        type: thirdPartyToHostEvents.INCOMING_CALL,
        payload: callDetails,
      });
    }

    if (this.isFromRemote) {
      return;
    }

    this.incomingNumber = callDetails.fromNumber;
    this.externalCallId = callDetails.externalCallId || uuidv4();

    this._cti.incomingCall({
      ...callDetails,
      externalCallId: this.externalCallId,
    });
  }

  outgoingCall(callDetails: OnOutgoingCall) {
    if (this.isFromRemoteOrWindow) {
      this.broadcastMessage({
        type: thirdPartyToHostEvents.OUTGOING_CALL_STARTED,
        payload: callDetails,
      });
    }

    if (this.isFromRemote) {
      return;
    }

    this.externalCallId = callDetails.externalCallId || uuidv4();
    return this._cti.outgoingCall({
      ...callDetails,
      externalCallId: this.externalCallId,
    });
  }

  navigateToRecord(data: OnNavigateToRecord) {
    if (this.isFromRemoteOrWindow) {
      this.broadcastMessage({
        type: thirdPartyToHostEvents.NAVIGATE_TO_RECORD,
        payload: data,
      });
    }

    if (this.isFromWindow) {
      return;
    }
    return this._cti.navigateToRecord(data);
  }

  callAnswered(data: OnCallAnswered) {
    if (this.isFromRemoteOrWindow) {
      this.broadcastMessage({
        type: thirdPartyToHostEvents.CALL_ANSWERED,
        payload: data,
      });
    }

    if (this.isFromRemote) {
      return;
    }

    return this._cti.callAnswered({
      ...data,
      externalCallId: this.externalCallId,
    });
  }

  callTransferred(data: OnCallTransferred) {
    if (this.isFromRemoteOrWindow) {
      this.broadcastMessage({
        type: thirdPartyToHostEvents.CALL_TRANSFERRED,
        payload: data,
      });
    }

    if (this.isFromRemote) {
      return;
    }
    return this._cti.callTransferred({
      ...data,
      externalCallId: this.externalCallId,
    });
  }

  callData(data: unknown) {
    return this._cti.callData(data);
  }

  callEnded(engagementData: OnCallEnded) {
    if (this.isFromRemoteOrWindow) {
      this.broadcastMessage({
        type: thirdPartyToHostEvents.CALL_ENDED,
        payload: engagementData,
      });
    }

    if (this.isFromRemote) {
      return;
    }

    return this._cti.callEnded({
      ...engagementData,
      externalCallId: this.externalCallId,
    });
  }

  callCompleted(callCompletedData: OnCallCompleted) {
    if (this.isFromRemoteOrWindow) {
      this.broadcastMessage({
        type: thirdPartyToHostEvents.CALL_COMPLETED,
        payload: callCompletedData,
      });
    }

    if (this.isFromRemote) {
      return;
    }

    this._cti.callCompleted({
      ...callCompletedData,
      externalCallId: this.externalCallId,
    });
  }

  finalizeEngagement(data: OnFinalizeEngagement) {
    return this._cti.finalizeEngagement({
      ...data,
      externalCallId: this.externalCallId,
    });
  }

  sendError(errorData: OnError) {
    return this._cti.sendError(errorData);
  }

  resizeWidget(sizeInfo: OnResize) {
    return this._cti.resizeWidget(sizeInfo);
  }

  sendMessage(message: OnMessage) {
    return this._cti.sendMessage(message);
  }

  logDebugMessage(messageData: any) {
    return this._cti.logDebugMessage(messageData);
  }

  broadcastMessage({ type, payload }: { type: string; payload?: any }) {
    this.broadcastChannel.postMessage({
      type,
      payload,
    });
  }
}

interface UseCtiReturn {
  cti: CallingExtensionsWrapper;
  engagementId: number | null;
  incomingContactName: string;
  portalId: number;
  userId: number;
  ownerId: string;
  isReady: boolean;
  setEngagementId: (id: number | null) => void;
}

export const useCti = (
  setDialNumber: (phoneNumber: string) => void,
  onIncomingCall?: (fromNumber: string, contactName: string) => void
): UseCtiReturn => {
  const [engagementId, setEngagementId] = useState<number | null>(null);
  const [incomingContactName, setIncomingContactName] = useState<string>('');
  const [portalId, setPortalId] = useState<number>(0);
  const [userId, setUserId] = useState<number>(0);
  const [ownerId, setOwnerId] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);

  const cti = useMemo(() => {
    return new CallingExtensionsWrapper({
      debugMode: true,
      eventHandlers: {
        onReady: (data: OnInitialized) => {
          console.log('HubSpot SDK Ready:', data);
          const engagementId = (data && data.engagementId) || 0;

          if (data.portalId) {
            setPortalId(data.portalId);
          }

          // Extract user/owner ID from various sources
          const extractedUserId = (data as any).userId || 0;
          if (extractedUserId) {
            setUserId(extractedUserId);
            setOwnerId(String(extractedUserId));
          }

          cti.initialized({
            isLoggedIn: false,
            isAvailable: false,
            engagementId,
            sizeInfo: {
              width: 400,
              height: 650,
            },
            iframeLocation: data.iframeLocation,
            usesCallingWindow: data.usesCallingWindow,
            portalId: data.portalId,
            hostUrl: data.hostUrl,
          } as OnInitialized);

          setIsReady(true);
        },

        onDialNumber: (data: any, _rawEvent: any) => {
          console.log('Dial number requested:', data);
          const { phoneNumber } = data;
          if (phoneNumber) {
            setDialNumber(phoneNumber);
          }
        },

        onEngagementCreated: (data: any, _rawEvent: any) => {
          console.log('Engagement created:', data);
          const { engagementId } = data;
          setEngagementId(engagementId);
        },

        onVisibilityChanged: (data: any, _rawEvent: any) => {
          console.log('Visibility changed:', data);
        },

        onCreateEngagementSucceeded: (data: any, _rawEvent: any) => {
          console.log('Create engagement succeeded:', data);
          const { engagementId } = data;
          setEngagementId(engagementId);
        },

        onCreateEngagementFailed: (data: any, _rawEvent: any) => {
          console.error('Create engagement failed:', data);
        },

        onUpdateEngagementSucceeded: (data: any, _rawEvent: any) => {
          console.log('Update engagement succeeded:', data);
          const { engagementId } = data;
          setEngagementId(engagementId);
        },

        onUpdateEngagementFailed: (data: any, _rawEvent: any) => {
          console.error('Update engagement failed:', data);
        },

        onCallerIdMatchSucceeded: (data: {
          callerIdMatches: (ContactIdMatch | CompanyIdMatch)[];
        }) => {
          console.log('Caller ID match succeeded:', data);
          const { callerIdMatches } = data;
          if (callerIdMatches.length) {
            const firstCallerIdMatch = callerIdMatches[0];
            let name = '';
            if (firstCallerIdMatch.callerIdType === 'CONTACT') {
              name = `${firstCallerIdMatch.firstName} ${firstCallerIdMatch.lastName}`;
            } else if (firstCallerIdMatch.callerIdType === 'COMPANY') {
              name = firstCallerIdMatch.name;
            }
            setIncomingContactName(name);

            cti.logDebugMessage({
              message: `Incoming call from ${name} ${cti.incomingNumber}`,
              type: `${callerIdMatches.length} Caller ID Matches`,
            });

            // Navigate to the contact/company record
            cti.navigateToRecord({
              objectCoordinates: firstCallerIdMatch.objectCoordinates,
              openIn: 'CURRENT_TAB',
            });
          }
        },

        onCallerIdMatchFailed: (data: any, _rawEvent: any) => {
          console.log('Caller ID match failed:', data);
          cti.logDebugMessage({
            message: `Incoming call from ${cti.incomingNumber}`,
            type: 'Caller ID Match Failed',
          });
        },

        onNavigateToRecordFailed: (data: any, _rawEvent: any) => {
          console.error('Navigate to record failed:', data);
        },

        onFinalizeEngagementFailed: (data: any, _rawEvent: any) => {
          console.error('Finalize engagement failed:', data);
        },

        onFinalizeEngagementSucceeded: (data: any, _rawEvent: any) => {
          console.log('Finalize engagement succeeded:', data);
        },

        onSetCallState: (data: any, _rawEvent: any) => {
          console.log('Set call state:', data);
        },

        onEndCall: (data: any, _rawEvent: any) => {
          console.log('End call:', data);
        },

        onInitiateCallIdSucceeded: (data: any, _rawEvent: any) => {
          console.log('Initiate call ID succeeded:', data);
        },

        onInitiateCallIdFailed: (data: any, _rawEvent: any) => {
          console.error('Initiate call ID failed:', data);
        },

        onSetWidgetUrlFailed: (data: any, _rawEvent: any) => {
          console.error('Set widget URL failed:', data);
        },

        onFailed: (data: any, _rawEvent: any) => {
          console.error('HubSpot SDK failed event:', data);
        },
      },
    });
  }, [setDialNumber]);

  return {
    engagementId,
    cti,
    incomingContactName,
    portalId,
    userId,
    ownerId,
    isReady,
    setEngagementId,
  };
};
