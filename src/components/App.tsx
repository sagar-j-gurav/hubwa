/**
 * Main Application Component
 * HubSpot WhatsApp Calling Widget
 *
 * Supports two modes:
 * 1. Standalone Mode (DEV_MODE=true) - For local testing without HubSpot
 * 2. HubSpot Mode - When loaded inside HubSpot iframe
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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

// Check if we're in development/standalone mode
// This allows testing without being inside HubSpot iframe
const isStandaloneMode = (): boolean => {
  // Check URL param: ?standalone=true
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('standalone') === 'true') return true;

  // Check if NOT inside HubSpot iframe (no parent or same origin)
  try {
    if (window.self === window.top) return true;
  } catch (e) {
    // Cross-origin, likely inside HubSpot
    return false;
  }

  return false;
};

const DEV_MODE = isStandaloneMode();

const App: React.FC = () => {
  // Screen state - Start at Login in standalone mode, Loading in HubSpot mode
  const [currentScreen, setCurrentScreen] = useState<ScreenNames>(
    DEV_MODE ? ScreenNames.Login : ScreenNames.Loading
  );

  // Call state
  const [dialNumber, setDialNumber] = useState('+');
  const [direction, setDirection] = useState<Direction>('OUTBOUND');
  const [availability, setAvailability] = useState<Availability>('UNAVAILABLE');
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);
  const [incomingNumber, setIncomingNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactId, setContactId] = useState<string | null>(null);

  // Call options
  const [notes, setNotes] = useState('');
  const [isCallRecorded, setIsCallRecorded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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
  useEffect(() => {
    if (!DEV_MODE && isReady) {
      setCurrentScreen(ScreenNames.Login);
    }
  }, [isReady]);

  // Initialize WebRTC when user logs in
  useEffect(() => {
    const initializeServices = async () => {
      if (effectiveOwnerId && currentScreen === ScreenNames.Keypad) {
        try {
          // Initialize WebRTC with owner identity
          const identity = `hubspot_${effectiveOwnerId}`;
          await webrtcService.initialize(identity);

          // Connect WebSocket for incoming calls
          websocketService.connect(effectiveOwnerId);

          console.log('✅ Services initialized for owner:', effectiveOwnerId);
        } catch (error) {
          console.error('❌ Failed to initialize services:', error);
        }
      }
    };

    initializeServices();

    return () => {
      // Cleanup on unmount
      // Note: Don't destroy on every re-render, only on unmount
    };
  }, [effectiveOwnerId, currentScreen]);

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

      // If we already have incoming call data from WebSocket, accept the WebRTC leg
      if (currentScreen === ScreenNames.Incoming) {
        // Don't auto-accept, user will click Accept button
      }
    });

    // Handle call status from WebRTC
    const unsubscribeStatus = webrtcService.onCallStatus((status, call) => {
      console.log('WebRTC call status:', status);

      switch (status) {
        case 'accepted':
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
  }, [currentScreen, callDuration, startTimer]);

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
      switch (data.type) {
        case thirdPartyToHostEvents.LOGGED_IN:
          setCurrentScreen(ScreenNames.Keypad);
          break;

        case thirdPartyToHostEvents.LOGGED_OUT:
          setCurrentScreen(ScreenNames.Login);
          break;

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
          setCurrentScreen(ScreenNames.Calling);
          break;

        case thirdPartyToHostEvents.CALL_ENDED:
          handleCallEnded();
          break;

        case thirdPartyToHostEvents.CALL_COMPLETED:
          handleCallCompleted();
          break;
      }
    };

    cti.broadcastChannel.onmessage = handleBroadcastMessage;
  }, [cti, dialNumber]);

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
    await requestPermission(cleanNumber, contactId || '');

    if (permissionStatus === 'pending') {
      setCurrentScreen(ScreenNames.PermissionPending);
    }
  }, [dialNumber, contactId, requestPermission, permissionStatus]);

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
    webrtcService.acceptCall();
    cti.callAnswered({ externalCallId: cti.externalCallId });
    startTimer();
    setCurrentScreen(ScreenNames.Calling);
  }, [cti, startTimer]);

  const handleDeclineCall = useCallback(() => {
    webrtcService.rejectCall();
    apiService.declineCall(currentCallSid || '');

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

    cti.callEnded({
      externalCallId: cti.externalCallId,
      engagementId: engagementId || 0,
      callEndStatus: 'COMPLETED',
    });

    setCurrentScreen(ScreenNames.CallEnded);
  }, [cti, currentCallSid, engagementId, stopTimer]);

  const handleCallEnded = useCallback(
    (status?: string) => {
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
      // Finalize engagement with HubSpot
      cti.callCompleted({
        externalCallId: cti.externalCallId,
        engagementId: engagementId || undefined,
        hideWidget: false,
        engagementProperties: {
          hs_timestamp: Date.now(),
          hs_call_body: notes,
          hs_call_direction: direction,
          hs_call_disposition: outcome,
          hs_call_duration: String(callDuration),
          hs_call_from_number: direction === 'OUTBOUND' ? fromNumber : incomingNumber,
          hs_call_to_number: direction === 'OUTBOUND' ? dialNumber : fromNumber,
          hs_call_status: 'COMPLETED',
          hs_call_title: `WhatsApp Call - ${contactName || dialNumber}`,
          hs_call_source: 'INTEGRATIONS_PLATFORM',
          hs_call_recording_url: isCallRecorded ? 'pending' : undefined,
        },
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

  const handleSimulateIncoming = useCallback(() => {
    // For testing: simulate incoming call
    const testData: IncomingCallData = {
      type: 'incoming_call',
      callSid: `test_${Date.now()}`,
      fromNumber: '+1234567890',
      contactName: 'Test Contact',
      contactId: 'test_contact',
      ownerId: effectiveOwnerId,
    };

    console.log('📞 Simulating incoming call:', testData);

    setIncomingNumber(testData.fromNumber);
    setContactName(testData.contactName || '');
    setContactId(testData.contactId || null);
    setCurrentCallSid(testData.callSid);
    setDirection('INBOUND');

    if (!DEV_MODE) {
      cti.incomingCall({
        externalCallId: uuidv4(),
        fromNumber: testData.fromNumber,
        toNumber: fromNumber,
        createEngagement: true,
      });
    }

    setCurrentScreen(ScreenNames.Incoming);
  }, [cti, fromNumber, effectiveOwnerId]);

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
            onSimulateIncoming={handleSimulateIncoming}
            isCheckingPermission={isCheckingPermission}
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
            isRecording={isCallRecorded}
            setIsRecording={setIsCallRecorded}
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
