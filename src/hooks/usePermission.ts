/**
 * usePermission Hook - Meta WhatsApp Permission Management
 */

import { useState, useCallback } from 'react';
import apiService from '../services/api.service';
import { PermissionStatus, CallPermission } from '../types';

interface UsePermissionReturn {
  permissionStatus: PermissionStatus | null;
  permission: CallPermission | null;
  isChecking: boolean;
  isRequesting: boolean;
  canCall: boolean;
  error: string | null;
  reason: string | null;
  checkPermission: (phoneNumber: string) => Promise<void>;
  requestPermission: (phoneNumber: string, contactId: string) => Promise<void>;
  validatePermission: (phoneNumber: string) => Promise<boolean>;
  resetPermission: () => void;
}

export const usePermission = (): UsePermissionReturn => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [permission, setPermission] = useState<CallPermission | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [canCall, setCanCall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  /**
   * Check permission status for a phone number
   */
  const checkPermission = useCallback(async (phoneNumber: string) => {
    if (!phoneNumber) {
      setError('Phone number is required');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const response = await apiService.checkPermissionStatus(phoneNumber);

      if (response.permission) {
        setPermission(response.permission);
        setPermissionStatus(response.permission.permission_status as PermissionStatus);
        setCanCall(response.permission.permission_status === 'granted');
      } else {
        setPermissionStatus('not_found');
        setCanCall(false);
      }
    } catch (err: any) {
      console.error('Failed to check permission:', err);
      setError(err.message || 'Failed to check permission');
      setPermissionStatus(null);
      setCanCall(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Request permission for a phone number (Meta compliance)
   * Rate limited: 1 request per 24 hours, max 2 per 7 days
   */
  const requestPermission = useCallback(async (phoneNumber: string, contactId: string) => {
    if (!phoneNumber) {
      setError('Phone number is required');
      return;
    }

    if (!contactId) {
      setError('Contact ID is required');
      return;
    }

    setIsRequesting(true);
    setError(null);

    try {
      const response = await apiService.requestPermission(phoneNumber, contactId);

      if (response.status === 'rate_limited') {
        setError(response.error || 'Rate limit exceeded. You can only request permission once per 24 hours.');
        setPermissionStatus('rate_limited');
        setCanCall(false);
      } else if (response.status === 'sent' || response.status === 'pending') {
        setPermissionStatus('pending');
        setCanCall(false);
        if (response.permission) {
          setPermission(response.permission);
        }
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err: any) {
      console.error('Failed to request permission:', err);
      setError(err.message || 'Failed to request permission');
    } finally {
      setIsRequesting(false);
    }
  }, []);

  /**
   * Validate if a call can be made to a phone number
   * Checks permission status, call window, missed calls, etc.
   */
  const validatePermission = useCallback(async (phoneNumber: string): Promise<boolean> => {
    if (!phoneNumber) {
      setError('Phone number is required');
      return false;
    }

    setIsChecking(true);
    setError(null);
    setReason(null);

    try {
      const result = await apiService.validatePermission(phoneNumber);

      setCanCall(result.canCall);

      if (!result.canCall && result.reason) {
        setReason(result.reason);
      }

      if (result.permission) {
        setPermission(result.permission);
        setPermissionStatus(result.permission.permission_status as PermissionStatus);
      }

      return result.canCall;
    } catch (err: any) {
      console.error('Failed to validate permission:', err);
      setError(err.message || 'Failed to validate permission');
      setCanCall(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Reset permission state
   */
  const resetPermission = useCallback(() => {
    setPermissionStatus(null);
    setPermission(null);
    setCanCall(false);
    setError(null);
    setReason(null);
  }, []);

  return {
    permissionStatus,
    permission,
    isChecking,
    isRequesting,
    canCall,
    error,
    reason,
    checkPermission,
    requestPermission,
    validatePermission,
    resetPermission,
  };
};
