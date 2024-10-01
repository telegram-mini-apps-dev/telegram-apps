import type { DefaultTheme } from 'vitepress';

import { sectionGen } from './utils';

type Sidebar = DefaultTheme.Sidebar;
type NavItemWithLink = DefaultTheme.NavItemWithLink;

const BASE = '/packages';

const section = sectionGen(BASE);

function scope(path: string, title?: string): [string, string] {
  title ||= path[0].toUpperCase() + path
    .slice(1)
    .replace(/-./g, m => ' ' + m[1].toUpperCase());

  return [title, path];
}

function fromEntries(entries: [string, any][]): Record<string, any> {
  const result = {};
  entries.forEach(([k, v]) => {
    result[k] = v;
  });

  return result;
}

export const packagesNavItem: NavItemWithLink = {
  text: 'Packages',
  link: `${BASE}/telegram-apps-create-mini-app`,
};

export const packagesSidebar: Sidebar = {
  [BASE]: [
    section('CLI', {
      '@telegram-apps/create-mini-app': 'telegram-apps-create-mini-app',
    }),
    section('TypeScript', {
      '@telegram-apps/signals': 'telegram-apps-signals',
      '@telegram-apps/bridge': ['telegram-apps-bridge', {
        'Methods': 'methods',
        'Events': 'events',
        'Environment': 'environment',
        'Launch Parameters': 'launch-parameters',
        'Globals': 'globals',
      }],
      '@telegram-apps/sdk': [{ url: 'telegram-apps-sdk', page: false }, {
        '@1.x': ['1-x', {
          'Components': ['components', {
            BackButton: 'back-button',
            BiometryManager: 'biometry-manager',
            ClosingBehavior: 'closing-behavior',
            CloudStorage: 'cloud-storage',
            HapticFeedback: 'haptic-feedback',
            InitData: 'init-data',
            Invoice: 'invoice',
            MainButton: 'main-button',
            MiniApp: 'mini-app',
            Popup: 'popup',
            QRScanner: 'qr-scanner',
            SettingsButton: 'settings-button',
            SwipeBehavior: 'swipe-behavior',
            ThemeParams: 'theme-params',
            Utils: 'utils',
            Viewport: 'viewport',
          }],
          'Environment': 'environment',
          'Methods and Events': 'methods-and-events',
          'Launch Parameters': 'launch-parameters',
          'Theme Parameters': 'theme-parameters',
          'Init Data': ['init-data', {
            InitData: 'init-data',
            Chat: 'chat',
            User: 'user',
          }],
          'Navigation': ['navigation', {
            BrowserNavigator: 'browser-navigator',
          }],
          'CSS Variables': 'css-variables',
        }],
        '@2.x': ['2-x', {
          'Initializing': 'initializing',
          'Scopes': 'scopes',
          'Components': [
            { url: 'components', page: false },
            fromEntries([
              scope('back-button'),
              scope('biometry'),
              scope('closing-behavior'),
              scope('cloud-storage'),
              scope('haptic-feedback'),
              scope('init-data'),
              scope('invoice'),
              scope('main-button'),
              scope('mini-app'),
              scope('popup'),
              scope('qr-scanner', 'QR Scanner'),
              scope('settings-button'),
              scope('swipe-behavior'),
              scope('theme-params'),
              scope('viewport'),
            ]),
          ],
          'Utilities': [{ url: 'utils', page: false }, fromEntries([
            scope('links'),
            scope('privacy'),
            scope('uncategorized'),
          ])],
        }],
      }],
      '@telegram-apps/sdk-react': [{ url: 'telegram-apps-sdk-react', page: false }, {
        '@1.x': '1-x',
        '@2.x': '2-x',
      }],
      '@telegram-apps/sdk-solid': [{ url: 'telegram-apps-sdk-solid', page: false }, {
        '@1.x': '1-x',
        '@2.x': '2-x',
      }],
      '@telegram-apps/solid-router-integration': '/telegram-apps-solid-router-integration',
      '@telegram-apps/react-router-integration': '/telegram-apps-react-router-integration',
    }),
    section('Node', {
      '@telegram-apps/init-data-node': 'telegram-apps-init-data-node',
    }),
    section('GoLang', {
      'init-data-golang': 'init-data-golang',
    }),
  ],
};
