package com.noordaily.app.wallpaper

import android.app.WallpaperManager
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import java.io.FileInputStream

private const val TAG = "NoorDailyWallpaper"

/**
 * Runs approximately every 24 hours via WorkManager (see
 * WallpaperScheduler). This is the piece that makes the feature work
 * with NoorDaily fully closed / removed from recents / after a reboot —
 * it never touches the React Native bridge or JS at all, only:
 *   1. SharedPreferences + the JSON content cache (WallpaperContentStore)
 *   2. Native Canvas/Bitmap generation (WallpaperGenerator)
 *   3. Android's WallpaperManager
 */
class WallpaperWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        Log.d(TAG, "Worker executed")

        if (!WallpaperContentStore.isEnabled(applicationContext)) {
            Log.d(TAG, "Automation disabled — no update required")
            return Result.success()
        }

        val todayKey = WallpaperContentStore.todayDateKey()
        val lastAppliedKey = WallpaperContentStore.getLastAppliedDateKey(applicationContext)

        if (lastAppliedKey == todayKey) {
            // Already changed today — WorkManager can occasionally run a
            // little early/late/twice; never double-apply within a day.
            Log.d(TAG, "No update required — already applied for $todayKey")
            return Result.success()
        }

        Log.d(TAG, "Generating today's wallpaper")
        val entry = WallpaperContentStore.findEntryForDate(applicationContext, todayKey)
        if (entry == null) {
            Log.w(TAG, "No cached content available for $todayKey — will retry")
            WallpaperContentStore.setLastError(applicationContext, "NO_CONTENT_AVAILABLE")
            return Result.retry()
        }

        return try {
            val bitmap = WallpaperGenerator.generateBitmap(applicationContext, entry)
            val file = WallpaperGenerator.saveBitmapToFile(applicationContext, bitmap, "wallpaper_$todayKey.png")

            Log.d(TAG, "Applying wallpaper")
            var lockSupported = true
            try {
                FileInputStream(file).use { stream ->
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        WallpaperManager.getInstance(applicationContext)
                            .setStream(stream, null, true, WallpaperManager.FLAG_LOCK)
                    } else {
                        // Pre-Android 7 devices have no separate lock-screen
                        // wallpaper API. Per spec: never fall back to
                        // silently changing the home screen instead.
                        lockSupported = false
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "WallpaperManager rejected the lock-screen target", e)
                lockSupported = false
            }

            val nowIso = WallpaperContentStore.nowIso()

            if (lockSupported) {
                WallpaperContentStore.setLastAppliedAt(applicationContext, nowIso)
                WallpaperContentStore.setLastAppliedDateKey(applicationContext, todayKey)
                WallpaperContentStore.setCurrentId(applicationContext, entry.optString("id"))
                WallpaperContentStore.setCurrentColor(applicationContext, entry.optString("backgroundColor"))
                WallpaperContentStore.setLastError(applicationContext, null)
                WallpaperContentStore.setLockSupported(applicationContext, true)
                WallpaperContentStore.appendHistory(applicationContext, entry, "success", nowIso)
                WallpaperGenerator.cleanupOldWallpapers(applicationContext)
                Log.d(TAG, "Wallpaper applied successfully")
                Log.d(TAG, "Scheduling next wallpaper")
                Result.success()
            } else {
                WallpaperContentStore.setLastError(applicationContext, "LOCK_SCREEN_UNSUPPORTED")
                WallpaperContentStore.setLockSupported(applicationContext, false)
                WallpaperContentStore.appendHistory(applicationContext, entry, "failed_unsupported", nowIso)
                Result.failure()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Wallpaper generation failed", e)
            WallpaperContentStore.setLastError(applicationContext, "GENERATION_FAILED")
            Result.retry()
        }
    }
}
