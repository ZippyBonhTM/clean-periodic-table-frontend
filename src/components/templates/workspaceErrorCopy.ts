import type { AuthTextCatalog } from '@/components/organisms/auth/authText';
import {
  AUTH_SESSION_GENERIC_ERROR_MESSAGE,
  AUTH_SESSION_NETWORK_ERROR_MESSAGE,
  ELEMENTS_GENERIC_ERROR_MESSAGE,
  ELEMENTS_NETWORK_ERROR_MESSAGE,
  SAVED_MOLECULES_GENERIC_ERROR_MESSAGE,
  SAVED_MOLECULES_NETWORK_ERROR_MESSAGE,
  SESSION_EXPIRED_ERROR_MESSAGE,
} from '@/shared/hooks/hookErrorMessages';

export function resolveSessionWorkspaceMessage(
  message: string | null,
  text: AuthTextCatalog,
): string {
  if (message === null || message === AUTH_SESSION_GENERIC_ERROR_MESSAGE) {
    return text.workspace.sessionVerificationFailed;
  }

  if (message === AUTH_SESSION_NETWORK_ERROR_MESSAGE) {
    return text.workspace.sessionVerificationFailedNetwork;
  }

  if (message === SESSION_EXPIRED_ERROR_MESSAGE) {
    return text.workspace.sessionExpired;
  }

  return message;
}

export function resolveElementsWorkspaceMessage(
  message: string | null,
  text: AuthTextCatalog,
): string | null {
  if (message === null) {
    return null;
  }

  if (message === ELEMENTS_NETWORK_ERROR_MESSAGE) {
    return text.workspace.loadingElementsFailedNetwork;
  }

  if (message === ELEMENTS_GENERIC_ERROR_MESSAGE) {
    return text.workspace.loadingElementsFailed;
  }

  if (message === SESSION_EXPIRED_ERROR_MESSAGE) {
    return text.workspace.sessionExpired;
  }

  return message;
}

export function resolveSavedMoleculesWorkspaceMessage(
  message: string | null,
  text: AuthTextCatalog,
): string | null {
  if (message === null) {
    return null;
  }

  if (message === SAVED_MOLECULES_NETWORK_ERROR_MESSAGE) {
    return text.workspace.loadingSavedMoleculesFailedNetwork;
  }

  if (message === SAVED_MOLECULES_GENERIC_ERROR_MESSAGE) {
    return text.workspace.loadingSavedMoleculesFailed;
  }

  if (message === SESSION_EXPIRED_ERROR_MESSAGE) {
    return text.workspace.sessionExpired;
  }

  return message;
}
