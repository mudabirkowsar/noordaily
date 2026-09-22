// plugins/withDailyWallpaper.js
//
// Expo Config Plugin for the Daily Islamic Lock Screen Wallpaper feature.
//
// Native code isn't autolinked the way an npm package would be (it lives
// directly inside this app's android/ folder), so three things need to
// happen every time the native Android project is generated/regenerated
// via `expo prebuild`:
//
//   1. Copy the Kotlin sources (native-android/wallpaper/*.kt) into
//      android/app/src/main/java/<package>/wallpaper/
//   2. Register WallpaperPackage() inside MainApplication's getPackages()
//   3. Add the `androidx.work:work-runtime-ktx` dependency to
//      android/app/build.gradle
//   4. Declare WallpaperBootReceiver in AndroidManifest.xml so the
//      WorkManager schedule can be restored after a device reboot
//
// This plugin is referenced from app.json ("./plugins/withDailyWallpaper.js").
// If your workflow instead commits a hand-generated android/ directory and
// you never run `expo prebuild --clean`, you can skip this plugin entirely
// and apply the same four changes manually — see WALLPAPER_FEATURE_README.md.

const {
  withMainApplication,
  withAppBuildGradle,
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const WORK_DEPENDENCY = 'androidx.work:work-runtime-ktx:2.9.0';
const SOURCE_DIR = path.join(__dirname, '..', 'native-android', 'wallpaper');
const RECEIVER_NAME = '.wallpaper.WallpaperBootReceiver';

function withCopyWallpaperSources(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const pkg = cfg.android?.package;
      if (!pkg) return cfg;

      const javaRoot = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        ...pkg.split('.')
      );
      const destDir = path.join(javaRoot, 'wallpaper');

      if (!fs.existsSync(SOURCE_DIR)) {
        console.warn(
          `[withDailyWallpaper] Source folder not found: ${SOURCE_DIR}. Skipping native file copy.`
        );
        return cfg;
      }

      fs.mkdirSync(destDir, { recursive: true });

      for (const file of fs.readdirSync(SOURCE_DIR)) {
        if (!file.endsWith('.kt')) continue;
        const raw = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8');
        // Source files are written with a placeholder package so this
        // plugin works regardless of the app's actual package name.
        const rewritten = raw.replace(
          /^package com\.noordaily\.app\.wallpaper$/m,
          `package ${pkg}.wallpaper`
        );
        fs.writeFileSync(path.join(destDir, file), rewritten, 'utf8');
      }

      return cfg;
    },
  ]);
}

function withWallpaperMainApplication(config) {
  return withMainApplication(config, (cfg) => {
    const isKotlin = cfg.modResults.language === 'kt';
    let contents = cfg.modResults.contents;

    const importLine = isKotlin
      ? `import ${cfg.android.package}.wallpaper.WallpaperPackage`
      : `import ${cfg.android.package}.wallpaper.WallpaperPackage;`;

    if (!contents.includes(importLine)) {
      contents = contents.replace(
        /(package [^\n]+\n)/,
        `$1\n${importLine}\n`
      );
    }

    const addLine = isKotlin
      ? '          packages.add(WallpaperPackage())\n'
      : '          packages.add(new WallpaperPackage());\n';

    if (!contents.includes('WallpaperPackage()')) {
      if (isKotlin && contents.includes('return packages')) {
        contents = contents.replace(
          'return packages',
          `${addLine}          return packages`
        );
      } else if (!isKotlin && contents.includes('return packages;')) {
        contents = contents.replace(
          'return packages;',
          `${addLine}          return packages;`
        );
      } else {
        console.warn(
          '[withDailyWallpaper] Could not find "return packages" in MainApplication — register WallpaperPackage() manually.'
        );
      }
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withWallpaperBuildGradle(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes(WORK_DEPENDENCY)) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation("${WORK_DEPENDENCY}")`
      );
    }
    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withWallpaperManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    app.receiver = app.receiver || [];
    const already = app.receiver.some(
      (r) => r.$?.['android:name'] === RECEIVER_NAME
    );

    if (!already) {
      app.receiver.push({
        $: {
          'android:name': RECEIVER_NAME,
          'android:exported': 'true',
          'android:enabled': 'true',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } }],
          },
        ],
      });
    }

    return cfg;
  });
}

module.exports = function withDailyWallpaper(config) {
  config = withCopyWallpaperSources(config);
  config = withWallpaperMainApplication(config);
  config = withWallpaperBuildGradle(config);
  config = withWallpaperManifest(config);
  return config;
};
