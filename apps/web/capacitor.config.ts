import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.akfa.ustaxona',
  appName: 'Ustaxona',
  webDir: 'dist',
  server: {
    url: 'https://akfa-web-staging.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
