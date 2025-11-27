/**
 * Dialing Screen - Outbound call in progress
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
  CallStatus,
  ActionButtonsContainer,
  IconButton,
} from '../../theme/styled';
import { WhatsAppIcon, PhoneOffIcon } from '../Icons';
import { COLORS, SPACING } from '../../theme/colors';
import { formatPhoneNumber, getInitials } from '../../utils/formatters';

const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 189, 165, 0.4); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(0, 189, 165, 0); }
`;

const PulsingAvatar = styled(Avatar)`
  animation: ${pulse} 2s ease-in-out infinite;
`;

const StatusDots = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: ${SPACING.sm};
`;

const dot = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0; }
  40% { transform: scale(1); opacity: 1; }
`;

const Dot = styled.span<{ $delay: number }>`
  width: 8px;
  height: 8px;
  background: ${COLORS.info};
  border-radius: 50%;
  animation: ${dot} 1.4s infinite ease-in-out both;
  animation-delay: ${({ $delay }) => $delay}s;
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
  margin-top: ${SPACING.md};
`;

interface DialingScreenProps {
  phoneNumber: string;
  contactName?: string;
  onEndCall: () => void;
  callStatus?: string;
}

const DialingScreen: React.FC<DialingScreenProps> = ({
  phoneNumber,
  contactName,
  onEndCall,
  callStatus = 'Dialing',
}) => {
  const displayName = contactName || formatPhoneNumber(phoneNumber);
  const initials = getInitials(contactName || phoneNumber.slice(-4));

  return (
    <WidgetContainer>
      <Header $variant="calling">
        <HeaderTitle>
          <WhatsAppIcon size={24} color="#fff" />
          Outgoing Call
        </HeaderTitle>
      </Header>

      <Content style={{ justifyContent: 'center' }}>
        <CallInfoContainer>
          <PulsingAvatar $size="lg">{initials}</PulsingAvatar>

          <CallerName>{displayName}</CallerName>
          {contactName && <CallerNumber>{formatPhoneNumber(phoneNumber)}</CallerNumber>}

          <CallStatus $status="connecting">
            {callStatus}
            <StatusDots>
              <Dot $delay={0} />
              <Dot $delay={0.2} />
              <Dot $delay={0.4} />
            </StatusDots>
          </CallStatus>

          <WhatsAppBadge>
            <WhatsAppIcon size={14} color="#fff" />
            WhatsApp Call
          </WhatsAppBadge>
        </CallInfoContainer>
      </Content>

      <ActionButtonsContainer>
        <IconButton $variant="danger" onClick={onEndCall} title="End Call">
          <PhoneOffIcon size={28} color="#fff" />
        </IconButton>
      </ActionButtonsContainer>
    </WidgetContainer>
  );
};

export default DialingScreen;
