# Emoji Status

## `requestEmojiStatusAccess`

To request access to user emoji status update, use the `requestEmojiStatusAccess` function:

::: code-group

```ts [Using isAvailable]
import { requestEmojiStatusAccess } from '@telegram-apps/sdk';

if (requestEmojiStatusAccess.isAvailable()) {
  const status = await requestEmojiStatusAccess();
}
```

```ts [Using ifAvailable]
import { requestEmojiStatusAccess } from '@telegram-apps/sdk';

const status = await requestEmojiStatusAccess.ifAvailable();
```

:::

## `setEmojiStatus`

To set an emoji status on user's behalf, use the `setEmojiStatus` function.

As the first argument, it accepts a custom emoji id. Optionally, you can pass the second
argument determining for how many seconds the status must be set.

::: code-group

```ts [Using isAvailable]
import { setEmojiStatus } from '@telegram-apps/sdk';

if (setEmojiStatus.isAvailable()) {
  // Set for unlimited period of time.
  await setEmojiStatus('5361800828313167608');

  // Set for 1 day.
  await setEmojiStatus('5361800828313167608', 86400);
}
```

```ts [Using ifAvailable]
import { setEmojiStatus } from '@telegram-apps/sdk';

// Set for unlimited period of time.
await setEmojiStatus.ifAvailable('5361800828313167608');

// Set for 1 day.
await setEmojiStatus.ifAvailable('5361800828313167608', 86400);
```

:::