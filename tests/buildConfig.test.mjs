import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import configure from '../app.config.ts';

test('personal APK upgrades the Test app without changing its storage or notification identity', () => {
  const profiles = JSON.parse(readFileSync(new URL('../eas.json', import.meta.url)));
  const previousVariant = process.env.APP_VARIANT;
  const previousTests = process.env.EXPO_PUBLIC_REMINDER_TESTS;
  try {
    function configFor(profile) {
      Object.assign(process.env, profiles.build[profile].env);
      return configure({ config: { name: 'Pill Tracker', slug: 'pill-tracker' } });
    }
    const installed = configFor('reminder-test');
    const personal = configFor('personal');
    assert.equal(personal.name, 'Pill Tracker');
    assert.equal(personal.android.package, installed.android.package);
    assert.equal(personal.scheme, installed.scheme);
    assert.ok(personal.android.versionCode > installed.android.versionCode);
    assert.ok(personal.android.versionCode > 2, 'widget APK must upgrade the first personal APK');
    assert.equal(personal.extra.personalBuild, true);
    assert.equal(personal.extra.reminderTests, false);
    assert.equal(profiles.build.personal.developmentClient, false);
    assert.match(profiles.build.personal.android.gradleCommand, /testReleaseUnitTest/);
    // A mistakenly inherited test flag must not expose delivery controls in the personal app.
    process.env.EXPO_PUBLIC_REMINDER_TESTS = 'true';
    assert.equal(
      configure({ config: { name: 'Pill Tracker', slug: 'pill-tracker' } }).extra.reminderTests,
      false,
    );
    assert.notEqual(configFor('development').android.package, personal.android.package);
  } finally {
    if (previousVariant === undefined) delete process.env.APP_VARIANT;
    else process.env.APP_VARIANT = previousVariant;
    if (previousTests === undefined) delete process.env.EXPO_PUBLIC_REMINDER_TESTS;
    else process.env.EXPO_PUBLIC_REMINDER_TESTS = previousTests;
  }
});
