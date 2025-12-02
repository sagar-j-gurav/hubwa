/**
 * Call Ended Screen - Call summary and save options
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import {
  WidgetContainer,
  Header,
  HeaderTitle,
  Content,
  Footer,
  CallInfoContainer,
  Avatar,
  CallerName,
  CallerNumber,
  TextArea,
  FormGroup,
  Label,
  PrimaryButton,
  SecondaryButton,
  FlexColumn,
  FlexRow,
  Select,
  StatusBadge,
} from '../../theme/styled';
import { WhatsAppIcon, CheckIcon, ClockIcon, PhoneIcon } from '../Icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/colors';
import { formatPhoneNumber, getInitials, formatDuration } from '../../utils/formatters';
import { Direction, CallStatus } from '../../types';

const SummaryCard = styled.div`
  background: ${COLORS.gypsum};
  border-radius: 8px;
  padding: ${SPACING.md};
  margin-bottom: ${SPACING.md};
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${SPACING.xs} 0;

  &:not(:last-child) {
    border-bottom: 1px solid ${COLORS.koala};
  }
`;

const SummaryLabel = styled.span`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.battleship};
`;

const SummaryValue = styled.span`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  color: ${COLORS.obsidian};
`;

const OutcomeSelect = styled(Select)`
  margin-top: ${SPACING.xs};
`;

const CALL_OUTCOMES = [
  { value: 'connected', label: 'Connected' },
  { value: 'left_voicemail', label: 'Left Voicemail' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'busy', label: 'Busy' },
  { value: 'wrong_number', label: 'Wrong Number' },
  { value: 'connected_rescheduled', label: 'Connected - Rescheduled' },
];

interface CallEndedScreenProps {
  phoneNumber: string;
  contactName?: string;
  duration: number;
  direction: Direction;
  callStatus: CallStatus | null;
  notes: string;
  setNotes: (notes: string) => void;
  isRecorded: boolean;
  onSave: (outcome: string) => void;
  onDiscard: () => void;
}

const CallEndedScreen: React.FC<CallEndedScreenProps> = ({
  phoneNumber,
  contactName,
  duration,
  direction,
  callStatus,
  notes,
  setNotes,
  isRecorded,
  onSave,
  onDiscard,
}) => {
  // Auto-select outcome based on call status
  const getInitialOutcome = () => {
    switch (callStatus) {
      case 'completed':
        return duration > 0 ? 'connected' : 'no_answer';
      case 'no-answer':
        return 'no_answer';
      case 'busy':
        return 'busy';
      case 'failed':
        return 'no_answer';
      case 'canceled':
        return 'no_answer';
      default:
        return 'connected';
    }
  };

  const [outcome, setOutcome] = useState(getInitialOutcome());

  const displayName = contactName || formatPhoneNumber(phoneNumber);
  // Use '?' for initials if no contact name (avoid showing just digits)
  const initials = contactName ? getInitials(contactName) : '?';

  const getStatusBadge = () => {
    switch (callStatus) {
      case 'completed':
        return <StatusBadge $status="success">Completed</StatusBadge>;
      case 'no-answer':
        return <StatusBadge $status="warning">No Answer</StatusBadge>;
      case 'busy':
        return <StatusBadge $status="warning">Busy</StatusBadge>;
      case 'failed':
        return <StatusBadge $status="error">Failed</StatusBadge>;
      case 'canceled':
        return <StatusBadge $status="default">Canceled</StatusBadge>;
      default:
        return <StatusBadge $status="default">Ended</StatusBadge>;
    }
  };

  const handleSave = () => {
    onSave(outcome);
  };

  return (
    <WidgetContainer>
      <Header>
        <HeaderTitle>
          <WhatsAppIcon size={24} color="#fff" />
          Call Ended
        </HeaderTitle>
      </Header>

      <Content>
        <CallInfoContainer style={{ paddingBottom: 0 }}>
          <Avatar $size="md">{initials}</Avatar>
          <CallerName style={{ fontSize: TYPOGRAPHY.fontSize.lg }}>{displayName}</CallerName>
          {contactName && (
            <CallerNumber style={{ marginBottom: SPACING.md }}>
              {formatPhoneNumber(phoneNumber)}
            </CallerNumber>
          )}
        </CallInfoContainer>

        <SummaryCard>
          <SummaryRow>
            <SummaryLabel>Status</SummaryLabel>
            {getStatusBadge()}
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Direction</SummaryLabel>
            <SummaryValue>
              {direction === 'INBOUND' ? 'Incoming' : 'Outgoing'}
            </SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Duration</SummaryLabel>
            <FlexRow style={{ gap: SPACING.xs }}>
              <ClockIcon size={14} color={COLORS.battleship} />
              <SummaryValue>{formatDuration(duration)}</SummaryValue>
            </FlexRow>
          </SummaryRow>
          {isRecorded && (
            <SummaryRow>
              <SummaryLabel>Recording</SummaryLabel>
              <StatusBadge $status="success">Saved</StatusBadge>
            </SummaryRow>
          )}
        </SummaryCard>

        <FormGroup>
          <Label>Call Outcome</Label>
          <OutcomeSelect
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          >
            {CALL_OUTCOMES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </OutcomeSelect>
        </FormGroup>

        <FormGroup>
          <Label>Notes</Label>
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this call..."
            rows={4}
          />
        </FormGroup>
      </Content>

      <Footer>
        <FlexColumn style={{ gap: SPACING.sm }}>
          <PrimaryButton onClick={handleSave} style={{ width: '100%' }}>
            <CheckIcon size={18} color="#fff" />
            Save & Log to HubSpot
          </PrimaryButton>
          <SecondaryButton onClick={onDiscard} style={{ width: '100%' }}>
            Discard
          </SecondaryButton>
        </FlexColumn>
      </Footer>
    </WidgetContainer>
  );
};

export default CallEndedScreen;
