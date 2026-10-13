# Local Android builds on Windows

## Setup verified on October 13, 2026

Android Studio Rabbit 1 is installed. The user installed Android SDK Command-line Tools (latest) and Platform-Tools through SDK Manager. The SDK is at `C:/Users/coolb/AppData/Local/Android/Sdk`. Android Studio's bundled Java is at `C:/Program Files/Android/Android Studio/jbr` (Java 25.0.3).

The existing app's Android folder was generated with `APP_VARIANT=personal`, `EXPO_PUBLIC_REMINDER_TESTS=false`, and `npx expo prebuild --platform android --no-install`. It retains package `com.coolbylaki.pilltracker.test`, version 1.1.0 and Android version code 8. The generated `android/local.properties` points to the installed SDK. Expo's automatic changes to the existing Android/iOS launch scripts were reverted.

Generated Android/iOS folders, local machine settings and signing keys are excluded from Git. Expo config, plugins and the native module under `modules/pill-reminders` remain the maintained sources. Do not create a new Android Studio application.

With the bundled Java and SDK paths set for the command, `android/gradlew.bat --version` and `android/gradlew.bat help --console=plain --max-workers=2` passed. Gradle 9.3.1 successfully loaded the project and its native module. It installed NDK 27.1.12297006 using the already accepted SDK license. This is a configuration check, not an APK build or a new native test result.

## Open in Android Studio

Use **Open** on the welcome screen and select `C:/Projects/Pill Tracker/android`. Trust this existing project if prompted and allow Gradle sync to finish. In Settings > Build, Execution, Deployment > Build Tools > Gradle, set **Gradle JVM criteria > Version 17**. Studio itself continues using its bundled runtime. Required versions are Android SDK Platform 36, Build Tools 36.0.0 and NDK 27.1.12297006. Gradle can download missing SDK packages with accepted licenses.

## Java 17 and native-sync repair

The initial basic Gradle check passed with Studio's bundled Java 25, but Android Studio's native configuration failed: the Prefab tool emitted Java's restricted-native-access warning, which the Android build plugin treated as an error. Selecting Java 17 then failed in `updateDaemonJvm` because toolchain download repositories were not configured.

`plugins/with-java-toolchains.cjs` now adds Gradle's Foojay resolver convention plugin, pinned to 1.0.0, to generated Android settings. It configures JDK downloads and survives future Expo prebuilds. The local `updateDaemonJvm --jvm-version=17` task passed and generated Java-17 download criteria. Gradle downloaded Temurin 17 into its local JDK cache. All four previously failing Expo modules CMake configuration tasks (arm64-v8a, armeabi-v7a, x86 and x86_64) then passed. All 27 app tests, lint, TypeScript and formatting passed. This repairs project sync; release signing/APK packaging remain separate.

## Windows paths containing spaces

Expo modules core 57.0.21's IDE-only `generateStubPCH` helper splits compiler commands on spaces and replaces header paths with a whitespace-based regular expression. With this repository at `C:/Projects/Pill Tracker`, Studio sync failed because quoted paths were broken. The maintained `scripts/patch-expo-windows-pch.cjs` postinstall script replaces that command handling with Ant's quote-aware argument parser and substitutes complete header arguments. It runs only on Windows, checks the exact supported dependency version/source shape, and is safe to rerun. Review the workaround when upgrading Expo. Linux/EAS builds skip it.

The repaired `:expo-modules-core:generateStubPCH` task, including its four ABI configuration prerequisites, passed in the existing path. This helper creates IDE stubs; the normal native build still regenerates real precompiled headers. No repository move or new application is needed.

## Remaining signing and packaging work

The generated release configuration still uses the template's debug signing key. Before producing an installable personal update, retrieve and reuse the existing EAS signing key, store it only in ignored local files, and configure release signing. Do not replace it with a newly generated key or ask the user to uninstall the installed app. Verify signing identity, version/package and all native tests before handing over the final APK.

The version-1.1.0 GitHub release remains source-only until that signed build is completed. Local Gradle builds do not use the exhausted EAS cloud-build allowance. Ads/public release work remains a separate later checkpoint.
