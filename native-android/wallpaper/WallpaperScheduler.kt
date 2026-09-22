package com.noordaily.app.wallpaper

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequest
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

/**
 * Owns the recurring background schedule for the Daily Wallpaper feature.
 *
 * Strategy chosen (spec section 22 offers two valid options — this app
 * uses the second one): each wallpaper change happens **~24 hours after
 * the previous one**, starting from whenever the user first enables the
 * feature — not pinned to local midnight. This sidesteps the "enabled at
 * 11:59pm, changes at midnight, changes again minutes later" edge case
 * entirely, at the cost of the daily change time slowly drifting by
 * whatever delay Android's battery/Doze optimizations introduce. That
 * trade-off is called out to the user in Settings ("changes about every
 * 24 hours from when you enabled it").
 *
 * WorkManager cannot promise exact timing (Android's own battery
 * optimizations may delay a run) — "approximately every 24 hours" is the
 * real-world guarantee here, which matches the spec's requirement.
 */
object WallpaperScheduler {

    private const val WORK_NAME = "noordaily_daily_wallpaper_work"
    private const val INTERVAL_HOURS = 24L

    fun schedule(context: Context) {
        val constraints = Constraints.Builder()
            // Deliberately unconstrained (no network/charging requirement):
            // the whole point is that this works fully offline, and the
            // work itself is cheap (draw a bitmap, write two small files).
            .build()

        val request = PeriodicWorkRequest.Builder(WallpaperWorker::class.java, INTERVAL_HOURS, TimeUnit.HOURS)
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.LINEAR,
                PeriodicWorkRequest.MIN_BACKOFF_MILLIS,
                TimeUnit.MILLISECONDS
            )
            .build()

        // KEEP: if a schedule already exists (e.g. WallpaperBootReceiver
        // re-registering it after a reboot) leave its existing timing
        // alone instead of resetting the 24h countdown.
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            request
        )
    }

    fun cancel(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
    }
}
