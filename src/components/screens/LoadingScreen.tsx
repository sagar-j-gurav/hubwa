/**
 * Loading Screen Component
 */

import React from 'react';
import {
  WidgetContainer,
  Content,
  SpinnerContainer,
  Spinner,
  LoadingText,
} from '../../theme/styled';
import { WhatsAppIcon, HubSpotIcon } from '../Icons';
import { COLORS } from '../../theme/colors';
import styled from 'styled-components';

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const PlusSign = styled.span`
  font-size: 24px;
  color: ${COLORS.flint};
  font-weight: 300;
`;

const LoadingScreen: React.FC = () => {
  return (
    <WidgetContainer>
      <Content style={{ justifyContent: 'center', alignItems: 'center' }}>
        <SpinnerContainer>
          <LogoContainer>
            <HubSpotIcon size={48} />
            <PlusSign>+</PlusSign>
            <WhatsAppIcon size={48} />
          </LogoContainer>
          <Spinner />
          <LoadingText>Connecting to HubSpot...</LoadingText>
        </SpinnerContainer>
      </Content>
    </WidgetContainer>
  );
};

export default LoadingScreen;
