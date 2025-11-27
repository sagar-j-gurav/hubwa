/**
 * Login Screen Component
 */

import React from 'react';
import styled from 'styled-components';
import {
  WidgetContainer,
  Header,
  HeaderTitle,
  Content,
  PrimaryButton,
  FlexColumn,
  AlertBox,
} from '../../theme/styled';
import { WhatsAppIcon, HubSpotIcon, UserIcon } from '../Icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/colors';
import { ScreenProps, ScreenNames } from '../../types';

// Check if in standalone mode
const isStandaloneMode = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('standalone') === 'true') return true;
  try {
    if (window.self === window.top) return true;
  } catch (e) {
    return false;
  }
  return false;
};

const DEV_MODE = isStandaloneMode();

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: ${SPACING.xl};
  text-align: center;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const PlusSign = styled.span`
  font-size: 32px;
  color: ${COLORS.flint};
  font-weight: 300;
`;

const Title = styled.h1`
  font-size: ${TYPOGRAPHY.fontSize.xl};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  color: ${COLORS.obsidian};
  margin-bottom: ${SPACING.sm};
`;

const Subtitle = styled.p`
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${COLORS.battleship};
  margin-bottom: ${SPACING.xl};
  line-height: ${TYPOGRAPHY.lineHeight.relaxed};
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 ${SPACING.xl};
  text-align: left;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  padding: ${SPACING.sm} 0;
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.battleship};

  &::before {
    content: '✓';
    color: ${COLORS.success};
    font-weight: bold;
  }
`;

interface LoginScreenProps extends Partial<ScreenProps> {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <WidgetContainer>
      <Header>
        <HeaderTitle>
          <WhatsAppIcon size={24} color="#fff" />
          WhatsApp Calling
        </HeaderTitle>
      </Header>
      <Content>
        {DEV_MODE && (
          <AlertBox $variant="warning" style={{ marginBottom: SPACING.md }}>
            <strong>Standalone Mode</strong>
            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
              Testing without HubSpot. Backend: {process.env.REACT_APP_API_URL || 'http://localhost:3000'}
            </p>
          </AlertBox>
        )}
        <LoginContainer>
          <LogoContainer>
            <HubSpotIcon size={56} />
            <PlusSign>+</PlusSign>
            <WhatsAppIcon size={56} />
          </LogoContainer>

          <Title>HubSpot WhatsApp Calling</Title>
          <Subtitle>
            Make and receive WhatsApp calls directly from HubSpot CRM
          </Subtitle>

          <FeatureList>
            <FeatureItem>Call contacts via WhatsApp</FeatureItem>
            <FeatureItem>Receive incoming WhatsApp calls</FeatureItem>
            <FeatureItem>Auto-logging to CRM</FeatureItem>
            <FeatureItem>Call recordings & transcriptions</FeatureItem>
            <FeatureItem>Meta-compliant permissions</FeatureItem>
          </FeatureList>

          <PrimaryButton onClick={onLogin} style={{ width: '100%' }}>
            <UserIcon size={20} color="#fff" />
            {DEV_MODE ? 'Start Testing (Dev Mode)' : 'Login to Start Calling'}
          </PrimaryButton>
        </LoginContainer>
      </Content>
    </WidgetContainer>
  );
};

export default LoginScreen;
