# NoorDaily — Daily Islamic Lock Screen Wallpaper

This document describes the feature that was added to the existing NoorDaily
Expo/React Native app: a solid-color lock-screen wallpaper, containing a
Quran Ayah and a Hadith, that automatically refreshes about every 24 hours
on Android — even while the app is closed.

## 0. Important: the `android/` folder was not in the uploaded project

The brief described this as an existing bare/CNG project with a committed
`android/` directory. The uploaded zip, however, is a **managed-style Expo
project with no `android/` folder and no `node_modules/`** (and this
environment has no network access to install packages or run
`expo prebuild`). Nothing here could be built or run inside this sandbox as
a result — everything below was written carefully by hand, but **you must
generate the native project and build it yourself** (Section 8).

To reconcile that, this delivery includes:
- All JS/JSX changes, applied directly to the existing files/screens (fully
  in place, ready to run in Expo Go for everything except the actual
  automatic wallpaper apply, which needs the native module).
- The native Android **Kotlin source**, at `native-android/wallpaper/*.kt`
  (not yet inside an `android/` folder, because there isn't one yet).
- An **Expo Config Plugin**, `plugins/withDailyWallpaper.js`, already wired
  into `app.json`, which — the next time you run `npx expo prebuild` —
  automatically copies those Kotlin files into the generated
  `android/app/src/main/java/com/noordaily/app/wallpaper/` folder, registers
  the native module in `MainApplication`, adds the `androidx.work`
  dependency to `android/app/build.gradle`, and declares the boot receiver
  in `AndroidManifest.xml`. This is the recommended path.
- If your real project instead commits a hand-maintained `android/`
  directory and you don't want to re-run `expo prebuild --clean`, Section 9
  gives the exact manual edits the plugin would otherwise make for you.

## 1. Files created

**JavaScript / JSX**
- `constants/wallpaperColors.js` — the solid-color palette + contrast helpers
- `services/wallpaperNative.js` — safe wrapper around the native module
- `services/wallpaperService.js` — main orchestration (content, cache, enable/disable, status, history)
- `components/WallpaperPreviewCanvas.jsx` — RN-view preview of a wallpaper
- `components/DailyWallpaperCard.jsx` — Home screen status/enable card
- `app/wallpaper-preview.jsx` — preview screen/route

**Native Android (Kotlin)** — `native-android/wallpaper/`
- `WallpaperContentStore.kt` — SharedPreferences + JSON content-cache file I/O
- `WallpaperGenerator.kt` — solid-color Canvas/Bitmap drawing + dynamic text sizing
- `WallpaperWorker.kt` — WorkManager `CoroutineWorker`, the recurring job
- `WallpaperScheduler.kt` — enqueues/cancels the ~24h periodic work
- `WallpaperModule.kt` — `NoorWallpaperModule`, the React Native bridge
- `WallpaperPackage.kt` — `ReactPackage` registering the module
- `WallpaperBootReceiver.kt` — restores scheduling after a device reboot

**Tooling**
- `plugins/withDailyWallpaper.js` — Expo Config Plugin wiring the above into `android/`
- `WALLPAPER_FEATURE_README.md` — this file

## 2. Files modified

- `constants/config.js` — new `STORAGE_KEYS.WALLPAPER_*`, `WALLPAPER_CACHE_WINDOW_DAYS`, `WALLPAPER_INTERVAL_HOURS`
- `services/storageService.js` — get/set helpers mirroring native wallpaper state locally
- `app/_layout.jsx` — registered the `wallpaper-preview` route as a hidden tab screen
- `app/index.jsx` — added `<DailyWallpaperCard />` under the daily Hadith card
- `app/settings.jsx` — new "DAILY WALLPAPER" section (toggle, status, next-change, Preview/Apply Now/Reset)
- `app/onboarding.jsx` — new optional 4th step ("Maybe Later" / "Enable Daily Wallpaper")
- `app.json` — added `RECEIVE_BOOT_COMPLETED` permission and registered the config plugin

Nothing else was touched. Quran/Hadith/Favorites/History/Notifications/Sharing/Firebase/Audio screens and services are untouched and still work exactly as before.

## 3. Architecture

```
data/quran.js, data/hadith.js  (existing, untouched — the only content source)
        │
services/dailyContentService.js (existing — deterministic date → ayah/hadith)
        │
services/wallpaperService.js (new)
   ├─ getWallpaperContentForDate(date) → { ayah, hadith, backgroundColor, textStyle }
   ├─ buildContentCache(400 days)      → rolling window of the above
   ├─ syncNativeContentCache()         → pushes the JSON window to native
   ├─ enableWallpaperAutomation()      → checkSetup → sync → apply → schedule
   ├─ applyDailyWallpaper(force)       → "Apply Now"
   └─ getCurrentWallpaperInfo()/getWallpaperHistory()/isWallpaperAutomationEnabled()
        │
services/wallpaperNative.js (new) — thin, crash-proof NativeModules wrapper
        │  (Android only — resolves a structured "unsupported" result on iOS/Expo Go)
        ▼
NoorWallpaperModule.kt — JS-callable methods
        │
        ├── WallpaperContentStore.kt — SharedPreferences + cache JSON file
        ├── WallpaperGenerator.kt    — solid-color Bitmap + text layout
        └── WallpaperScheduler.kt    — WorkManager periodic request
                    │
                    ▼
        WallpaperWorker.kt (runs every ~24h, with NO JS/bridge dependency)
                    │
                    ▼
        WallpaperContentStore + WallpaperGenerator + WallpaperManager.setStream(FLAG_LOCK)
```

The dividing line is deliberate: **everything above the dashed native
boundary can die (app closed, bridge torn down) without affecting anything
below it.** The worker only ever reads plain files/SharedPreferences and
calls plain Android APIs.

## 4. How the 24-hour scheduler works

- `WallpaperScheduler.schedule()` enqueues a WorkManager
  `PeriodicWorkRequest` with a 24-hour interval, using
  `enqueueUniquePeriodicWork(..., ExistingPeriodicWorkPolicy.KEEP, ...)`
  under the unique name `noordaily_daily_wallpaper_work`.
- **Chosen strategy (spec section 22, option 2): "24 hours from initial
  setup"**, not pinned to local midnight. This avoids the "enabled at
  11:59pm → changes at midnight → changes again minutes later" double-fire
  case entirely. The trade-off is that the exact time of day slowly drifts
  with whatever delay Android's Doze/battery optimizations introduce —
  WorkManager cannot promise exact timing, only "approximately every 24
  hours," which is what's implemented and what's shown to the user
  ("Next wallpaper: in about N hours").
- `WallpaperWorker` additionally checks `lastAppliedDateKey == today` before
  doing any work, so even if WorkManager runs early/late/twice it will never
  apply more than one wallpaper for the same calendar day.
- On failure (e.g. no cached content yet), the worker returns
  `Result.retry()`, which uses the linear backoff configured in
  `WallpaperScheduler`.
- Disabling calls `WorkManager.cancelUniqueWork(...)` and clears the
  `enabled` flag; `WallpaperBootReceiver` checks that flag before ever
  re-scheduling, so turning the feature off stays off across reboots too.

## 5. How lock-screen-only behavior works

`WallpaperManager.setStream(inputStream, null, true, WallpaperManager.FLAG_LOCK)`
is used everywhere the wallpaper is applied (both the worker and the
"Apply Now"/setup path in `WallpaperModule`). `FLAG_LOCK` (API 24+) targets
*only* the lock screen — the home screen is never touched.

- On API < 24 (below the app's own `minSdkVersion: 24`, so only a
  theoretical concern) there is no separate lock-screen API at all. The
  code detects this and reports `LOCK_SCREEN_UNSUPPORTED` rather than
  silently falling back to `FLAG_SYSTEM` (which would change the user's
  home screen — explicitly disallowed by the spec).
- `checkWallpaperSetup()` is called *before* the UI ever says "Enabled":
  it checks `WallpaperManager.isWallpaperSupported` and (API 24+)
  `isSetWallpaperAllowed` (some device-policy-managed devices disable
  wallpaper changes entirely) and returns a `setup_required`-style result
  if either is false. The JS layer (`enableWallpaperAutomation()`) treats
  anything other than `success: true` here as "don't claim success."

## 6. How wallpaper generation works

`WallpaperGenerator.generateBitmap()`:
1. Gets the canvas size from `WallpaperManager.desiredMinimumWidth/Height`
   (falling back to the real display metrics, then to a 1080×1920 floor) —
   never a hard-coded resolution.
2. Draws one flat `canvas.drawColor(backgroundColor)` — solid color only.
3. Builds `StaticLayout` text blocks (Arabic Ayah, Ayah translation +
   reference, a thin divider, Arabic Hadith, Hadith translation +
   reference + grade, and a small footer) with every font size expressed as
   a *fraction of the canvas width/height* (not fixed px), so layout scales
   correctly on any screen size/aspect ratio.
4. Iteratively shrinks all font sizes together (down to 40% of their base
   size) until the whole stack fits the vertical "safe area" — the top 16%
   of the screen is reserved for the system clock/date the same way real
   Android lock screens draw it, and 7% is reserved at the bottom. **Text
   is never truncated or ellipsized** — only the size shrinks.
5. Centers the whole block vertically in the safe area and draws it.

## 7. How Quran/Hadith content is selected

Nothing new was invented here — `wallpaperService.getWallpaperContentForDate()`
calls the **existing** `dailyContentService.getDailyAyah()` /
`getDailyHadith()`, which deterministically map a calendar date to an index
into the existing `data/quran.js` / `data/hadith.js` arrays
(`(dayOfYear - 1) % pool.length`). The same date always produces the same
content — reopening the app never re-rolls "today." The wallpaper's solid
color is chosen the same deterministic way from `constants/wallpaperColors.js`
(a different stride than the content index, purely so the color doesn't
always change in lockstep with which pool index is showing).

Because the native `WallpaperWorker` cannot call this JS logic directly, a
window of **400 days** of pre-computed `{ayah, hadith, color}` entries is
built in JS (`buildContentCache`) and pushed to native as one JSON blob
(`syncNativeContentCache`) every time the app is opened, and once more right
before `enableWallpaperAutomation()` finishes. The native worker just looks
up today's date-key in that cached JSON — this is what lets it work with
zero JS/bridge dependency, without duplicating the Quran/Hadith datasets in
Kotlin. If the cache window is ever exhausted (the app hasn't been opened in
over a year), the worker degrades to the closest earlier cached date rather
than crashing or skipping a day.

## 8. How state persists / reboot handling

- **JS-visible state** (`enabled`, `setupComplete`, `lastAppliedAt`, `nextAt`,
  current wallpaper id/color, last error) is mirrored into `AsyncStorage`
  via the existing `storageService.js` pattern purely so the UI has
  something to render instantly; the **native `SharedPreferences`
  (`WallpaperContentStore`) is the actual source of truth** the worker
  reads from.
- WorkManager's own periodic-work database already survives process death,
  app-kill, and normal reboots on its own. `WallpaperBootReceiver` (listens
  for `BOOT_COMPLETED`) is an extra safety net for OEM Android skins that
  aggressively clear scheduled jobs — it just re-enqueues the same unique
  work (`KEEP` policy), and only if the `enabled` flag is still true, so a
  user who never turned this on is never surprised by it starting after a
  reboot, and a user who has it on is never forced through setup again.

## 9. Manual native integration (if you don't use the config plugin)

If your real project already has a checked-in `android/` folder and you
don't plan to run `expo prebuild --clean` again, apply these by hand
instead of relying on `plugins/withDailyWallpaper.js`:

1. **Copy the Kotlin files** from `native-android/wallpaper/*.kt` into
   `android/app/src/main/java/com/noordaily/app/wallpaper/` (adjust the
   `package` line at the top of each file if your actual package differs
   from `com.noordaily.app`).
2. **Register the module** — in
   `android/app/src/main/java/com/noordaily/app/MainApplication.kt`, inside
   `getPackages()`, add `packages.add(WallpaperPackage())` before
   `return packages`, and add
   `import com.noordaily.app.wallpaper.WallpaperPackage` near the top.
3. **Add the WorkManager dependency** — in `android/app/build.gradle`,
   inside the `dependencies { ... }` block:
   ```groovy
   implementation("androidx.work:work-runtime-ktx:2.9.0")
   ```
4. **Declare the boot receiver** — in
   `android/app/src/main/AndroidManifest.xml`, inside `<application>`:
   ```xml
   <receiver
       android:name=".wallpaper.WallpaperBootReceiver"
       android:exported="true"
       android:enabled="true">
     <intent-filter>
       <action android:name="android.intent.action.BOOT_COMPLETED" />
     </intent-filter>
   </receiver>
   ```
   and make sure `<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />`
   is present (already added via `app.json` → `android.permissions` if you
   do run prebuild; add it by hand otherwise).

## 10. Permissions

Only `RECEIVE_BOOT_COMPLETED` was added (a normal, non-dangerous permission
— no runtime prompt). The feature deliberately uses **WorkManager only**,
never `AlarmManager`/exact alarms, so it does **not** need
`SCHEDULE_EXACT_ALARM`. That permission already existed in `app.json` before
this feature was added and isn't referenced anywhere in this feature's
code; it was left as-is since removing it is outside this feature's scope
— if nothing else in the app uses it either, it's safe to drop separately.
No storage/contacts/location/camera/microphone permissions were added.

## 11. Exact commands

Install the one thing this feature doesn't add (nothing — no new npm
packages are required; `androidx.work` is a native Gradle dependency, not
an npm one):

```bash
# from the project root
npm install
```

Generate/refresh the native Android project (this is what runs
`plugins/withDailyWallpaper.js`):

```bash
npx expo prebuild -p android
```

Development build & run on a connected device/emulator (Expo Go cannot run
the native module):

```bash
npx expo run:android
```

Production Android build (e.g. via EAS):

```bash
eas build -p android --profile production
```

## 12. Testing checklist

Beyond the app's existing functionality (unaffected — see Section 2), walk
through:

1. Home → "Enable Daily Wallpaper" (or Onboarding step 4, or Settings).
2. Confirm the toggle only shows "Active" after the native call actually
   returns `success: true` (never optimistically).
3. Settings → **Preview Today's Wallpaper** — matches the Ayah/Hadith shown
   on Home for the same date.
4. Settings → **Apply Now** — lock the device and confirm only the lock
   screen changed, not the home screen wallpaper.
5. Force-stop the app and swipe it out of Recents. Confirm the app relaunch
   afterwards still shows "Active" / correct next-change estimate.
6. Reboot the device (or `adb shell am broadcast -a android.intent.action.BOOT_COMPLETED`
   on a rooted emulator) and confirm the schedule is still active without
   re-opening the app or redoing setup.
7. Settings → **Reset Wallpaper Settings** — automation turns off and
   history clears; re-enabling works cleanly afterward.
8. On iOS: confirm the Home card and onboarding step clearly state this is
   an Android feature and never claim automatic updates work there.
