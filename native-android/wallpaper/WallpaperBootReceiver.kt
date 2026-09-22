package com.noordaily.app.wallpaper

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * WorkManager's own periodic work already survives a reboot (it's backed
 * by a persisted Room database), so in the common case this receiver has
 * nothing to do. It exists as a safety net for OEM Android skins that
 * aggressively clear scheduled jobs on boot, and to make the "restore
 * scheduling after reboot, don't force setup again" requirement explicit
 * and testable rather than implicit.
 *
 * Declared in AndroidManifest.xml (added automatically by
 * plugins/withDailyWallpaper.js). Requires RECEIVE_BOOT_COMPLETED, which
 * is a normal (non-dangerous) permission — no runtime prompt needed.
 */
class WallpaperBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        if (WallpaperContentStore.isEnabled(context)) {
            WallpaperScheduler.schedule(context)
            Log.d("NoorDailyWallpaper", "Boot completed — daily wallpaper schedule restored")
        }
    }
}
