/**
 * Keypad Screen Component - Main dialing interface
 */

import React, { useCallback } from 'react';
import styled from 'styled-components';
import {
  WidgetContainer,
  Header,
  HeaderTitle,
  HeaderSubtitle,
  Content,
  Footer,
  PhoneInputContainer,
  PhoneInput,
  KeypadGrid,
  KeypadButton,
  IconButton,
  Select,
  StatusBadge,
  AlertBox,
  PrimaryButton,
  SecondaryButton,
} from '../../theme/styled';
import {
  WhatsAppIcon,
  PhoneIcon,
  BackspaceIcon,
  CheckIcon,
  ClockIcon,
  SendIcon,
} from '../Icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/colors';
import { ScreenProps, Availability, PermissionStatus } from '../../types';

const KEYPAD_BUTTONS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

const AvailabilityContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
`;

const AvailabilitySelect = styled(Select)`
  width: auto;
  padding: ${SPACING.xs} ${SPACING.sm};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: ${COLORS.olaf};

  option {
    color: ${COLORS.obsidian};
    background: ${COLORS.olaf};
  }
`;

const KeypadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
`;

const ActionButtonsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.lg};
  margin-top: ${SPACING.lg};
`;

const PermissionStatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${SPACING.sm};
  margin-bottom: ${SPACING.md};
  padding: ${SPACING.sm} ${SPACING.md};
  border-radius: 8px;
  background: ${COLORS.gypsum};
  width: 100%;
`;

const PermissionBadge = styled.div<{ $status: 'granted' | 'pending' | 'not_found' | 'checking' }>`
  display: flex;
  align-items: center;
  gap: ${SPACING.xs};
  padding: ${SPACING.xs} ${SPACING.sm};
  border-radius: 16px;
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  background: ${({ $status }) => {
    switch ($status) {
      case 'granted': return COLORS.successLight;
      case 'pending': return COLORS.warningLight;
      case 'checking': return COLORS.koala;
      default: return COLORS.koala;
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case 'granted': return COLORS.successDark;
      case 'pending': return COLORS.warningDark;
      default: return COLORS.battleship;
    }
  }};
`;

const RequestPermissionButton = styled(PrimaryButton)`
  padding: ${SPACING.xs} ${SPACING.md};
  font-size: ${TYPOGRAPHY.fontSize.sm};
`;

interface KeypadScreenProps extends Partial<ScreenProps> {
  dialNumber: string;
  setDialNumber: (num: string) => void;
  availability: Availability;
  setAvailability: (avail: Availability) => void;
  onCall: () => void;
  onRequestPermission?: () => void;
  isCheckingPermission?: boolean;
  isRequestingPermission?: boolean;
  permissionStatus?: PermissionStatus | null;
  permissionError?: string | null;
}

const KeypadScreen: React.FC<KeypadScreenProps> = ({
  dialNumber,
  setDialNumber,
  availability,
  setAvailability,
  onCall,
  onRequestPermission,
  isCheckingPermission,
  isRequestingPermission,
  permissionStatus,
  permissionError,
}) => {
  const handleDigitPress = useCallback(
    (digit: string) => {
      if (digit === '+' && dialNumber.includes('+')) return;
      setDialNumber(dialNumber + digit);
    },
    [dialNumber, setDialNumber]
  );

  const handleBackspace = useCallback(() => {
    if (dialNumber.length > 0) {
      setDialNumber(dialNumber.slice(0, -1));
    }
  }, [dialNumber, setDialNumber]);

  const handleLongPressZero = useCallback(() => {
    if (!dialNumber.includes('+')) {
      setDialNumber(dialNumber + '+');
    }
  }, [dialNumber, setDialNumber]);

  const handleCall = useCallback(() => {
    if (dialNumber.length >= 10) {
      onCall();
    }
  }, [dialNumber, onCall]);

  const handleAvailabilityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setAvailability(e.target.value as Availability);
    },
    [setAvailability]
  );

  const isValidNumber = dialNumber.replace(/\D/g, '').length >= 10;
  const canCall = isValidNumber && permissionStatus === 'granted';
  const showPermissionStatus = isValidNumber && !isCheckingPermission;

  const renderPermissionStatus = () => {
    if (!isValidNumber) return null;

    if (isCheckingPermission) {
      return (
        <PermissionStatusContainer>
          <PermissionBadge $status="checking">
            <ClockIcon size={14} />
            Checking permission...
          </PermissionBadge>
        </PermissionStatusContainer>
      );
    }

    if (permissionStatus === 'granted') {
      return (
        <PermissionStatusContainer>
          <PermissionBadge $status="granted">
            <CheckIcon size={14} color={COLORS.successDark} />
            Permission Granted
          </PermissionBadge>
        </PermissionStatusContainer>
      );
    }

    if (permissionStatus === 'pending') {
      return (
        <PermissionStatusContainer>
          <PermissionBadge $status="pending">
            <ClockIcon size={14} />
            Permission Pending
          </PermissionBadge>
          <span style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.battleship }}>
            Waiting for contact to accept
          </span>
        </PermissionStatusContainer>
      );
    }

    // Not found or not requested - show request button
    if (permissionStatus === 'not_found' || permissionStatus === 'not_requested' || !permissionStatus) {
      return (
        <PermissionStatusContainer>
          <PermissionBadge $status="not_found">
            Permission Required
          </PermissionBadge>
          {onRequestPermission && (
            <RequestPermissionButton
              onClick={onRequestPermission}
              disabled={isRequestingPermission}
            >
              <SendIcon size={14} color="#fff" />
              {isRequestingPermission ? 'Sending...' : 'Send Permission Request'}
            </RequestPermissionButton>
          )}
        </PermissionStatusContainer>
      );
    }

    // Denied, expired, revoked, rate_limited
    if (['denied', 'expired', 'revoked', 'rate_limited'].includes(permissionStatus)) {
      return (
        <PermissionStatusContainer>
          <AlertBox $variant="warning" style={{ margin: 0, width: '100%' }}>
            {permissionStatus === 'rate_limited'
              ? 'Rate limit reached. Please try again later.'
              : `Permission ${permissionStatus}. Cannot make calls.`}
          </AlertBox>
          {permissionStatus !== 'rate_limited' && onRequestPermission && (
            <RequestPermissionButton
              onClick={onRequestPermission}
              disabled={isRequestingPermission}
              style={{ marginTop: SPACING.xs }}
            >
              <SendIcon size={14} color="#fff" />
              {isRequestingPermission ? 'Sending...' : 'Request Again'}
            </RequestPermissionButton>
          )}
        </PermissionStatusContainer>
      );
    }

    return null;
  };

  return (
    <WidgetContainer>
      <Header>
        <div>
          <HeaderTitle>
            <WhatsAppIcon size={24} color="#fff" />
            WhatsApp Calling
          </HeaderTitle>
          <HeaderSubtitle>HubSpot Integration</HeaderSubtitle>
        </div>
        <AvailabilityContainer>
          <AvailabilitySelect
            value={availability}
            onChange={handleAvailabilityChange}
          >
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </AvailabilitySelect>
          <StatusBadge $status={availability === 'AVAILABLE' ? 'success' : 'default'}>
            {availability === 'AVAILABLE' ? '●' : '○'}
          </StatusBadge>
        </AvailabilityContainer>
      </Header>

      <Content>
        {permissionError && (
          <AlertBox $variant="error">
            {permissionError}
          </AlertBox>
        )}

        <KeypadContainer>
          <PhoneInputContainer>
            <PhoneInput
              type="tel"
              value={dialNumber}
              onChange={(e) => setDialNumber(e.target.value)}
              placeholder="Enter phone number"
            />
          </PhoneInputContainer>

          {renderPermissionStatus()}

          <KeypadGrid>
            {KEYPAD_BUTTONS.map(({ digit, letters }) => (
              <KeypadButton
                key={digit}
                onClick={() => handleDigitPress(digit)}
                onDoubleClick={digit === '0' ? handleLongPressZero : undefined}
              >
                {digit}
                {letters && <span>{letters}</span>}
              </KeypadButton>
            ))}
          </KeypadGrid>

          <ActionButtonsRow>
            <IconButton
              $variant="default"
              onClick={handleBackspace}
              disabled={dialNumber.length === 0}
              title="Backspace"
            >
              <BackspaceIcon size={24} />
            </IconButton>

            <IconButton
              $variant="success"
              onClick={handleCall}
              disabled={!canCall || isCheckingPermission}
              title={
                !isValidNumber
                  ? 'Enter a valid phone number'
                  : !canCall
                    ? 'Permission required to call'
                    : 'Call'
              }
            >
              <PhoneIcon size={28} color="#fff" />
            </IconButton>

            <div style={{ width: 56 }} /> {/* Spacer */}
          </ActionButtonsRow>
        </KeypadContainer>
      </Content>

      <Footer>
        <span style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.battleship }}>
          Powered by WhatsApp Business API
        </span>
      </Footer>
    </WidgetContainer>
  );
};

export default KeypadScreen;
