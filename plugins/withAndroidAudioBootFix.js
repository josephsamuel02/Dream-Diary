/**
 * Config plugin: Android Play vitals fixes for Dream Diary.
 *
 * Addresses Play Console warnings for release 15 (1.0.1):
 * 1. Restricted foreground service types started from BOOT_COMPLETED
 *    (expo-audio AudioRecordingService / AudioControlsService).
 *    -> This app only records short user-initiated voice notes. It never
 *       starts audio from boot. This plugin ensures the merged manifest:
 *       - keeps RECEIVE_BOOT_COMPLETED only for expo-notifications rescheduling
 *         (allowed, not a restricted FGS type),
 *       - declares FOREGROUND_SERVICE_MICROPHONE (the only restricted type we use),
 *       - blocks MEDIA_PLAYBACK / CAMERA / LOCATION / etc. FGS types we never use,
 *       - marks audio services exported=false so no boot receiver can start them.
 * 2. Large-screen resizability (Android 16 ignores orientation locks).
 *    -> Removes portrait lock on MainActivity, sets resizeableActivity=true
 *       and large-screen supports-screens flags.
 *
 * Run `npx expo prebuild --clean` after changing app.json to regenerate android/.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const AUDIO_SERVICES = ['AudioRecordingService', 'AudioControlsService'];

function ensurePermission(manifest, name) {
  manifest.manifest['uses-permission'] = manifest.manifest['uses-permission'] || [];
  if (!manifest.manifest['uses-permission'].some((p) => p.$['android:name'] === name)) {
    manifest.manifest['uses-permission'].push({ $: { 'android:name': name } });
  }
}

function removePermission(manifest, name) {
  const perms = manifest.manifest['uses-permission'];
  if (!Array.isArray(perms)) return;
  manifest.manifest['uses-permission'] = perms.filter((p) => p.$['android:name'] !== name);
}

module.exports = function withAndroidAudioBootFix(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;

    // Only the microphone FGS type is needed (short voice-note recording).
    ensurePermission(manifest, 'android.permission.FOREGROUND_SERVICE_MICROPHONE');
    ensurePermission(manifest, 'android.permission.RECORD_AUDIO');
    // Never use these restricted types — strip them so Play static analysis
    // can't link BOOT_COMPLETED -> restricted FGS start paths.
    removePermission(manifest, 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK');
    removePermission(manifest, 'android.permission.FOREGROUND_SERVICE_CAMERA');
    removePermission(manifest, 'android.permission.FOREGROUND_SERVICE_LOCATION');
    removePermission(manifest, 'android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE');
    removePermission(manifest, 'android.permission.FOREGROUND_SERVICE_DATA_SYNC');
    removePermission(manifest, 'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION');

    const app = manifest.manifest.application?.[0];
    if (app) {
      // supports-screens for tablets / foldables / large screens.
      app['supports-screens'] = [
        {
          $: {
            'android:resizeable': 'true',
            'android:smallScreens': 'true',
            'android:normalScreens': 'true',
            'android:largeScreens': 'true',
            'android:xlargeScreens': 'true',
          },
        },
      ];

      const activities = app.activity || [];
      for (const a of activities) {
        const name = a.$?.['android:name'] ?? '';
        if (name.endsWith('.MainActivity') || name === '.MainActivity') {
          // Android 16 ignores orientation/resize locks on large screens and
          // flags them as UX issues — remove the portrait lock, allow resize.
          delete a.$['android:screenOrientation'];
          a.$['android:resizeableActivity'] = 'true';
          a.$['android:configChanges'] =
            'keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|smallestScreenSize|density|layoutDirection';
        }
      }

      // Harden audio services: never exported, never boot-started.
      const services = app.service || [];
      for (const s of services) {
        const sName = s.$?.['android:name'] ?? '';
        if (AUDIO_SERVICES.some((k) => sName.includes(k))) {
          s.$['android:exported'] = 'false';
          s.$['android:enabled'] = 'true';
          // Recording uses the microphone type only.
          if (sName.includes('AudioRecordingService')) {
            s.$['android:foregroundServiceType'] = 'microphone';
          }
          delete s.$['android:permission'];
        }
      }

      // Strip any BOOT_COMPLETED receiver that references audio services.
      // (expo-notifications' own boot receiver for rescheduling reminders stays.)
      const receivers = app.receiver || [];
      app.receiver = receivers.filter((r) => {
        const intentFilters = r['intent-filter'] || [];
        const hasBoot = intentFilters.some((f) =>
          (f.action || []).some((ac) => ac.$?.['android:name'] === 'android.intent.action.BOOT_COMPLETED')
        );
        if (!hasBoot) return true;
        const blob = JSON.stringify(r).toLowerCase();
        const isAudioBoot = blob.includes('audio');
        return !isAudioBoot;
      });
    }

    return cfg;
  });
};
