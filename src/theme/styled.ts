import styled, { css, keyframes } from 'styled-components';
import { COLORS, SHADOWS, RADIUS, SPACING, TYPOGRAPHY } from './colors';

// Animations
export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

export const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

export const ring = keyframes`
  0% { transform: rotate(0deg); }
  10% { transform: rotate(15deg); }
  20% { transform: rotate(-15deg); }
  30% { transform: rotate(15deg); }
  40% { transform: rotate(-15deg); }
  50% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
`;

// Container
export const WidgetContainer = styled.div`
  width: 400px;
  min-height: 600px;
  max-height: 650px;
  background: ${COLORS.olaf};
  border-radius: ${RADIUS.lg};
  box-shadow: ${SHADOWS.xl};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: ${TYPOGRAPHY.fontFamily};
  animation: ${fadeIn} 0.3s ease;
`;

// Header
export const Header = styled.header<{ $variant?: 'default' | 'calling' | 'incoming' }>`
  padding: ${SPACING.md} ${SPACING.lg};
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'calling': return `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%)`;
      case 'incoming': return `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`;
      default: return `linear-gradient(135deg, ${COLORS.obsidian} 0%, ${COLORS.slinky} 100%)`;
    }
  }};
  color: ${COLORS.olaf};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const HeaderTitle = styled.h1`
  font-size: ${TYPOGRAPHY.fontSize.lg};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
`;

export const HeaderSubtitle = styled.span`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  opacity: 0.9;
`;

// Content Area
export const Content = styled.main`
  flex: 1;
  padding: ${SPACING.lg};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

// Footer
export const Footer = styled.footer`
  padding: ${SPACING.md} ${SPACING.lg};
  background: ${COLORS.gypsum};
  border-top: 1px solid ${COLORS.koala};
`;

// Buttons
const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.sm};
  padding: ${SPACING.sm} ${SPACING.md};
  font-family: ${TYPOGRAPHY.fontFamily};
  font-size: ${TYPOGRAPHY.fontSize.md};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  border-radius: ${RADIUS.md};
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PrimaryButton = styled.button`
  ${buttonBase}
  background: ${COLORS.primary};
  color: ${COLORS.olaf};

  &:hover:not(:disabled) {
    background: ${COLORS.primaryDark};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

export const SecondaryButton = styled.button`
  ${buttonBase}
  background: ${COLORS.olaf};
  color: ${COLORS.obsidian};
  border: 2px solid ${COLORS.koala};

  &:hover:not(:disabled) {
    border-color: ${COLORS.flint};
    background: ${COLORS.gypsum};
  }
`;

export const SuccessButton = styled.button`
  ${buttonBase}
  background: ${COLORS.success};
  color: ${COLORS.olaf};

  &:hover:not(:disabled) {
    background: ${COLORS.successDark};
  }
`;

export const DangerButton = styled.button`
  ${buttonBase}
  background: ${COLORS.error};
  color: ${COLORS.olaf};

  &:hover:not(:disabled) {
    background: ${COLORS.errorDark};
  }
`;

export const IconButton = styled.button<{ $variant?: 'default' | 'success' | 'danger' | 'primary' }>`
  ${buttonBase}
  width: 56px;
  height: 56px;
  padding: 0;
  border-radius: ${RADIUS.full};
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'success': return COLORS.success;
      case 'danger': return COLORS.error;
      case 'primary': return COLORS.primary;
      default: return COLORS.gypsum;
    }
  }};
  color: ${({ $variant }) => $variant === 'default' ? COLORS.obsidian : COLORS.olaf};

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: ${SHADOWS.md};
  }
`;

// Keypad
export const KeypadGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${SPACING.sm};
  max-width: 300px;
  margin: 0 auto;
`;

export const KeypadButton = styled.button`
  width: 72px;
  height: 72px;
  border-radius: ${RADIUS.full};
  border: none;
  background: ${COLORS.gypsum};
  color: ${COLORS.obsidian};
  font-family: ${TYPOGRAPHY.fontFamily};
  font-size: ${TYPOGRAPHY.fontSize.xl};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  span {
    font-size: ${TYPOGRAPHY.fontSize.xs};
    color: ${COLORS.flint};
    margin-top: 2px;
  }

  &:hover {
    background: ${COLORS.koala};
  }

  &:active {
    background: ${COLORS.manatee};
    transform: scale(0.95);
  }
`;

// Phone Input
export const PhoneInputContainer = styled.div`
  background: ${COLORS.gypsum};
  border-radius: ${RADIUS.lg};
  padding: ${SPACING.md};
  margin-bottom: ${SPACING.lg};
`;

export const PhoneInput = styled.input`
  width: 100%;
  border: none;
  background: transparent;
  font-family: ${TYPOGRAPHY.fontFamily};
  font-size: ${TYPOGRAPHY.fontSize.xxl};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  color: ${COLORS.obsidian};
  text-align: center;
  outline: none;

  &::placeholder {
    color: ${COLORS.manatee};
  }
`;

// Status Badge
export const StatusBadge = styled.span<{ $status: 'success' | 'warning' | 'error' | 'info' | 'default' }>`
  display: inline-flex;
  align-items: center;
  gap: ${SPACING.xs};
  padding: ${SPACING.xs} ${SPACING.sm};
  border-radius: ${RADIUS.full};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  background: ${({ $status }) => {
    switch ($status) {
      case 'success': return COLORS.successLight;
      case 'warning': return COLORS.warningLight;
      case 'error': return COLORS.errorLight;
      case 'info': return COLORS.infoLight;
      default: return COLORS.koala;
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case 'success': return COLORS.successDark;
      case 'warning': return COLORS.warningDark;
      case 'error': return COLORS.errorDark;
      case 'info': return COLORS.infoDark;
      default: return COLORS.battleship;
    }
  }};
`;

// Avatar
export const Avatar = styled.div<{ $size?: 'sm' | 'md' | 'lg' }>`
  width: ${({ $size }) => {
    switch ($size) {
      case 'sm': return '40px';
      case 'lg': return '80px';
      default: return '56px';
    }
  }};
  height: ${({ $size }) => {
    switch ($size) {
      case 'sm': return '40px';
      case 'lg': return '80px';
      default: return '56px';
    }
  }};
  border-radius: ${RADIUS.full};
  background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%);
  color: ${COLORS.olaf};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $size }) => {
    switch ($size) {
      case 'sm': return TYPOGRAPHY.fontSize.md;
      case 'lg': return TYPOGRAPHY.fontSize.xxl;
      default: return TYPOGRAPHY.fontSize.xl;
    }
  }};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
`;

// Call Info
export const CallInfoContainer = styled.div`
  text-align: center;
  padding: ${SPACING.lg};
`;

export const CallerName = styled.h2`
  font-size: ${TYPOGRAPHY.fontSize.xl};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  color: ${COLORS.obsidian};
  margin: ${SPACING.md} 0 ${SPACING.xs};
`;

export const CallerNumber = styled.p`
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${COLORS.battleship};
  margin: 0;
`;

export const CallDuration = styled.div`
  font-size: ${TYPOGRAPHY.fontSize.xxl};
  font-weight: ${TYPOGRAPHY.fontWeight.light};
  color: ${COLORS.success};
  margin: ${SPACING.lg} 0;
  font-variant-numeric: tabular-nums;
`;

export const CallStatus = styled.p<{ $status?: 'connecting' | 'ringing' | 'connected' | 'ended' }>`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${({ $status }) => {
    switch ($status) {
      case 'connecting': return COLORS.info;
      case 'ringing': return COLORS.warning;
      case 'connected': return COLORS.success;
      case 'ended': return COLORS.flint;
      default: return COLORS.battleship;
    }
  }};
  margin: ${SPACING.sm} 0;
`;

// Action Buttons Container
export const ActionButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: ${SPACING.lg};
  padding: ${SPACING.lg};
`;

// Dropdown / Select
export const Select = styled.select`
  width: 100%;
  padding: ${SPACING.sm} ${SPACING.md};
  border: 2px solid ${COLORS.koala};
  border-radius: ${RADIUS.md};
  font-family: ${TYPOGRAPHY.fontFamily};
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${COLORS.obsidian};
  background: ${COLORS.olaf};
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: ${COLORS.primary};
  }
`;

// Text Input
export const TextInput = styled.input`
  width: 100%;
  padding: ${SPACING.sm} ${SPACING.md};
  border: 2px solid ${COLORS.koala};
  border-radius: ${RADIUS.md};
  font-family: ${TYPOGRAPHY.fontFamily};
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${COLORS.obsidian};
  background: ${COLORS.olaf};
  outline: none;

  &:focus {
    border-color: ${COLORS.primary};
  }

  &::placeholder {
    color: ${COLORS.manatee};
  }
`;

// TextArea
export const TextArea = styled.textarea`
  width: 100%;
  padding: ${SPACING.sm} ${SPACING.md};
  border: 2px solid ${COLORS.koala};
  border-radius: ${RADIUS.md};
  font-family: ${TYPOGRAPHY.fontFamily};
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${COLORS.obsidian};
  background: ${COLORS.olaf};
  outline: none;
  resize: vertical;
  min-height: 80px;

  &:focus {
    border-color: ${COLORS.primary};
  }

  &::placeholder {
    color: ${COLORS.manatee};
  }
`;

// Permission Status
export const PermissionContainer = styled.div`
  text-align: center;
  padding: ${SPACING.xl};
`;

export const PermissionIcon = styled.div<{ $status: 'granted' | 'pending' | 'denied' | 'expired' }>`
  width: 80px;
  height: 80px;
  border-radius: ${RADIUS.full};
  margin: 0 auto ${SPACING.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  background: ${({ $status }) => {
    switch ($status) {
      case 'granted': return COLORS.successLight;
      case 'pending': return COLORS.warningLight;
      case 'denied': return COLORS.errorLight;
      default: return COLORS.koala;
    }
  }};
`;

export const PermissionTitle = styled.h2`
  font-size: ${TYPOGRAPHY.fontSize.xl};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  color: ${COLORS.obsidian};
  margin-bottom: ${SPACING.sm};
`;

export const PermissionDescription = styled.p`
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${COLORS.battleship};
  margin-bottom: ${SPACING.lg};
  line-height: ${TYPOGRAPHY.lineHeight.relaxed};
`;

// Loading Spinner
export const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${SPACING.xl};
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${COLORS.koala};
  border-top-color: ${COLORS.primary};
  border-radius: ${RADIUS.full};
  animation: ${spin} 0.8s linear infinite;
`;

export const LoadingText = styled.p`
  margin-top: ${SPACING.md};
  color: ${COLORS.battleship};
  font-size: ${TYPOGRAPHY.fontSize.md};
`;

// WhatsApp Badge
export const WhatsAppBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${SPACING.xs};
  padding: ${SPACING.xs} ${SPACING.sm};
  background: ${COLORS.whatsappGreen};
  color: ${COLORS.olaf};
  border-radius: ${RADIUS.md};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
`;

// Alert/Info Box
export const AlertBox = styled.div<{ $variant?: 'info' | 'warning' | 'error' | 'success' }>`
  padding: ${SPACING.md};
  border-radius: ${RADIUS.md};
  margin-bottom: ${SPACING.md};
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'success': return COLORS.successLight;
      case 'warning': return COLORS.warningLight;
      case 'error': return COLORS.errorLight;
      default: return COLORS.infoLight;
    }
  }};
  border-left: 4px solid ${({ $variant }) => {
    switch ($variant) {
      case 'success': return COLORS.success;
      case 'warning': return COLORS.warning;
      case 'error': return COLORS.error;
      default: return COLORS.info;
    }
  }};
  color: ${COLORS.obsidian};
  font-size: ${TYPOGRAPHY.fontSize.sm};
`;

// Divider
export const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${COLORS.koala};
  margin: ${SPACING.md} 0;
`;

// Label
export const Label = styled.label`
  display: block;
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  color: ${COLORS.obsidian};
  margin-bottom: ${SPACING.xs};
`;

// Form Group
export const FormGroup = styled.div`
  margin-bottom: ${SPACING.md};
`;

// Flex utilities
export const FlexRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
`;

export const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.sm};
`;

export const FlexCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const FlexBetween = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
