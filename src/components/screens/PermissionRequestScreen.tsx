/**
 * Permission Request Screen - Request Meta permission to call
 */

import React from 'react';
import styled from 'styled-components';
import {
  WidgetContainer,
  Header,
  HeaderTitle,
  Content,
  Footer,
  PrimaryButton,
  SecondaryButton,
  PermissionContainer,
  PermissionIcon,
  PermissionTitle,
  PermissionDescription,
  AlertBox,
  FlexColumn,
} from '../../theme/styled';
import { WhatsAppIcon, SendIcon, AlertIcon } from '../Icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/colors';
import { ScreenProps } from '../../types';
import { formatPhoneNumber } from '../../utils/formatters';

const InfoList = styled.ul`
  text-align: left;
  padding-left: ${SPACING.lg};
  margin: ${SPACING.md} 0;
  color: ${COLORS.battleship};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  line-height: ${TYPOGRAPHY.lineHeight.relaxed};
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

interface PermissionRequestScreenProps extends Partial<ScreenProps> {
  phoneNumber: string;
  contactName?: string;
  onRequestPermission: () => void;
  onCancel: () => void;
  isRequesting: boolean;
  error?: string | null;
}

const PermissionRequestScreen: React.FC<PermissionRequestScreenProps> = ({
  phoneNumber,
  contactName,
  onRequestPermission,
  onCancel,
  isRequesting,
  error,
}) => {
  return (
    <WidgetContainer>
      <Header>
        <HeaderTitle>
          <WhatsAppIcon size={24} color="#fff" />
          Permission Required
        </HeaderTitle>
      </Header>

      <Content>
        <PermissionContainer>
          <PermissionIcon $status="pending">
            <AlertIcon size={40} color={COLORS.warningDark} />
          </PermissionIcon>

          <PermissionTitle>Request Call Permission</PermissionTitle>

          {contactName && <ContactName>{contactName}</ContactName>}
          <PhoneNumber>{formatPhoneNumber(phoneNumber)}</PhoneNumber>

          <PermissionDescription>
            To comply with Meta's WhatsApp Business policies, you need to request
            permission before making calls.
          </PermissionDescription>

          <AlertBox $variant="info">
            <strong>What happens next:</strong>
            <InfoList>
              <li>A WhatsApp message will be sent to the contact</li>
              <li>They will tap "Accept" to grant permission</li>
              <li>You can then call them via WhatsApp</li>
              <li>Permission is valid for 90 days</li>
            </InfoList>
          </AlertBox>

          {error && (
            <AlertBox $variant="error" style={{ marginTop: SPACING.md }}>
              {error}
            </AlertBox>
          )}
        </PermissionContainer>
      </Content>

      <Footer>
        <FlexColumn style={{ gap: SPACING.sm }}>
          <PrimaryButton
            onClick={onRequestPermission}
            disabled={isRequesting}
            style={{ width: '100%' }}
          >
            <SendIcon size={18} color="#fff" />
            {isRequesting ? 'Sending Request...' : 'Send Permission Request'}
          </PrimaryButton>
          <SecondaryButton onClick={onCancel} style={{ width: '100%' }}>
            Cancel
          </SecondaryButton>
        </FlexColumn>
      </Footer>
    </WidgetContainer>
  );
};

export default PermissionRequestScreen;
