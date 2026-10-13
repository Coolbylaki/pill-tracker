# Local Android builds on Windows

## Setup verified on October 13, 2026

Android Studio Rabbit 1 is installed. The user installed Android SDK Command-line Tools (latest) and Platform-Tools through SDK Manager. The SDK is at `C:/Users/coolb/AppData/Local/Android/Sdk`. Android Studio's bundled Java is at `C:/Program Files/Android/Android Studio/jbr` (Java 25.0.3).

The existing app's Android folder was generated with `APP_VARIANT=personal`, `EXPO_PUBLIC_REMINDER_TESTS=false`, and `npx expo prebuild --platform android --no-install`. It retains package `com.coolbylaki.pilltracker.test`, version 1.1.0 and Android version code 8. The generated `android/local.properties` points to the installed SDK. Expo's automatic changes to the existing Android/iOS launch scripts were reverted.

Generated Android/iOS folders, local machine settings and signing keys are excluded from Git. Expo config, plugins and the native module under `modules/pill-reminders` remain the maintained sources. Do not create a new Android Studio application.

With the bundled Java and SDK paths set for the command, `android/gradlew.bat --version` and `android/gradlew.bat help --console=plain --max-workers=2` passed. Gradle 9.3.1 successfully loaded the project and its native module. It installed NDK 27.1.12297006 using the already accepted SDK license. This is a configuration check, not an APK build or a new native test result.

## Open in Android Studio

Use **Open** on the welcome screen and select `C:/Projects/Pill Tracker/android`. Trust this existing project if prompted and allow Gradle sync to finish. Use the bundled JDK if prompted. Required versions are Android SDK Platform 36, Build Tools 36.0.0 and NDK 27.1.12297006. At setup verification, SDK Platform/Build Tools 34 were installed; Platform/Build Tools 36 still need downloading when the first build or SDK Manager requires them. Gradle can download missing packages with accepted licenses.

## Remaining signing and packaging work

The generated release configuration still uses the template's debug signing key. Before producing an installable personal update, retrieve and reuse the existing EAS signing key, store it only in ignored local files, and configure release signing. Do not replace it with a newly generated key or ask the user to uninstall the installed app. Verify signing identity, version/package and all native tests before handing over the final APK.

The version-1.1.0 GitHub release remains source-only until that signed build is completed. Local Gradle builds do not use the exhausted EAS cloud-build allowance. Ads/public release work remains a separate later checkpoint.
