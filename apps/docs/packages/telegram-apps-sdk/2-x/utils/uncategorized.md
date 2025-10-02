# Uncategorized

## `getCurrentTime`

To retrieve the current Telegram server time, use the `getCurrentTime` function. It returns
a JavaScript `Date` object.

::: code-group

```ts [Using isAvailable]
import { getCurrentTime } from '@telegram-apps/sdk';

if (getCurrentTime.isAvailable()) {
  const time = await getCurrentTime(); // Date
}
```

```ts [Using ifAvailable]
import { getCurrentTime } from '@telegram-apps/sdk';

const time = await getCurrentTime.ifAvailable(); // Date | undefined
```

:::

## `readTextFromClipboard`

To read text from the clipboard, use the `readTextFromClipboard` function.

::: code-group

```ts [Using isAvailable]
import { readTextFromClipboard } from '@telegram-apps/sdk';

if (readTextFromClipboard.isAvailable()) {
  const contents = await readTextFromClipboard(); // string | null
}
```

```ts [Using ifAvailable]
import { readTextFromClipboard } from '@telegram-apps/sdk';

const contents = await readTextFromClipboard.ifAvailable(); 
// string | null | undefined
```

:::

## `shareStory`

The `shareStory` method opens the native story editor.

It has one required parameter: a media URL that will be used as the background for the story.

::: code-group

```ts [Using isAvailable]
import { shareStory } from '@telegram-apps/sdk';

if (shareStory.isAvailable()) {
  shareStory('https://my.media/background.png');
}
```

```ts [Using ifAvailable]
import { shareStory } from '@telegram-apps/sdk';

shareStory.ifAvailable('https://my.media/background.png');
```

:::

The function optionally accepts an object with additional options:

- `text?: string` - a caption to add to the media, with a limit of 0-200 characters for regular
  users, and 0-2048 characters
  for [premium subscribers](https://telegram.org/faq_premium#telegram-premium).
- `widgetLink?: object` - an object for including a widget link in the story.
  Only [premium subscribers](https://telegram.org/faq_premium#telegram-premium) can post stories
  with links.
  - `url: string` - the URL to be included in the story.
  - `name?: string` - the display name for the widget link (0-48 characters).

```ts
shareStory('https://my.media/background.png', {
  text: 'Today was a good day. Love it! Thanks to this public!',
  widgetLink: {
    url: 'https://t.me/heyqbnk',
    name: 'heyqbnk public group',
  },
});
```

## `sendData`

To send data to the bot, use the `sendData` function. This function sends a service message to the
bot and closes the Mini App.

::: code-group

```ts [Using isAvailable]
import { sendData } from '@telegram-apps/sdk';

if (sendData.isAvailable()) {
  sendData('my-data-goes-here');
}
```

```ts [Using ifAvailable]
import { sendData } from '@telegram-apps/sdk';

sendData.ifAvailable('my-data-goes-here');
```

:::

> [!TIP]
> This function sends data up to 4096 bytes to the bot and is available for Mini Apps launched via a
> Keyboard button.

> [!WARNING]
> This function is only accessible for Mini Apps started through a Keyboard button. See
> the `web_app_data` field in the [Message](https://core.telegram.org/bots/api#message) class for
> more details.

## `switchInlineQuery`

To create a message prefixed with the bot username and a specific text, and share it in another
chat, use the `switchInlineQuery` method. You can use the second optional argument to specify which
chat types can be selected to send the message.

::: code-group

```ts [Using isAvailable]
import { switchInlineQuery } from '@telegram-apps/sdk';

if (switchInlineQuery.isAvailable()) {
  switchInlineQuery('Check this bot!', [
    'users',
    'bots',
    'groups',
    'channels',
  ]);
}
```

```ts [Using ifAvailable]
import { switchInlineQuery } from '@telegram-apps/sdk';

switchInlineQuery.ifAvailable('Check this bot!', [
  'users',
  'bots',
  'groups',
  'channels',
]);
```

:::
