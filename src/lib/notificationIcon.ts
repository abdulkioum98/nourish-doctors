// Notification icon for Nourish Doctors — prepared 2026-11-23.
//
// The app icon (egg + stethoscope) is also the notification icon:
//  - Small icon (status bar): @drawable/ic_stat_nourish — a white
//    silhouette of the logo, in
//    android/app/src/main/res/drawable-*/ic_stat_nourish.png
//    (mdpi 24, hdpi 36, xhdpi 48, xxhdpi 72, xxxhdpi 96).
//    Android requires the small icon to be white-on-transparent;
//    the system tints it, so the full-colour logo cannot be used here.
//  - Large icon (notification shade): the app icon itself (ic_launcher),
//    which Android shows by default when largeIcon is not set.
//
// No notification plugin is installed yet. When you add
// @capacitor/local-notifications, pass these in every schedule() call:
//
//   import { LocalNotifications } from '@capacitor/local-notifications';
//   import { getAndroidNotificationIcon } from './notificationIcon';
//   await LocalNotifications.schedule({
//     notifications: [{
//       id: 1, title: '...', body: '...',
//       ...getAndroidNotificationIcon(),
//     }],
//   });
//
// For Firebase (FCM) push notifications, add this inside <application>
// in android/app/src/main/AndroidManifest.xml:
//
//   <meta-data
//     android:name="com.google.firebase.messaging.default_notification_icon"
//     android:resource="@drawable/ic_stat_nourish" />
//
// Regenerate the silhouette any time the logo changes:
//   python3 assets/make-app-icons-v2.py   (step 5 in that script)

export const NOTIFICATION_SMALL_ICON = 'ic_stat_nourish';
export const NOTIFICATION_LARGE_ICON = 'ic_launcher';

/** Options to spread into a LocalNotifications.schedule() notification
 *  (Android only — iOS ignores smallIcon/largeIcon). */
export function getAndroidNotificationIcon() {
  return {
    smallIcon: NOTIFICATION_SMALL_ICON,
    largeIcon: NOTIFICATION_LARGE_ICON,
  };
}
