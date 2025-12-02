/**
 * Incoming Call Screen - Receive WhatsApp call
 */

import React from 'react';
import styled, { keyframes } from 'styled-components';
import {
  WidgetContainer,
  Header,
  HeaderTitle,
  Content,
  CallInfoContainer,
  Avatar,
  CallerName,
  CallerNumber,
  ActionButtonsContainer,
  IconButton,
} from '../../theme/styled';
import { WhatsAppIcon, PhoneIcon, PhoneOffIcon } from '../Icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/colors';
import { formatPhoneNumber, getInitials } from '../../utils/formatters';

const ring = keyframes`
  0% { transform: rotate(0deg); }
  10% { transform: rotate(15deg); }
  20% { transform: rotate(-15deg); }
  30% { transform: rotate(15deg); }
  40% { transform: rotate(-15deg); }
  50% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 122, 89, 0.4); }
  50% { box-shadow: 0 0 0 30px rgba(255, 122, 89, 0); }
`;

const RingingAvatar = styled(Avatar)`
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const IncomingLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.sm};
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${COLORS.primary};
  margin-bottom: ${SPACING.md};

  svg {
    animation: ${ring} 1s ease-in-out infinite;
  }
`;

const WhatsAppBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: ${COLORS.whatsappGreen};
  color: ${COLORS.olaf};
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  margin-top: ${SPACING.lg};
`;

const ActionLabel = styled.span`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.battleship};
  margin-top: ${SPACING.xs};
`;

const ActionButton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

interface IncomingScreenProps {
  phoneNumber: string;
  contactName?: string;
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingScreen: React.FC<IncomingScreenProps> = ({
  phoneNumber,
  contactName,
  onAccept,
  onDecline,
}) => {
  const displayName = contactName || formatPhoneNumber(phoneNumber);
  // Use '?' for initials if no contact name (avoid showing just digits)
  const initials = contactName ? getInitials(contactName) : '?';

  return (
    <WidgetContainer>
      <Header $variant="incoming">
        <HeaderTitle>
          <WhatsAppIcon size={24} color="#fff" />
          Incoming Call
        </HeaderTitle>
      </Header>

      <Content style={{ justifyContent: 'center' }}>
        <CallInfoContainer>
          <IncomingLabel>
            <PhoneIcon size={20} color={COLORS.primary} />
            Incoming WhatsApp Call
          </IncomingLabel>

          <RingingAvatar $size="lg">{initials}</RingingAvatar>

          <CallerName>{displayName}</CallerName>
          {contactName && <CallerNumber>{formatPhoneNumber(phoneNumber)}</CallerNumber>}

          <WhatsAppBadge>
            <WhatsAppIcon size={14} color="#fff" />
            WhatsApp Voice Call
          </WhatsAppBadge>
        </CallInfoContainer>
      </Content>

      <ActionButtonsContainer>
        <ActionButton>
          <IconButton $variant="danger" onClick={onDecline} title="Decline">
            <PhoneOffIcon size={28} color="#fff" />
          </IconButton>
          <ActionLabel>Decline</ActionLabel>
        </ActionButton>

        <ActionButton>
          <IconButton $variant="success" onClick={onAccept} title="Accept">
            <PhoneIcon size={28} color="#fff" />
          </IconButton>
          <ActionLabel>Accept</ActionLabel>
        </ActionButton>
      </ActionButtonsContainer>
    </WidgetContainer>
  );
};

export default IncomingScreen;
