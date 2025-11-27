/**
 * Calling Screen - Active call in progress
 */

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import {
  WidgetContainer,
  Header,
  HeaderTitle,
  Content,
  CallInfoContainer,
  Avatar,
  CallerName,
  CallerNumber,
  CallDuration,
  ActionButtonsContainer,
  IconButton,
  KeypadGrid,
  KeypadButton,
  TextArea,
  FormGroup,
  Label,
  FlexRow,
} from '../../theme/styled';
import {
  WhatsAppIcon,
  PhoneOffIcon,
  MicIcon,
  MicOffIcon,
  KeypadIcon,
  RecordIcon,
  NoteIcon,
} from '../Icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/colors';
import { formatPhoneNumber, getInitials } from '../../utils/formatters';
import { Direction } from '../../types';

const DTMF_BUTTONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.xs};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.success};
  margin-bottom: ${SPACING.sm};

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    background: ${COLORS.success};
    border-radius: 50%;
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
  margin-bottom: ${SPACING.md};
`;

const CallControls = styled.div`
  display: flex;
  justify-content: center;
  gap: ${SPACING.md};
  margin-bottom: ${SPACING.lg};
`;

const ControlButton = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: ${SPACING.sm};
  background: ${({ $active }) => ($active ? COLORS.primary : COLORS.gypsum)};
  color: ${({ $active }) => ($active ? COLORS.olaf : COLORS.obsidian)};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 64px;

  &:hover {
    background: ${({ $active }) => ($active ? COLORS.primaryDark : COLORS.koala)};
  }

  span {
    font-size: ${TYPOGRAPHY.fontSize.xs};
  }
`;

const DTMFKeypad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${SPACING.xs};
  max-width: 200px;
  margin: ${SPACING.md} auto;
`;

const DTMFButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: ${COLORS.gypsum};
  color: ${COLORS.obsidian};
  font-size: ${TYPOGRAPHY.fontSize.lg};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${COLORS.koala};
  }

  &:active {
    background: ${COLORS.manatee};
    transform: scale(0.95);
  }
`;

const NotesSection = styled.div`
  margin-top: ${SPACING.md};
  padding: ${SPACING.md};
  background: ${COLORS.gypsum};
  border-radius: 8px;
`;

interface CallingScreenProps {
  phoneNumber: string;
  contactName?: string;
  duration: string;
  direction: Direction;
  onEndCall: () => void;
  onMute: (muted: boolean) => void;
  onSendDTMF: (digit: string) => void;
  isMuted: boolean;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  notes: string;
  setNotes: (notes: string) => void;
}

const CallingScreen: React.FC<CallingScreenProps> = ({
  phoneNumber,
  contactName,
  duration,
  direction,
  onEndCall,
  onMute,
  onSendDTMF,
  isMuted,
  isRecording,
  setIsRecording,
  notes,
  setNotes,
}) => {
  const [showKeypad, setShowKeypad] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const displayName = contactName || formatPhoneNumber(phoneNumber);
  const initials = getInitials(contactName || phoneNumber.slice(-4));

  const handleMuteToggle = useCallback(() => {
    onMute(!isMuted);
  }, [isMuted, onMute]);

  const handleRecordToggle = useCallback(() => {
    setIsRecording(!isRecording);
  }, [isRecording, setIsRecording]);

  const handleKeypadToggle = useCallback(() => {
    setShowKeypad(!showKeypad);
    if (showNotes) setShowNotes(false);
  }, [showKeypad, showNotes]);

  const handleNotesToggle = useCallback(() => {
    setShowNotes(!showNotes);
    if (showKeypad) setShowKeypad(false);
  }, [showNotes, showKeypad]);

  return (
    <WidgetContainer>
      <Header $variant="calling">
        <HeaderTitle>
          <WhatsAppIcon size={24} color="#fff" />
          {direction === 'INBOUND' ? 'Incoming Call' : 'Outgoing Call'}
        </HeaderTitle>
      </Header>

      <Content>
        <CallInfoContainer>
          <WhatsAppBadge>
            <WhatsAppIcon size={14} color="#fff" />
            WhatsApp Call
          </WhatsAppBadge>

          <Avatar $size="lg">{initials}</Avatar>

          <CallerName>{displayName}</CallerName>
          {contactName && <CallerNumber>{formatPhoneNumber(phoneNumber)}</CallerNumber>}

          <ConnectionStatus>Connected</ConnectionStatus>

          <CallDuration>{duration}</CallDuration>
        </CallInfoContainer>

        <CallControls>
          <ControlButton $active={isMuted} onClick={handleMuteToggle}>
            {isMuted ? <MicOffIcon size={20} /> : <MicIcon size={20} />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </ControlButton>

          <ControlButton $active={showKeypad} onClick={handleKeypadToggle}>
            <KeypadIcon size={20} />
            <span>Keypad</span>
          </ControlButton>

          <ControlButton $active={isRecording} onClick={handleRecordToggle}>
            <RecordIcon size={20} color={isRecording ? COLORS.error : undefined} />
            <span>{isRecording ? 'Stop' : 'Record'}</span>
          </ControlButton>

          <ControlButton $active={showNotes} onClick={handleNotesToggle}>
            <NoteIcon size={20} />
            <span>Notes</span>
          </ControlButton>
        </CallControls>

        {showKeypad && (
          <DTMFKeypad>
            {DTMF_BUTTONS.map((digit) => (
              <DTMFButton key={digit} onClick={() => onSendDTMF(digit)}>
                {digit}
              </DTMFButton>
            ))}
          </DTMFKeypad>
        )}

        {showNotes && (
          <NotesSection>
            <FormGroup>
              <Label>Call Notes</Label>
              <TextArea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this call..."
                rows={4}
              />
            </FormGroup>
          </NotesSection>
        )}
      </Content>

      <ActionButtonsContainer>
        <IconButton $variant="danger" onClick={onEndCall} title="End Call">
          <PhoneOffIcon size={28} color="#fff" />
        </IconButton>
      </ActionButtonsContainer>
    </WidgetContainer>
  );
};

export default CallingScreen;
