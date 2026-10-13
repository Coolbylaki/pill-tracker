const fs = require('node:fs');
const path = require('node:path');

// Expo's IDE-only stub generator in this version splits quoted Windows paths.
// Keep the workaround local to Windows; review it when upgrading Expo.
if (process.platform !== 'win32') process.exit(0);

const packagePath = require.resolve('expo-modules-core/package.json');
const { version } = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
if (version !== '57.0.21') {
  throw new Error(
    'Review the Windows PCH workaround before using a new expo-modules-core version.',
  );
}

const gradlePath = path.join(path.dirname(packagePath), 'android', 'build.gradle');
const source = fs.readFileSync(gradlePath, 'utf8').replace(/\r\n/g, '\n');
const marker = '// Pill Tracker: preserve quoted Windows paths in IDE stub generation';
if (source.includes(marker)) process.exit(0);

const start = source.indexOf('          def cmd = entry.command');
const end = source.indexOf('            .directory(new File(entry.directory))', start);
if (start < 0 || end < 0 || !source.slice(start, end).includes('cmd.split(" ")')) {
  throw new Error('Expo PCH helper changed; review the Windows path workaround.');
}

const replacement = [
  `          ${marker}`,
  '          def cmd = org.apache.tools.ant.types.Commandline.translateCommandline(entry.command)',
  '            .collect { arg ->',
  "              (arg.endsWith('cmake_pch.hxx') || arg.endsWith('cmake_pch.hxx.cxx'))",
  '                ? stubHeaderPath : arg',
  '            }',
  '',
  '          def process = new ProcessBuilder(cmd)',
  '',
].join('\n');

fs.writeFileSync(gradlePath, source.slice(0, start) + replacement + source.slice(end));
console.log('Applied Expo Windows IDE path workaround.');
