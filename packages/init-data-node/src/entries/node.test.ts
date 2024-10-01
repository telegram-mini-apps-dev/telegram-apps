import { describe, expect, it } from 'vitest';
import { TypedError } from '@telegram-apps/toolkit';
import type { InitData } from '@telegram-apps/types';

import { validate, sign, signData, isValid } from './node';

const sp = 'auth_date=1&can_send_after=10000&chat=%7B%22id%22%3A1%2C%22type%22%3A%22group%22%2C%22title%22%3A%22chat-title%22%2C%22photo_url%22%3A%22group%22%2C%22username%22%3A%22my-chat%22%7D&chat_instance=888&chat_type=sender&hash=47cfa22e72b887cba90c9cb833c5ea0f599975b6ce7193741844b5c4a4228b40&query_id=QUERY&receiver=%7B%22added_to_attachment_menu%22%3Afalse%2C%22allows_write_to_pm%22%3Atrue%2C%22first_name%22%3A%22receiver-first-name%22%2C%22id%22%3A991%2C%22is_bot%22%3Afalse%2C%22is_premium%22%3Atrue%2C%22language_code%22%3A%22ru%22%2C%22last_name%22%3A%22receiver-last-name%22%2C%22photo_url%22%3A%22receiver-photo%22%2C%22username%22%3A%22receiver-username%22%7D&start_param=debug&user=%7B%22added_to_attachment_menu%22%3Afalse%2C%22allows_write_to_pm%22%3Afalse%2C%22first_name%22%3A%22user-first-name%22%2C%22id%22%3A222%2C%22is_bot%22%3Atrue%2C%22is_premium%22%3Afalse%2C%22language_code%22%3A%22en%22%2C%22last_name%22%3A%22user-last-name%22%2C%22photo_url%22%3A%22user-photo%22%2C%22username%22%3A%22user-username%22%7D';
const spObject = new URLSearchParams(sp);

const secretToken = '5768337691:AAH5YkoiEuPk8-FZa32hStHTqXiLPtAEhx8';
const secretTokenHashed = 'a5c609aa52f63cb5e6d8ceb6e4138726ea82bbc36bb786d64482d445ea38ee5f';

const initData: InitData = {
  authDate: new Date(1000),
  canSendAfter: 10000,
  chat: {
    id: 1,
    type: 'group',
    username: 'my-chat',
    title: 'chat-title',
    photoUrl: 'chat-photo',
  },
  chatInstance: '888',
  chatType: 'sender',
  hash: '47cfa22e72b887cba90c9cb833c5ea0f599975b6ce7193741844b5c4a4228b40',
  queryId: 'QUERY',
  receiver: {
    addedToAttachmentMenu: false,
    allowsWriteToPm: true,
    firstName: 'receiver-first-name',
    id: 991,
    isBot: false,
    isPremium: true,
    languageCode: 'ru',
    lastName: 'receiver-last-name',
    photoUrl: 'receiver-photo',
    username: 'receiver-username',
  },
  startParam: 'debug',
  user: {
    addedToAttachmentMenu: false,
    allowsWriteToPm: false,
    firstName: 'user-first-name',
    id: 222,
    isBot: true,
    isPremium: false,
    languageCode: 'en',
    lastName: 'user-last-name',
    photoUrl: 'user-photo',
    username: 'user-username',
  },
};

describe('isValid', () => {
  it('should return false if "hash" param is missing', () => {
    expect(isValid('auth_date=1', secretToken)).toBe(false);
  });

  it('should return false if "auth_date" param is missing or does not represent integer', () => {
    expect(isValid('hash=HHH', secretToken)).toBe(false);
    expect(isValid('auth_date=AAA&hash=HHH', secretToken)).toBe(false);
  });

  it('should return false if parameters are expired', () => {
    expect(isValid(sp, secretToken, { expiresIn: 1 })).toBe(false);
    expect(isValid(initData, secretToken, { expiresIn: 1 })).toBe(false);
  });

  it('should return false if sign is invalid', () => {
    expect(isValid(sp, `${secretToken}A`, { expiresIn: 0 })).toBe(false);
    expect(isValid(initData, `${secretToken}A`, { expiresIn: 0 })).toBe(false);
  });

  it('should return true if init data is valid', () => {
    const basicOptions = { expiresIn: 0 };
    const hashedOptions = { ...basicOptions, tokenHashed: true };
    expect(isValid(sp, secretToken, basicOptions)).toBe(true);
    expect(isValid(sp, secretTokenHashed, hashedOptions)).toBe(true);

    expect(isValid(initData, secretToken, basicOptions)).toBe(true);
    expect(isValid(initData, secretTokenHashed, hashedOptions)).toBe(true);

    expect(isValid(spObject, secretToken, basicOptions)).toBe(true);
    expect(isValid(spObject, secretTokenHashed, hashedOptions)).toBe(true);
  });

  it('should return false if "expiresIn" is not passed and parameters were created more than 1 day ago', () => {
    expect(isValid(sp, secretToken)).toBe(false);
  });
});

describe('validate', () => {
  it('should throw missing hash error if "hash" param is missing', () => {
    expect(() => validate('auth_date=1', secretToken)).toThrowError(
      new TypedError('ERR_HASH_INVALID', 'Hash is invalid'),
    );
  });

  it('should throw if "auth_date" param is missing or does not represent integer', () => {
    expect(() => validate('hash=HHH', secretToken)).toThrowError(
      new TypedError('ERR_AUTH_DATE_INVALID', 'Auth date is invalid'),
    );
    expect(() => validate('auth_date=AAA&hash=HHH', secretToken)).toThrowError(
      new TypedError('ERR_AUTH_DATE_INVALID', 'Auth date is invalid'),
    );
  });

  it('should throw if parameters are expired', () => {
    expect(() => validate(sp, secretToken, { expiresIn: 1 })).toThrowError(
      new TypedError('ERR_EXPIRED', 'Init data is expired'),
    );
    expect(() => validate(initData, secretToken, { expiresIn: 1 })).toThrowError(
      new TypedError('ERR_EXPIRED', 'Init data is expired'),
    );
  });

  it('should throw if sign is invalid', () => {
    expect(() => validate(sp, `${secretToken}A`, { expiresIn: 0 })).toThrowError(
      new TypedError('ERR_SIGN_INVALID', 'Sign is invalid')
    );
    expect(() => validate(initData, `${secretToken}A`, { expiresIn: 0 })).toThrowError(
      new TypedError('ERR_SIGN_INVALID', 'Sign is invalid')
    );
  });

  it('should correctly validate parameters in case, they are valid', () => {
    const basicOptions = { expiresIn: 0 };
    const hashedOptions = { ...basicOptions, tokenHashed: true };
    expect(() => validate(sp, secretToken, basicOptions)).not.toThrow();
    expect(() => validate(sp, secretTokenHashed, hashedOptions)).not.toThrow();

    expect(() => validate(initData, secretToken, basicOptions)).not.toThrow();
    expect(() => validate(initData, secretTokenHashed, hashedOptions)).not.toThrow();

    expect(() => validate(spObject, secretToken, basicOptions)).not.toThrow();
    expect(() => validate(spObject, secretTokenHashed, hashedOptions)).not.toThrow();
  });

  it('should throw if "expiresIn" is not passed and parameters were created more than 1 day ago', () => {
    expect(() => validate(sp, secretToken)).toThrow(
      new TypedError('ERR_EXPIRED', 'Init data is expired')
    );
  });
});

describe('sign', () => {
  it('should correctly sign data', () => {
    expect(
      sign(
        {
          canSendAfter: 10000,
          chat: {
            id: 1,
            type: 'group',
            username: 'my-chat',
            title: 'chat-title',
            photoUrl: 'chat-photo',
          },
          chatInstance: '888',
          chatType: 'sender',
          queryId: 'QUERY',
          receiver: {
            addedToAttachmentMenu: false,
            allowsWriteToPm: true,
            firstName: 'receiver-first-name',
            id: 991,
            isBot: false,
            isPremium: true,
            languageCode: 'ru',
            lastName: 'receiver-last-name',
            photoUrl: 'receiver-photo',
            username: 'receiver-username',
          },
          startParam: 'debug',
          user: {
            addedToAttachmentMenu: false,
            allowsWriteToPm: false,
            firstName: 'user-first-name',
            id: 222,
            isBot: true,
            isPremium: false,
            languageCode: 'en',
            lastName: 'user-last-name',
            photoUrl: 'user-photo',
            username: 'user-username',
          },
        },
        '5768337691:AAH5YkoiEuPk8-FZa32hStHTqXiLPtAEhx8',
        new Date(1000),
      ),
    ).toBe('auth_date=1&can_send_after=10000&chat=%7B%22id%22%3A1%2C%22type%22%3A%22group%22%2C%22title%22%3A%22chat-title%22%2C%22photo_url%22%3A%22group%22%2C%22username%22%3A%22my-chat%22%7D&chat_instance=888&chat_type=sender&query_id=QUERY&receiver=%7B%22added_to_attachment_menu%22%3Afalse%2C%22allows_write_to_pm%22%3Atrue%2C%22first_name%22%3A%22receiver-first-name%22%2C%22id%22%3A991%2C%22is_bot%22%3Afalse%2C%22is_premium%22%3Atrue%2C%22language_code%22%3A%22ru%22%2C%22last_name%22%3A%22receiver-last-name%22%2C%22photo_url%22%3A%22receiver-photo%22%2C%22username%22%3A%22receiver-username%22%7D&start_param=debug&user=%7B%22added_to_attachment_menu%22%3Afalse%2C%22allows_write_to_pm%22%3Afalse%2C%22first_name%22%3A%22user-first-name%22%2C%22id%22%3A222%2C%22is_bot%22%3Atrue%2C%22is_premium%22%3Afalse%2C%22language_code%22%3A%22en%22%2C%22last_name%22%3A%22user-last-name%22%2C%22photo_url%22%3A%22user-photo%22%2C%22username%22%3A%22user-username%22%7D&hash=47cfa22e72b887cba90c9cb833c5ea0f599975b6ce7193741844b5c4a4228b40');
  });
});

describe('signData', () => {
  it('should use HMAC-SHA256 algorithm with key, based on HMAC-SHA256 keyed with the "WebAppData" value, applied to the secret token', () => {
    expect(signData('abc', 'my-secret-token')).toBe(
      '6ecc2e9b51f30dde6877ce374ede54eb626c84e78a5d9a9dcac54d2d248f6bde',
    );
  });
});
