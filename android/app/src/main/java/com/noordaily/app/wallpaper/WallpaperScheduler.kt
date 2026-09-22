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
 * The wallpaper changes approximately every 24 hours after the feature
 * is enabled. WorkManager may delay execution because of Android's
 * battery and Doze optimizations.
 */
object WallpaperScheduler {

    private const val WORK_NAME = "noordaily_daily_wallpaper_work"
    private const val INTERVAL_HOURS = 24L

    fun schedule(context: Context) {

        val constraints = Constraints.Builder()
            // No network or charging requirement.
            // The wallpaper generation works completely offline.
            .build()

        val request =
            PeriodicWorkRequest.Builder(
                WallpaperWorker::class.java,
                INTERVAL_HOURS,
                TimeUnit.HOURS
            )
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.LINEAR,
                    10_000L,
                    TimeUnit.MILLISECONDS
                )
                .build()

        // KEEP means an existing schedule won't be replaced.
        // This preserves the existing 24-hour countdown after reboot.
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