import {
  on,
  off,
  type BiometryTokenUpdateStatus,
  type BiometryAuthRequestStatus,
  type EventListener,
  type EventPayload,
} from '@telegram-apps/bridge';
import { isPageReload } from '@telegram-apps/navigation';
import { getStorageValue, setStorageValue } from '@telegram-apps/toolkit';
import { AbortablePromise } from 'better-promises';

import { postEvent, request } from '@/globals.js';
import { defineMountFn } from '@/scopes/defineMountFn.js';
import { createIsSupported } from '@/scopes/createIsSupported.js';
import { createWrapComplete } from '@/scopes/wrappers/createWrapComplete.js';
import { createWrapSupported } from '@/scopes/wrappers/createWrapSupported.js';
import { defineNonConcurrentFn } from '@/scopes/defineNonConcurrentFn.js';
import { NotAvailableError } from '@/errors.js';

import { _state } from './signals.js';
import { requestBiometry } from './requestBiometry.js';
import type {
  State,
  AuthenticateOptions,
  RequestAccessOptions,
  UpdateTokenOptions,
} from './types.js';
import { signalCancel } from '@/scopes/signalCancel.js';

type StorageValue = State;

const COMPONENT_NAME = 'biometry';
const REQUEST_AUTH_METHOD = 'web_app_biometry_request_auth';
const INFO_RECEIVED_EVENT = 'biometry_info_received';

const onBiometryInfoReceived: EventListener<'biometry_info_received'> = e => {
  setState(eventToState(e));
};

function throwNotAvailable(): never {
  throw new NotAvailableError('Biometry is not available');
}

/**
 * Converts `biometry_info_received` to some common shape.
 * @param event - event payload.
 * @see biometry_info_received
 */
function eventToState(event: EventPayload<'biometry_info_received'>): State {
  let available = false;
  let tokenSaved = false;
  let deviceId = '';
  let accessRequested = false;
  let type = '';
  let accessGranted = false;
  if (event.available) {
    available = true;
    tokenSaved = event.token_saved;
    deviceId = event.device_id;
    accessRequested = event.access_requested;
    type = event.type;
    accessGranted = event.access_granted;
  }
  return { available, tokenSaved, deviceId, type, accessGranted, accessRequested };
}

/**
 * @returns True if the biometry manager is supported.
 */
export const isSupported = createIsSupported(REQUEST_AUTH_METHOD);

const [
  mountFn,
  tMountPromise,
  tMountError,
  tIsMounted,
] = defineMountFn(
  COMPONENT_NAME,
  abortSignal => {
    const s = isPageReload() && getStorageValue<StorageValue>(COMPONENT_NAME);
    return s ? AbortablePromise.resolve(s) : requestBiometry({ abortSignal }).then(eventToState);
  },
  s => {
    on(INFO_RECEIVED_EVENT, onBiometryInfoReceived);
    setState(s);
  },
);

const wrapSupported = createWrapSupported(COMPONENT_NAME, REQUEST_AUTH_METHOD);
const wrapComplete = createWrapComplete(COMPONENT_NAME, tIsMounted[0], REQUEST_AUTH_METHOD);

/**
 * Mounts the Biometry component.
 * @since Mini Apps v7.2
 * @throws {FunctionNotAvailableError} The environment is unknown
 * @throws {FunctionNotAvailableError} The SDK is not initialized
 * @throws {FunctionNotAvailableError} The function is not supported
 * @example
 * if (mount.isAvailable()) {
 *   await mount();
 * }
 */
export const mount = wrapSupported('mount', mountFn);
export const [, mountPromise, isMounting] = tMountPromise;
export const [, mountError] = tMountError;
export const [_isMounted, isMounted] = tIsMounted;

const [
  authFn,
  tAuthPromise,
  tAuthError,
] = defineNonConcurrentFn(
  (options?: AuthenticateOptions): AbortablePromise<{
    /**
     * Authentication status.
     */
    status: BiometryAuthRequestStatus;
    /**
     * Token from the local secure storage saved previously.
     */
    token?: string;
  }> => {
    return AbortablePromise.fn(async context => {
      const s = _state();
      if (!s.available) {
        throwNotAvailable();
      }
      const data = await request(REQUEST_AUTH_METHOD, 'biometry_auth_requested', {
        ...options,
        ...context,
        params: { reason: ((options || {}).reason || '').trim() },
      });
      const { token } = data;
      if (typeof token === 'string') {
        setState({ ...s, token });
      }
      return data;
    }, options);
  },
  'Biometry authentication is already in progress',
);

/**
 * Attempts to authenticate a user using biometrics and fetch a previously stored secure token.
 * @param options - method options.
 * @since Mini Apps v7.2
 * @returns Token from the local secure storage saved previously or undefined.
 * @throws {FunctionNotAvailableError} The environment is unknown
 * @throws {FunctionNotAvailableError} The SDK is not initialized
 * @throws {FunctionNotAvailableError} The function is not supported
 * @throws {FunctionNotAvailableError} The parent component is not mounted
 * @throws {ConcurrentCallError} Biometry authentication is already in progress
 * @throws {NotAvailableError} Biometry is not available
 * @example
 * if (authenticate.isAvailable()) {
 *   const { status, token } = await authenticate({
 *     reason: 'Authenticate to open wallet',
 *   });
 * }
 */
export const authenticate = wrapComplete('authenticate', authFn);
export const [, authPromise, isAuthenticating] = tAuthPromise;
export const [, authError] = tAuthError;

/**
 * Opens the biometric access settings for bots. Useful when you need to request biometrics
 * access to users who haven't granted it yet.
 *
 * _Note that this method can be called only in response to user interaction with the Mini App
 * interface (e.g. a click inside the Mini App or on the main button)_.
 * @since Mini Apps v7.2
 * @throws {FunctionNotAvailableError} The environment is unknown
 * @throws {FunctionNotAvailableError} The SDK is not initialized
 * @throws {FunctionNotAvailableError} The function is not supported
 * @example
 * if (openSettings.isAvailable()) {
 *   openSettings();
 * }
 */
export const openSettings = wrapSupported('openSettings', (): void => {
  postEvent('web_app_biometry_open_settings');
});

const [
  requestAccessFn,
  tRequestAccessPromise,
  tRequestAccessError,
] = defineNonConcurrentFn(
  (options?: RequestAccessOptions): AbortablePromise<boolean> => {
    return AbortablePromise.fn(async context => {
      const data = await request('web_app_biometry_request_access', INFO_RECEIVED_EVENT, {
        ...options,
        ...context,
        params: { reason: (options || {}).reason || '' },
      }).then(eventToState);

      if (!data.available) {
        throwNotAvailable();
      }
      setState(data);

      return data.accessGranted;
    }, options);
  },
  'Biometry access request is already in progress',
);

/**
 * Requests permission to use biometrics.
 * @since Mini Apps v7.2
 * @returns Promise with true, if access was granted.
 * @throws {FunctionNotAvailableError} The environment is unknown
 * @throws {FunctionNotAvailableError} The SDK is not initialized
 * @throws {FunctionNotAvailableError} The function is not supported
 * @throws {FunctionNotAvailableError} The parent component is not mounted
 * @throws {ConcurrentCallError} Biometry access request is already in progress
 * @throws {NotAvailableError} Biometry is not available
 * @example
 * if (requestAccess.isAvailable()) {
 *   const accessGranted = await requestAccess({
 *     reason: 'Authenticate to open wallet',
 *   });
 * }
 */
export const requestAccess = wrapComplete('requestAccess', requestAccessFn);
export const [, requestAccessPromise, isRequestingAccess] = tRequestAccessPromise;
export const [, requestAccessError] = tRequestAccessError;

function setState(s: State): void {
  _state.set(s);
  setStorageValue<StorageValue>(COMPONENT_NAME, s);
}

/**
 * Unmounts the component.
 */
export function unmount() {
  [authPromise, requestAccessPromise, mountPromise].forEach(signalCancel);
  off(INFO_RECEIVED_EVENT, onBiometryInfoReceived);
  _isMounted.set(false);
}

/**
 * Updates the biometric token in a secure storage on the device.
 * @since Mini Apps v7.2
 * @returns Promise with `true`, if token was updated.
 * @throws {FunctionNotAvailableError} The environment is unknown
 * @throws {FunctionNotAvailableError} The SDK is not initialized
 * @throws {FunctionNotAvailableError} The function is not supported
 * @throws {FunctionNotAvailableError} The parent component is not mounted
 * @example Setting a new token
 * if (updateToken.isAvailable()) {
 *   updateToken({
 *     token: 'abcdef',
 *   })
 * }
 * @example Deleting the token
 * if (updateToken.isAvailable()) {
 *   updateToken();
 * }
 */
export const updateToken = wrapComplete(
  'updateToken',
  (options?: UpdateTokenOptions): AbortablePromise<BiometryTokenUpdateStatus> => {
    options ||= {};
    return request('web_app_biometry_update_token', 'biometry_token_updated', {
      ...options,
      params: {
        token: options.token || '',
        reason: options.reason,
      },
    }).then(r => r.status);
  },
);
