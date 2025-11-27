/**
 * Permission Denied Screen - Contact declined or permission expired
 */

import React from 'react';
import styled from 'styled-components';
import {
  WidgetContainer,
  Header,
  HeaderTitle,
  Content,
  Footer,
  SecondaryButton,
  PrimaryButton,
  PermissionContainer,
  PermissionTitle,
  PermissionDescription,
  AlertBox,
  FlexColumn,
} from '../../theme/styled';
import { WhatsAppIcon, XIcon } from '../Icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/colors';
import { formatPhoneNumber } from '../../utils/formatters';
import { PermissionStatus } from '../../types';

const DeniedIconContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${COLORS.errorLight};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${SPACING.lg};
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

interface PermissionDeniedScreenProps {
  phoneNumber: string;
  contactName?: string;
  status: PermissionStatus;
  reason?: string;
  onRequestAgain?: () => void;
  onCancel: () => void;
  canRequestAgain?: boolean;
}

const PermissionDeniedScreen: React.FC<PermissionDeniedScreenProps> = ({
  phoneNumber,
  contactName,
  status,
  reason,
  onRequestAgain,
  onCancel,
  canRequestAgain = false,
}) => {
  const getTitle = () => {
    switch (status) {
      case 'denied':
        return 'Permission Denied';
      case 'expired':
        return 'Permission Expired';
      case 'revoked':
        return 'Permission Revoked';
      case 'rate_limited':
        return 'Rate Limit Exceeded';
      default:
        return 'Cannot Call';
    }
  };

  const getDescription = () => {
    switch (status) {
      case 'denied':
        return 'The contact has declined your request to receive WhatsApp calls.';
      case 'expired':
        return 'The call permission has expired. You need to request permission again.';
      case 'revoked':
        return 'The permission was revoked due to multiple missed calls.';
      case 'rate_limited':
        return reason || 'You have exceeded the rate limit for permission requests. Please try again later.';
      default:
        return reason || 'Unable to make this call. Please try again later.';
    }
  };

  return (
    <WidgetContainer>
      <Header>
        <HeaderTitle>
          <WhatsAppIcon size={24} color="#fff" />
          {getTitle()}
        </HeaderTitle>
      </Header>

      <Content>
        <PermissionContainer>
          <DeniedIconContainer>
            <XIcon size={40} color={COLORS.errorDark} />
          </DeniedIconContainer>

          <PermissionTitle>{getTitle()}</PermissionTitle>

          {contactName && <ContactName>{contactName}</ContactName>}
          <PhoneNumber>{formatPhoneNumber(phoneNumber)}</PhoneNumber>

          <PermissionDescription>{getDescription()}</PermissionDescription>

          {status === 'denied' && (
            <AlertBox $variant="warning">
              <strong>Meta Policy:</strong> You can only send a new permission request
              after 24 hours. The contact can also choose to unblock calls in their
              WhatsApp settings.
            </AlertBox>
          )}

          {status === 'expired' && (
            <AlertBox $variant="info">
              Permissions expire after 90 days or 72 hours if no call was made.
              Request permission again to continue calling this contact.
            </AlertBox>
          )}

          {status === 'revoked' && (
            <AlertBox $variant="warning">
              Permission is automatically revoked after 4 consecutive missed calls.
              Request permission again once the contact is available.
            </AlertBox>
          )}

          {status === 'rate_limited' && (
            <AlertBox $variant="error">
              <strong>Rate Limit:</strong> You can only request permission once per 24 hours,
              with a maximum of 2 requests per 7 days per number.
            </AlertBox>
          )}
        </PermissionContainer>
      </Content>

      <Footer>
        <FlexColumn style={{ gap: SPACING.sm }}>
          {canRequestAgain && onRequestAgain && status !== 'rate_limited' && (
            <PrimaryButton onClick={onRequestAgain} style={{ width: '100%' }}>
              Request Permission Again
            </PrimaryButton>
          )}
          <SecondaryButton onClick={onCancel} style={{ width: '100%' }}>
            Back to Keypad
          </SecondaryButton>
        </FlexColumn>
      </Footer>
    </WidgetContainer>
  );
};

export default PermissionDeniedScreen;
