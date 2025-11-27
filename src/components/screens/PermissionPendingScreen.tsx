/**
 * Permission Pending Screen - Waiting for contact to accept
 */

import React from 'react';
import styled, { keyframes } from 'styled-components';
import {
  WidgetContainer,
  Header,
  HeaderTitle,
  Content,
  Footer,
  SecondaryButton,
  PermissionContainer,
  PermissionTitle,
  PermissionDescription,
  AlertBox,
} from '../../theme/styled';
import { WhatsAppIcon, ClockIcon } from '../Icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/colors';
import { formatPhoneNumber } from '../../utils/formatters';

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
`;

const PendingIconContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${COLORS.warningLight};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${SPACING.lg};
  animation: ${pulse} 2s ease-in-out infinite;
`;

const PhoneNumber = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.xl};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  color: ${COLORS.obsidian};
  margin: ${SPACING.md} 0;
`;

const ContactName = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${COLORS.battleship};
`;

const StatusText = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.sm};
  padding: ${SPACING.md};
  background: ${COLORS.gypsum};
  border-radius: 8px;
  margin-top: ${SPACING.lg};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.battleship};
`;

const HelpText = styled.p`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.flint};
  margin-top: ${SPACING.md};
  text-align: center;
`;

interface PermissionPendingScreenProps {
  phoneNumber: string;
  contactName?: string;
  onCancel: () => void;
  onCheckAgain?: () => void;
}

const PermissionPendingScreen: React.FC<PermissionPendingScreenProps> = ({
  phoneNumber,
  contactName,
  onCancel,
  onCheckAgain,
}) => {
  return (
    <WidgetContainer>
      <Header>
        <HeaderTitle>
          <WhatsAppIcon size={24} color="#fff" />
          Permission Pending
        </HeaderTitle>
      </Header>

      <Content>
        <PermissionContainer>
          <PendingIconContainer>
            <ClockIcon size={40} color={COLORS.warningDark} />
          </PendingIconContainer>

          <PermissionTitle>Waiting for Response</PermissionTitle>

          {contactName && <ContactName>{contactName}</ContactName>}
          <PhoneNumber>{formatPhoneNumber(phoneNumber)}</PhoneNumber>

          <PermissionDescription>
            A permission request has been sent to this contact's WhatsApp.
            They need to tap "Accept" to allow calls.
          </PermissionDescription>

          <StatusText>
            <ClockIcon size={16} color={COLORS.warning} />
            Waiting for contact to accept...
          </StatusText>

          <AlertBox $variant="info" style={{ marginTop: SPACING.lg }}>
            <strong>What the contact sees:</strong>
            <p style={{ marginTop: SPACING.xs, marginBottom: 0 }}>
              "Would you like to receive voice calls from [Your Business]?"
              with Accept/Decline buttons.
            </p>
          </AlertBox>

          <HelpText>
            You can only request permission once per 24 hours.
            The permission window is valid for 72 hours after acceptance.
          </HelpText>
        </PermissionContainer>
      </Content>

      <Footer>
        {onCheckAgain && (
          <SecondaryButton onClick={onCheckAgain} style={{ width: '100%', marginBottom: SPACING.sm }}>
            Check Status Again
          </SecondaryButton>
        )}
        <SecondaryButton onClick={onCancel} style={{ width: '100%' }}>
          Back to Keypad
        </SecondaryButton>
      </Footer>
    </WidgetContainer>
  );
};

export default PermissionPendingScreen;
