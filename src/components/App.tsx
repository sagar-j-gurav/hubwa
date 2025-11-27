/**
 * Main Application Component
 * HubSpot WhatsApp Calling Widget
 *
 * Supports two modes:
 * 1. Standalone Mode (DEV_MODE=true) - For local testing without HubSpot
 * 2. HubSpot Mode - When loaded inside HubSpot iframe
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Constants } from '@hubspot/calling-extensions-sdk';

// Hooks
import { useCti } from '../hooks/useCti';
import { usePermission } from '../hooks/usePermission';
import { useCallTimer } from '../hooks/useCallTimer';

// Services
import apiService from '../services/api.service';
import websocketService from '../services/websocket.service';
import webrtcService from '../services/webrtc.service';

// Screens
import LoadingScreen from './screens/LoadingScreen';
import LoginScreen from './screens/LoginScreen';
import KeypadScreen from './screens/KeypadScreen';
import PermissionRequestScreen from './screens/PermissionRequestScreen';
import PermissionPendingScreen from './screens/PermissionPendingScreen';
import PermissionDeniedScreen from './screens/PermissionDeniedScreen';
import DialingScreen from './screens/DialingScreen';
import IncomingScreen from './screens/IncomingScreen';
import CallingScreen from './screens/CallingScreen';
import CallEndedScreen from './screens/CallEndedScreen';

// Types
import {
  ScreenNames,
  Direction,
  Availability,
  CallStatus,
  IncomingCallData,
  PermissionStatus,
} from '../types';
import { cleanPhoneNumber } from '../utils/formatters';

const { thirdPartyToHostEvents } = Constants;

// Dev mode controlled by environment variable
// Set REACT_APP_DEV_MODE=true to enable standalone testing
const DEV_MODE = process.env.REACT_APP_DEV_MODE === 'true';

const App: React.FC = () => {
  // Screen state - Start at Keypad in standalone mode, Loading in HubSpot mode
  const [currentScreen, setCurrentScreen] = useState<ScreenNames>(
    DEV_MODE ? ScreenNames.Keypad : ScreenNames.Loading
  );

  // Call state
  const [dialNumber, setDialNumber] = useState('+');
  const [direction, setDirection] = useState<Direction>('OUTBOUND');
  const [availability, setAvailability] = useState<Availability>('AVAILABLE');
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);
  const [incomingNumber, setIncomingNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactId, setContactId] = useState<string | null>(null);

  // Call options
  const [notes, setNotes] = useState('');
  const [isCallRecorded, setIsCallRecorded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Ref to track active call state synchronously (for broadcast handler)
  const isCallActiveRef = useRef(false);

  // Ref to track if user wants to accept incoming call (for WebRTC timing)
  const pendingAcceptRef = useRef(false);

  // Ref to track if WE ended the call (to distinguish from HubSpot SDK CALL_ENDED)
  const weEndedCallRef = useRef(false);

  // Initialize hooks
  const {
    cti,
    engagementId,
    incomingContactName,
    portalId,
    userId,
    ownerId,
    isReady,
    setEngagementId,
  } = useCti(setDialNumber);

  const {
    permissionStatus,
    permission,
    isChecking: isCheckingPermission,
    isRequesting: isRequestingPermission,
    canCall: canMakeCall,
    error: permissionError,
    reason: permissionReason,
    checkPermission,
    requestPermission,
    validatePermission,
    resetPermission,
  } = usePermission();

  const {
    callDuration,
    callDurationString,
    startTimer,
    stopTimer,
    resetTimer,
  } = useCallTimer();

  // Derived state
  const fromNumber = apiService.getFromNumber();

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  // Standalone mode owner ID (for testing)
  const [standaloneOwnerId] = useState(() => `dev_${Date.now()}`);
  const effectiveOwnerId = DEV_MODE ? standaloneOwnerId : ownerId;

  // Log mode on mount
  useEffect(() => {
    console.log(`🚀 Widget running in ${DEV_MODE ? 'STANDALONE' : 'HUBSPOT'} mode`);
    if (DEV_MODE) {
      console.log('📋 Standalone mode: HubSpot SDK bypassed for local testing');
      console.log('📋 Owner ID:', standaloneOwnerId);
    }
  }, [standaloneOwnerId]);

  // Initialize when HubSpot SDK is ready (only in HubSpot mode)
  // Register Twilio device and set as available
  useEffect(() => {
    const initializeWidget = async () => {
      if (!DEV_MODE && isReady && effectiveOwnerId) {
        try {
          // Initialize WebRTC with owner identity FIRST
          const identity = `hubspot_${effectiveOwnerId}`;
          await webrtcService.initialize(identity);

          // Connect WebSocket for incoming calls
          websocketService.connect(effectiveOwnerId);

          console.log('✅ Services initialized for owner:', effectiveOwnerId);

          // Now set user as logged in and available
          cti.userLoggedIn();
          cti.userAvailable();
          console.log('👤 User auto-logged in and set as Available');

          setCurrentScreen(ScreenNames.Keypad);
        } catch (error) {
          console.error('❌ Failed to initialize services:', error);
          // Still show keypad even if services fail
          cti.userLoggedIn();
          setCurrentScreen(ScreenNames.Keypad);
        }
      }
    };

    initializeWidget();
  }, [isReady, effectiveOwnerId, cti]);

  // Initialize services in DEV mode
  useEffect(() => {
    const initializeDevMode = async () => {
      if (DEV_MODE && effectiveOwnerId && currentScreen === ScreenNames.Keypad) {
        try {
          const identity = `hubspot_${effectiveOwnerId}`;
          await webrtcService.initialize(identity);
          websocketService.connect(effectiveOwnerId);
          console.log('✅ DEV MODE: Services initialized for owner:', effectiveOwnerId);
        } catch (error) {
          console.error('❌ Failed to initialize services:', error);
        }
      }
    };

    initializeDevMode();
  }, [effectiveOwnerId, currentScreen]);

  // ============================================================================
  // PERMISSION CHECK ON PHONE NUMBER CHANGE
  // ============================================================================

  // Debounce ref for permission check
  const permissionCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (permissionCheckTimeoutRef.current) {
      clearTimeout(permissionCheckTimeoutRef.current);
    }

    // Only check if we're on the Keypad screen and have a valid number
    const cleanNumber = cleanPhoneNumber(dialNumber);
    const isValidNumber = cleanNumber.replace(/\D/g, '').length >= 10;

    if (currentScreen === ScreenNames.Keypad && isValidNumber) {
      // Debounce the permission check (500ms delay)
      permissionCheckTimeoutRef.current = setTimeout(() => {
        console.log('📋 Checking permission for:', cleanNumber);
        checkPermission(cleanNumber);
      }, 500);
    } else {
      // Reset permission if number is not valid
      resetPermission();
    }

    return () => {
      if (permissionCheckTimeoutRef.current) {
        clearTimeout(permissionCheckTimeoutRef.current);
      }
    };
  }, [dialNumber, currentScreen, checkPermission, resetPermission]);

  // Sync contactId from permission check response to local state
  useEffect(() => {
    if (permission?.hubspot_contact_id && !contactId) {
      console.log('💾 Setting contactId from permission check:', permission.hubspot_contact_id);
      setContactId(permission.hubspot_contact_id);
    }
  }, [permission, contactId]);

  // ============================================================================
  // WEBSOCKET EVENT HANDLERS
  // ============================================================================

  useEffect(() => {
    // Handle incoming calls via WebSocket
    const unsubscribeIncoming = websocketService.onIncomingCall((data: IncomingCallData) => {
      console.log('Incoming call received:', data);

      // Only handle if available
      if (availability !== 'AVAILABLE') {
        console.log('User unavailable, ignoring incoming call');
        return;
      }

      // Store call data
      setIncomingNumber(data.fromNumber);
      setContactName(data.contactName || '');
      setContactId(data.contactId || null);
      setCurrentCallSid(data.callSid);
      setDirection('INBOUND');

      if (data.engagementId) {
        setEngagementId(data.engagementId);
      }

      // Notify HubSpot SDK
      cti.incomingCall({
        externalCallId: uuidv4(),
        fromNumber: data.fromNumber,
        toNumber: fromNumber,
        createEngagement: true,
      });

      // Show incoming screen
      setCurrentScreen(ScreenNames.Incoming);
    });

    // Handle call answered (WhatsApp user picks up)
    const unsubscribeAnswered = websocketService.onCallAnswered((data) => {
      console.log('Call answered:', data);
      if (data.callSid === currentCallSid) {
        isCallActiveRef.current = true; // Mark call as active
        setCallStatus('in-progress');
        startTimer();
        setCurrentScreen(ScreenNames.Calling);

        // Notify HubSpot
        cti.callAnswered({ externalCallId: cti.externalCallId });
      }
    });

    // Handle call status updates
    const unsubscribeStatus = websocketService.onCallStatusUpdate((data) => {
      console.log('Call status update:', data);
      if (data.callSid === currentCallSid) {
        setCallStatus(data.status as CallStatus);

        if (['completed', 'failed', 'no-answer', 'busy', 'canceled'].includes(data.status)) {
          handleCallEnded(data.status);
        }
      }
    });

    return () => {
      unsubscribeIncoming();
      unsubscribeAnswered();
      unsubscribeStatus();
    };
  }, [availability, currentCallSid, cti, fromNumber, startTimer]);

  // ============================================================================
  // WEBRTC EVENT HANDLERS
  // ============================================================================

  useEffect(() => {
    // Handle incoming WebRTC calls (from Twilio Device)
    const unsubscribeIncoming = webrtcService.onIncomingCall((call) => {
      console.log('WebRTC incoming call:', call.parameters);

      // If user already clicked Accept but WebRTC call wasn't ready yet, accept now
      if (pendingAcceptRef.current) {
        console.log('📞 Auto-accepting WebRTC call (user already clicked Accept)');
        pendingAcceptRef.current = false;
        isCallActiveRef.current = true;
        webrtcService.acceptCall();
        cti.callAnswered({ externalCallId: cti.externalCallId });
        startTimer();
        setCurrentScreen(ScreenNames.Calling);
      }
    });

    // Handle call status from WebRTC
    const unsubscribeStatus = webrtcService.onCallStatus((status, call) => {
      console.log('WebRTC call status:', status);

      switch (status) {
        case 'accepted':
          isCallActiveRef.current = true; // Mark call as active
          setCallStatus('in-progress');
          if (!callDuration) {
            startTimer();
          }
          setCurrentScreen(ScreenNames.Calling);
          break;

        case 'disconnected':
        case 'canceled':
        case 'rejected':
          handleCallEnded(status);
          break;

        case 'ringing':
          setCallStatus('ringing');
          break;

        case 'error':
          handleCallEnded('failed');
          break;
      }
    });

    return () => {
      unsubscribeIncoming();
      unsubscribeStatus();
    };
  }, [currentScreen, callDuration, startTimer, cti]);

  // ============================================================================
  // BROADCAST CHANNEL (for multi-window sync)
  // ============================================================================

  useEffect(() => {
    const handleBroadcastMessage = ({
      data,
    }: MessageEvent<{ type: string; payload?: any }>) => {
      // Handle messages from other instances (remote/window)
      if (
        cti.usesCallingWindow ? cti.isFromWindow : cti.isFromRemoteWithoutWindow
      ) {
        if (data.type === thirdPartyToHostEvents.INITIALIZED) {
          cti.contract.initialized(data.payload);
        } else if (data.type === thirdPartyToHostEvents.LOGGED_IN) {
          cti.contract.userLoggedIn();
        } else if (data.type === thirdPartyToHostEvents.LOGGED_OUT) {
          cti.contract.userLoggedOut();
        } else if (data.type === thirdPartyToHostEvents.USER_AVAILABLE) {
          cti.contract.userAvailable();
        } else if (data.type === thirdPartyToHostEvents.USER_UNAVAILABLE) {
          cti.contract.userUnavailable();
        } else if (data.type === thirdPartyToHostEvents.OUTGOING_CALL_STARTED) {
          cti.externalCallId = uuidv4();
          cti.contract.outgoingCall({
            ...data.payload,
            externalCallId: cti.externalCallId,
          });
        } else if (data.type === thirdPartyToHostEvents.INCOMING_CALL) {
          cti.externalCallId = uuidv4();
          cti.contract.incomingCall({
            ...data.payload,
            externalCallId: cti.externalCallId,
          });
        } else if (data.type === thirdPartyToHostEvents.CALL_ANSWERED) {
          cti.contract.callAnswered({
            ...data.payload,
            externalCallId: cti.externalCallId,
          });
        } else if (data.type === thirdPartyToHostEvents.CALL_ENDED) {
          cti.contract.callEnded({
            ...data.payload,
            externalCallId: cti.externalCallId,
          });
        } else if (data.type === thirdPartyToHostEvents.CALL_COMPLETED) {
          cti.contract.callCompleted({
            ...data.payload,
            externalCallId: cti.externalCallId,
          });
        }
      }

      // Handle UI state updates
      // Note: LOGGED_IN and LOGGED_OUT are handled locally during initialization,
      // not via broadcast, to prevent multiple tabs from syncing screens
      switch (data.type) {
        case thirdPartyToHostEvents.USER_AVAILABLE:
          setAvailability('AVAILABLE');
          break;

        case thirdPartyToHostEvents.USER_UNAVAILABLE:
          setAvailability('UNAVAILABLE');
          break;

        case thirdPartyToHostEvents.OUTGOING_CALL_STARTED:
          setDialNumber(data.payload?.toNumber || dialNumber);
          handleOutgoingCallStarted();
          break;

        case thirdPartyToHostEvents.INCOMING_CALL:
          setIncomingNumber(data.payload?.fromNumber || '');
          handleIncomingCallReceived();
          break;

        case thirdPartyToHostEvents.CALL_ANSWERED:
          isCallActiveRef.current = true; // Mark call as active
          setCurrentScreen(ScreenNames.Calling);
          break;

        case thirdPartyToHostEvents.CALL_ENDED:
          // Only process CALL_ENDED if WE initiated it (not from HubSpot SDK)
          // This prevents HubSpot SDK quirks from ending active calls unexpectedly
          if (weEndedCallRef.current) {
            weEndedCallRef.current = false; // Reset the flag
            if (isCallActiveRef.current) {
              isCallActiveRef.current = false;
              stopTimer();
              setCurrentScreen(ScreenNames.CallEnded);
            }
          } else {
            console.log('⚠️ Ignoring unexpected CALL_ENDED from HubSpot SDK');
          }
          break;

        case thirdPartyToHostEvents.CALL_COMPLETED:
          // Only update UI state - don't trigger another broadcast
          resetCallState();
          setCurrentScreen(ScreenNames.Keypad);
          break;
      }
    };

    cti.broadcastChannel.onmessage = handleBroadcastMessage;
  }, [cti, dialNumber, stopTimer, resetCallState]);

  // ============================================================================
  // CALL HANDLERS
  // ============================================================================

  const handleLogin = useCallback(() => {
    if (!DEV_MODE) {
      cti.userLoggedIn();
    }
    console.log('👤 User logged in');
    setCurrentScreen(ScreenNames.Keypad);
  }, [cti]);

  const handleLogout = useCallback(() => {
    cti.userLoggedOut();
    websocketService.disconnect();
    setCurrentScreen(ScreenNames.Login);
  }, [cti]);

  const handleAvailabilityChange = useCallback(
    (newAvailability: Availability) => {
      setAvailability(newAvailability);
      if (newAvailability === 'AVAILABLE') {
        cti.userAvailable();
      } else {
        cti.userUnavailable();
      }
    },
    [cti]
  );

  const handleCall = useCallback(async () => {
    const cleanNumber = cleanPhoneNumber(dialNumber);

    // First, validate permission
    const canCall = await validatePermission(cleanNumber);

    if (!canCall) {
      // Check permission status to determine which screen to show
      if (permissionStatus === 'not_found' || !permissionStatus) {
        setCurrentScreen(ScreenNames.PermissionRequest);
      } else if (permissionStatus === 'pending') {
        setCurrentScreen(ScreenNames.PermissionPending);
      } else if (['denied', 'expired', 'revoked', 'rate_limited'].includes(permissionStatus)) {
        setCurrentScreen(ScreenNames.PermissionDenied);
      }
      return;
    }

    // Permission granted, initiate call
    setDirection('OUTBOUND');
    setCallStatus('connecting');
    setCurrentScreen(ScreenNames.Dialing);

    // Notify HubSpot SDK
    cti.outgoingCall({
      externalCallId: uuidv4(),
      fromNumber,
      toNumber: cleanNumber,
      createEngagement: true,
    });

    try {
      // Make the WebRTC call
      const call = await webrtcService.makeCall(cleanNumber);
      if (call) {
        setCurrentCallSid(call.parameters?.CallSid || null);
      }
    } catch (error) {
      console.error('Failed to initiate call:', error);
      handleCallEnded('failed');
    }
  }, [dialNumber, validatePermission, permissionStatus, cti, fromNumber]);

  const handleRequestPermission = useCallback(async () => {
    const cleanNumber = cleanPhoneNumber(dialNumber);

    // Get contactId from permission check response, local state, or fetch from backend
    let hubspotContactId = permission?.hubspot_contact_id || contactId || '';

    console.log('📋 handleRequestPermission - contactId sources:', {
      fromPermission: permission?.hubspot_contact_id,
      fromState: contactId,
      final: hubspotContactId,
    });

    // If still no contactId, try to fetch from backend
    if (!hubspotContactId) {
      try {
        const contact = await apiService.getContact(cleanNumber);
        if (contact?.id) {
          hubspotContactId = contact.id;
          setContactId(contact.id);
          console.log('📋 Got contactId from backend:', hubspotContactId);
        }
      } catch (err) {
        console.log('Could not get contact from backend, proceeding without contactId');
      }
    }

    if (!hubspotContactId) {
      console.warn('⚠️ No contactId available for permission request');
    }

    await requestPermission(cleanNumber, hubspotContactId);

    // Refresh permission status after request
    setTimeout(() => {
      checkPermission(cleanNumber);
    }, 1000);
  }, [dialNumber, permission, contactId, requestPermission, checkPermission]);

  const handleOutgoingCallStarted = useCallback(() => {
    setDirection('OUTBOUND');
    startTimer();
    setCurrentScreen(ScreenNames.Dialing);
  }, [startTimer]);

  const handleIncomingCallReceived = useCallback(() => {
    setDirection('INBOUND');
    setCurrentScreen(ScreenNames.Incoming);
  }, []);

  const handleAcceptCall = useCallback(() => {
    // Check if WebRTC call is ready
    if (webrtcService.hasIncomingCall()) {
      // WebRTC call exists - accept it now
      isCallActiveRef.current = true;
      pendingAcceptRef.current = false;
      webrtcService.acceptCall();
      cti.callAnswered({ externalCallId: cti.externalCallId });
      startTimer();
      setCurrentScreen(ScreenNames.Calling);
    } else {
      // WebRTC call hasn't arrived yet - mark as pending
      // It will be accepted when the WebRTC call arrives
      console.log('⏳ WebRTC call not ready yet, marking as pending accept');
      pendingAcceptRef.current = true;
      // Show Calling screen with "Connecting..." state
      setCurrentScreen(ScreenNames.Calling);
    }
  }, [cti, startTimer]);

  const handleDeclineCall = useCallback(() => {
    webrtcService.rejectCall();
    apiService.declineCall(currentCallSid || '');
    weEndedCallRef.current = true; // Mark that WE ended the call

    cti.callEnded({
      externalCallId: cti.externalCallId,
      engagementId: engagementId || 0,
      callEndStatus: 'REJECTED',
    });

    resetCallState();
    setCurrentScreen(ScreenNames.Keypad);
  }, [cti, currentCallSid, engagementId]);

  const handleEndCall = useCallback(() => {
    webrtcService.endCall();
    apiService.endCall(currentCallSid || '');
    stopTimer();
    isCallActiveRef.current = false;
    weEndedCallRef.current = true; // Mark that WE ended the call

    cti.callEnded({
      externalCallId: cti.externalCallId,
      engagementId: engagementId || 0,
      callEndStatus: 'COMPLETED',
    });

    setCurrentScreen(ScreenNames.CallEnded);
  }, [cti, currentCallSid, engagementId, stopTimer]);

  const handleCallEnded = useCallback(
    (status?: string) => {
      isCallActiveRef.current = false; // Mark call as inactive
      pendingAcceptRef.current = false; // Reset pending accept
      weEndedCallRef.current = true; // Mark that WE ended the call
      stopTimer();
      setCallStatus((status as CallStatus) || 'completed');

      cti.callEnded({
        externalCallId: cti.externalCallId,
        engagementId: engagementId || 0,
        callEndStatus: status === 'completed' ? 'COMPLETED' : 'FAILED',
      });

      setCurrentScreen(ScreenNames.CallEnded);
    },
    [cti, engagementId, stopTimer]
  );

  const handleCallCompleted = useCallback(() => {
    resetCallState();
    setCurrentScreen(ScreenNames.Keypad);
  }, []);

  const handleSaveCall = useCallback(
    (outcome: string) => {
      const engagementProperties = {
        hs_timestamp: Date.now(),
        hs_call_body: notes,
        hs_call_direction: direction,
        hs_call_disposition: outcome,
        hs_call_duration: String(callDuration * 1000), // Convert to milliseconds for HubSpot
        hs_call_from_number: direction === 'OUTBOUND' ? fromNumber : incomingNumber,
        hs_call_to_number: direction === 'OUTBOUND' ? dialNumber : fromNumber,
        hs_call_status: 'COMPLETED',
        hs_call_title: `WhatsApp Call - ${contactName || dialNumber}`,
        hs_call_source: 'INTEGRATIONS_PLATFORM',
        hs_call_recording_url: isCallRecorded ? 'pending' : undefined,
        hubspot_owner_id: effectiveOwnerId || undefined,
      };

      console.log('💾 Saving call to HubSpot:', {
        externalCallId: cti.externalCallId,
        engagementId,
        notes,
        isCallRecorded,
        engagementProperties,
      });

      // Finalize engagement with HubSpot
      cti.callCompleted({
        externalCallId: cti.externalCallId,
        engagementId: engagementId || undefined,
        hideWidget: false,
        engagementProperties,
      });

      resetCallState();
      setCurrentScreen(ScreenNames.Keypad);
    },
    [
      cti,
      engagementId,
      notes,
      direction,
      callDuration,
      fromNumber,
      incomingNumber,
      dialNumber,
      contactName,
      isCallRecorded,
      effectiveOwnerId,
    ]
  );

  const handleDiscardCall = useCallback(() => {
    resetCallState();
    setCurrentScreen(ScreenNames.Keypad);
  }, []);

  const handleMute = useCallback((muted: boolean) => {
    webrtcService.setMute(muted);
    setIsMuted(muted);
  }, []);

  const handleSendDTMF = useCallback((digit: string) => {
    webrtcService.sendDigits(digit);
  }, []);

  const resetCallState = useCallback(() => {
    isCallActiveRef.current = false; // Reset call active state
    pendingAcceptRef.current = false; // Reset pending accept state
    weEndedCallRef.current = false; // Reset call ended flag
    setDialNumber('+');
    setNotes('');
    setIsCallRecorded(false);
    setIsMuted(false);
    setCurrentCallSid(null);
    setContactName('');
    setContactId(null);
    setIncomingNumber('');
    setCallStatus(null);
    resetTimer();
    resetPermission();
    setEngagementId(null);
  }, [resetTimer, resetPermission, setEngagementId]);

  const handleCancelPermission = useCallback(() => {
    resetPermission();
    setCurrentScreen(ScreenNames.Keypad);
  }, [resetPermission]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderScreen = () => {
    switch (currentScreen) {
      case ScreenNames.Loading:
        return <LoadingScreen />;

      case ScreenNames.Login:
        return <LoginScreen onLogin={handleLogin} />;

      case ScreenNames.Keypad:
        return (
          <KeypadScreen
            dialNumber={dialNumber}
            setDialNumber={setDialNumber}
            availability={availability}
            setAvailability={handleAvailabilityChange}
            onCall={handleCall}
            onRequestPermission={handleRequestPermission}
            isCheckingPermission={isCheckingPermission}
            isRequestingPermission={isRequestingPermission}
            permissionStatus={permissionStatus}
            permissionError={permissionError}
          />
        );

      case ScreenNames.PermissionRequest:
        return (
          <PermissionRequestScreen
            phoneNumber={dialNumber}
            contactName={contactName}
            onRequestPermission={handleRequestPermission}
            onCancel={handleCancelPermission}
            isRequesting={isRequestingPermission}
            error={permissionError}
          />
        );

      case ScreenNames.PermissionPending:
        return (
          <PermissionPendingScreen
            phoneNumber={dialNumber}
            contactName={contactName}
            onCancel={handleCancelPermission}
            onCheckAgain={() => checkPermission(cleanPhoneNumber(dialNumber))}
          />
        );

      case ScreenNames.PermissionDenied:
        return (
          <PermissionDeniedScreen
            phoneNumber={dialNumber}
            contactName={contactName}
            status={permissionStatus || 'denied'}
            reason={permissionReason || undefined}
            onRequestAgain={handleRequestPermission}
            onCancel={handleCancelPermission}
            canRequestAgain={permissionStatus !== 'rate_limited'}
          />
        );

      case ScreenNames.Dialing:
        return (
          <DialingScreen
            phoneNumber={dialNumber}
            contactName={contactName}
            onEndCall={handleEndCall}
            callStatus={callStatus === 'ringing' ? 'Ringing' : 'Dialing'}
          />
        );

      case ScreenNames.Incoming:
        return (
          <IncomingScreen
            phoneNumber={incomingNumber}
            contactName={incomingContactName || contactName}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
          />
        );

      case ScreenNames.Calling:
        return (
          <CallingScreen
            phoneNumber={direction === 'OUTBOUND' ? dialNumber : incomingNumber}
            contactName={incomingContactName || contactName}
            duration={callDurationString}
            direction={direction}
            onEndCall={handleEndCall}
            onMute={handleMute}
            onSendDTMF={handleSendDTMF}
            isMuted={isMuted}
            notes={notes}
            setNotes={setNotes}
          />
        );

      case ScreenNames.CallEnded:
        return (
          <CallEndedScreen
            phoneNumber={direction === 'OUTBOUND' ? dialNumber : incomingNumber}
            contactName={incomingContactName || contactName}
            duration={callDuration}
            direction={direction}
            callStatus={callStatus}
            notes={notes}
            setNotes={setNotes}
            isRecorded={isCallRecorded}
            onSave={handleSaveCall}
            onDiscard={handleDiscardCall}
          />
        );

      default:
        return <LoadingScreen />;
    }
  };

  return <>{renderScreen()}</>;
};

export default App;
