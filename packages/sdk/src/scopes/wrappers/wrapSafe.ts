import {
  type MethodName,
  supports,
  isTMA,
  type MethodNameWithVersionedParams,
  type MethodVersionedParams,
} from '@telegram-apps/bridge';
import type { Computed } from '@telegram-apps/signals';
import type { If, IsNever } from '@telegram-apps/toolkit';

import { version } from '@/globals.js';
import { FunctionUnavailableError } from '@/errors.js';
import { isSSR } from '@/utils/isSSR.js';
import type { AnyFn } from '@/types.js';
import { createComputed } from '@/signals-registry.js';

export type CustomSupportValidatorFn = () => string | undefined;

export type IsSupportedType =
  | MethodName
  | CustomSupportValidatorFn
  | (MethodName | CustomSupportValidatorFn)[]
  | { any: (MethodName | CustomSupportValidatorFn)[] };

/**
 * A map where the key is a method name with versioned parameters, and the value is a tuple
 * containing the method and parameter names. The third tuple value is a function accepting
 * the wrapped function arguments and returning true if support check must be applied.
 */
export type Supports<Fn extends AnyFn> = Record<string, {
  [M in MethodNameWithVersionedParams]: [
    method: M,
    param: MethodVersionedParams<M>,
    shouldCheck: (...args: Parameters<Fn>) => boolean,
  ];
}[MethodNameWithVersionedParams]>;

export type IfAvailableFnResult<Data> = [called: true, data: Data] | [called: false];

export type SafeWrapped<
  Fn extends AnyFn,
  HasSupportCheck extends boolean,
  SupportsSchema extends Record<string, any>
> =
  & Fn
  & {
  /**
   * The signal returning `true` if the function is available in the current environment and
   * conditions.
   *
   * To be more accurate, the method checks the following:
   * 1. The current environment is Telegram Mini Apps.
   * 2. The SDK package is initialized.
   * 3. If passed, the `isSupported` signal returns true.
   * 4. If passed, the `isMounted` signal returns true.
   *
   * *You should use this function when possible because it provides must-have code security
   * mechanisms and makes a developer sure that he is using the package properly.*
   *
   * @returns True if the function is available in the current environment.
   * @example
   * if (showBackButton.isAvailable()) {
   *   showBackButton();
   * }
   */
  isAvailable: Computed<boolean>;
  /**
   * Calls the function only in case it is available.
   *
   * It uses the `isAvailable` internally to check if the function is supported.
   * @example
   * showBackButton.ifAvailable();
   */
  ifAvailable(...args: Parameters<Fn>): IfAvailableFnResult<ReturnType<Fn>>;
}
  & If<HasSupportCheck, {
  /**
   * The signal returning `true` if the function is supported by the Telegram client,
   * including some possible additional conditions.
   *
   * It is highly recommended to use this signal only in certain narrow cases when only the
   * function support check is required, but not its availability.
   *
   * This signal is not applying additional operations like checking if the current environment
   * is Mini Apps and the SDK is initialized.
   *
   * To check if the function is available for use, use the `isAvailable` signal.
   *
   * @returns True if this function is supported.
   * @see isAvailable
   * @example
   * if (setMiniAppBottomBarColor.isSupported()) {
   *   console.log('Mini App bottom bar is supported, but the function may be unavailable');
   * }
   */
  isSupported: Computed<boolean>;
}, {}>
  & If<IsNever<SupportsSchema>, {}, {
  /**
   * A map where the key is the function-specific option name and value is a signal indicating
   * if it is supported by the current environment.
   * @example
   * if (setHeaderColor.isAvailable()) {
   *   if (setHeaderColor.supports.rgb()) {
   *     setHeaderColor('#ffaabb');
   *   } else {
   *     setHeaderColor('bg_color');
   *   }
   * }
   */
  supports: Record<keyof SupportsSchema, Computed<boolean>>
}>

export interface WrapSafeOptions<Fn extends AnyFn> {
  /**
   * The component name owning the wrapped function.
   */
  component?: string;
  /**
   * Signal returning true if the owning component is mounted.
   */
  isMounted?: () => boolean;
  /**
   * Signal returning true if the owning component is mounting.
   */
  isMounting?: () => boolean;
  /**
   * Value determining if the function is supported by the current environment.
   */
  isSupported?: IsSupportedType;
  /**
   * A map where the key is a method name with versioned parameters, and the value is a tuple
   * containing the method and parameter names. The third tuple value is a function accepting
   * the wrapped function arguments and returning true if support check must be applied.
   */
  supports?: Supports<Fn>,
}

/**
 * Wraps the function enhancing it with the useful utilities described in the SafeWrapped type.
 * @see SafeWrapped
 * @param method - method name
 * @param fn - wrapped function
 */
export function wrapSafe<Fn extends AnyFn>(method: string, fn: Fn): SafeWrapped<Fn, false, never>;
/**
 * Wraps the function enhancing it with the useful utilities described in the SafeWrapped type.
 * @see SafeWrapped
 * @param method - method name
 * @param fn - wrapped function
 * @param options - additional options
 */
export function wrapSafe<Fn extends AnyFn, O extends WrapSafeOptions<Fn>>(
  method: string,
  fn: Fn,
  options: O,
): SafeWrapped<
  Fn,
  O extends { isSupported: any } ? true : false,
  O extends { supports: any } ? O['supports'] : never
>
/*@__NO_SIDE_EFFECTS__*/
export function wrapSafe<Fn extends AnyFn>(
  method: string,
  fn: Fn,
  options?: WrapSafeOptions<Fn>,
): SafeWrapped<Fn, boolean, Record<string, any> | never> {
  options ||= {};
  const {
    isSupported: optionsIsSupported,
    isMounted,
    isMounting,
    component,
    supports: optionSupports,
  } = options || {};

  const functionId = `${component ? `${component}.` : ''}${method}()`;

  // Simplify the isSupported value to work with an array of validators or a single object.
  const isSupported = optionsIsSupported
    ? Array.isArray(optionsIsSupported)
      // (MethodName | CustomSupportValidator)[]
      ? optionsIsSupported
      : typeof optionsIsSupported === 'object' && 'any' in optionsIsSupported
        // { any: (MethodName | CustomSupportValidator)[] }
        ? optionsIsSupported
        // MethodName | CustomSupportValidator
        : [optionsIsSupported]
    : undefined;

  /**
   * @returns True if the specified option is supported.
   * @param option - option name.
   */
  function supportsOption(option: string): boolean {
    if (optionSupports) {
      const tuple = optionSupports[option];
      return supports(tuple[0], tuple[1], version());
    }
    return true;
  }

  /**
   * @returns All found errors according to the isSupported variable value.
   */
  function supportError(): string | undefined {
    // isSupported was not specified.
    // In this case, we assume that the function has no dependencies and is always supported.
    if (!isSupported) {
      return;
    }

    function getError(item: MethodName | CustomSupportValidatorFn): string | undefined {
      return typeof item === 'function'
        ? item()
        : supports(item, version())
          ? undefined
          : `it is unsupported in Mini Apps version ${version()}`;
    }

    const isSupportedItems = Array.isArray(isSupported) ? isSupported : isSupported.any;
    const errors = isSupportedItems.map(getError).filter(Boolean) as string[];

    return Array.isArray(isSupported)
      // An array is passed. It means, the function is supported only in case no errors were
      // returned.
      ? errors[0]
      // An object with the "any" property is passed.
      // Should return nothing if at least one item didn't return an error.
      : errors.length === isSupportedItems.length
        ? errors[errors.length - 1]
        : undefined;
  }

  /**
   * @returns An error related to supports.<name> check.
   */
  function supportsOptionError(...args: Parameters<Fn>): string | undefined {
    for (const k in optionSupports) {
      if (optionSupports[k][2](...args) && !supportsOption(k)) {
        return `option ${k} is not supported in Mini Apps version ${version()}`;
      }
    }
  }

  let supportsMap: Record<string, Computed<boolean>> | undefined;
  if (optionSupports) {
    supportsMap = {};
    for (const option in optionSupports) {
      supportsMap[option] = createComputed(() => supportsOption(option));
    }
  }

  const $isSupported = createComputed(() => !supportError());
  const $isInitialized = createComputed(() => version() !== '0.0');
  const $isMounted = createComputed(() => !isMounted || isMounted());
  const $isAvailable = createComputed(
    () => isTMA()
      && !isSSR()
      && $isInitialized()
      && $isSupported()
      && $isMounted(),
  );

  return Object.assign(
    (...args: Parameters<Fn>): ReturnType<Fn> => {
      const errMessagePrefix = `Unable to call the ${functionId} ${component ? 'method' : 'function'}:`;

      if (isSSR() || !isTMA()) {
        throw new FunctionUnavailableError(`${errMessagePrefix} it can't be called outside Mini Apps`);
      }
      if (!$isInitialized()) {
        throw new FunctionUnavailableError(`${errMessagePrefix} the SDK was not initialized. Use the SDK init() function`);
      }
      const supportErr = supportError();
      if (supportErr) {
        throw new FunctionUnavailableError(`${errMessagePrefix} ${supportErr}`);
      }
      const supportsOptionErr = supportsOptionError(...args);
      if (supportsOptionErr) {
        throw new FunctionUnavailableError(`${errMessagePrefix} ${supportsOptionErr}`);
      }
      if (!$isMounted()) {
        const message = isMounting && isMounting()
          ? 'mounting. Wait for the mount completion'
          : `unmounted. Use the ${component}.mount() method`;
        throw new FunctionUnavailableError(`${errMessagePrefix} the component is ${message}`);
      }
      return fn(...args);
    },
    fn,
    {
      isAvailable: $isAvailable,
      ifAvailable(...args: Parameters<Fn>): IfAvailableFnResult<ReturnType<Fn>> {
        return $isAvailable() ? [true, fn(...args)] : [false];
      },
    },
    isSupported ? { isSupported: $isSupported } : {},
    supportsMap ? { supports: supportsMap } : {},
  );
}
