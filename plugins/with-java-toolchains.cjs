const { withSettingsGradle } = require('expo/config-plugins');

module.exports = (config) =>
  withSettingsGradle(config, (mod) => {
    const plugin = 'org.gradle.toolchains.foojay-resolver-convention';
    if (!mod.modResults.contents.includes(plugin)) {
      const pluginsBlock = /^plugins\s*\{/m;
      if (!pluginsBlock.test(mod.modResults.contents)) {
        throw new Error('Cannot configure Java downloads: settings.gradle has no plugins block.');
      }
      mod.modResults.contents = mod.modResults.contents.replace(
        pluginsBlock,
        `plugins {\n  id("${plugin}") version "1.0.0"`,
      );
    }
    return mod;
  });
