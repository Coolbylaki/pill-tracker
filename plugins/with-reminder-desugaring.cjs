const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = (config) =>
  withAppBuildGradle(config, (mod) => {
    const marker = '// Pill Tracker reminder date support';
    if (!mod.modResults.contents.includes(marker)) {
      mod.modResults.contents += `\n${marker}\nandroid {\n  compileOptions {\n    coreLibraryDesugaringEnabled true\n  }\n}\ndependencies {\n  coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.1.5'\n}\n`;
    }
    return mod;
  });
