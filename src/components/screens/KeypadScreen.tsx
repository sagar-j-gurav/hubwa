/**
 * Keypad Screen Component - Main dialing interface
 */

import React, { useCallback, useState } from 'react';
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
  FlexBetween,
  StatusBadge,
  AlertBox,
} from '../../theme/styled';
import {
  WhatsAppIcon,
  PhoneIcon,
  BackspaceIcon,
  PhoneIncomingIcon,
} from '../Icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/colors';
import { ScreenProps, ScreenNames, Availability } from '../../types';

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

const SimulateIncomingButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${SPACING.xs};
  padding: ${SPACING.xs} ${SPACING.sm};
  background: ${COLORS.gypsum};
  border: 1px solid ${COLORS.koala};
  border-radius: 4px;
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.battleship};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${COLORS.koala};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface KeypadScreenProps extends Partial<ScreenProps> {
  dialNumber: string;
  setDialNumber: (num: string) => void;
  availability: Availability;
  setAvailability: (avail: Availability) => void;
  onCall: () => void;
  onSimulateIncoming?: () => void;
  isCheckingPermission?: boolean;
  permissionError?: string | null;
}

const KeypadScreen: React.FC<KeypadScreenProps> = ({
  dialNumber,
  setDialNumber,
  availability,
  setAvailability,
  onCall,
  onSimulateIncoming,
  isCheckingPermission,
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
          <AlertBox $variant="warning">
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
              disabled={!isValidNumber || isCheckingPermission}
              title={isValidNumber ? 'Call' : 'Enter a valid phone number'}
            >
              <PhoneIcon size={28} color="#fff" />
            </IconButton>

            <div style={{ width: 56 }} /> {/* Spacer */}
          </ActionButtonsRow>
        </KeypadContainer>
      </Content>

      <Footer>
        <FlexBetween>
          <span style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.battleship }}>
            Powered by WhatsApp Business API
          </span>
          {onSimulateIncoming && (
            <SimulateIncomingButton
              onClick={onSimulateIncoming}
              disabled={availability !== 'AVAILABLE'}
              title={availability !== 'AVAILABLE' ? 'Set status to Available to receive calls' : 'Simulate incoming call'}
            >
              <PhoneIncomingIcon size={14} />
              Test Incoming
            </SimulateIncomingButton>
          )}
        </FlexBetween>
      </Footer>
    </WidgetContainer>
  );
};

export default KeypadScreen;
