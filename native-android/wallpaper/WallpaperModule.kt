package com.noordaily.app.wallpaper

import android.app.WallpaperManager
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.io.FileInputStream

/**
 * Bridges the Daily Wallpaper feature to JavaScript as `NoorWallpaperModule`
 * (see services/wallpaperNative.js on the JS side). Every method returns a
 * structured result object rather than throwing, so the JS layer never has
 * to catch a native crash to render an error state — see
 * `errorMap()`/`successMap()` below and requirement section 32
 * (Error Handling) in the feature spec.
 */
class WallpaperModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "NoorWallpaperModule"

    private fun errorMap(code: String, message: String?): WritableMap {
        val map = Arguments.createMap()
        map.putBoolean("success", false)
        map.putString("errorCode", code)
        map.putString("message", message ?: "Something went wrong.")
        return map
    }

    @ReactMethod
    fun syncContentCache(json: String, promise: Promise) {
        try {
            WallpaperContentStore.saveContentCache(reactApplicationContext, json)
            val map = Arguments.createMap()
            map.putBoolean("success", true)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.resolve(errorMap("CACHE_WRITE_FAILED", e.message))
        }
    }

    @ReactMethod
    fun checkWallpaperSetup(promise: Promise) {
        try {
            val ctx = reactApplicationContext
            val wallpaperManager = WallpaperManager.getInstance(ctx)

            val supported = try { wallpaperManager.isWallpaperSupported } catch (e: Exception) { true }
            if (!supported) {
                promise.resolve(errorMap("WALLPAPER_UNSUPPORTED", "This device does not support setting wallpapers."))
                return
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                val allowed = try { wallpaperManager.isSetWallpaperAllowed } catch (e: Exception) { true }
                if (!allowed) {
                    promise.resolve(
                        errorMap(
                            "WALLPAPER_DISALLOWED",
                            "Your device administrator has disabled changing the wallpaper."
                        )
                    )
                    return
                }
            }

            val lockScreenSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
            val map = Arguments.createMap()
            map.putBoolean("success", true)
            map.putBoolean("lockScreenSupported", lockScreenSupported)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.resolve(errorMap("SETUP_CHECK_FAILED", e.message))
        }
    }

    @ReactMethod
    fun generateAndApplyNow(force: Boolean, promise: Promise) {
        // Bitmap generation + disk + WallpaperManager I/O — keep it off
        // the module's calling thread.
        Thread {
            val ctx = reactApplicationContext
            try {
                val todayKey = WallpaperContentStore.todayDateKey()

                if (!force) {
                    val lastKey = WallpaperContentStore.getLastAppliedDateKey(ctx)
                    if (lastKey == todayKey) {
                        val map = Arguments.createMap()
                        map.putBoolean("success", true)
                        map.putString("id", WallpaperContentStore.getCurrentId(ctx))
                        map.putString("backgroundColor", WallpaperContentStore.getCurrentColor(ctx))
                        map.putString("appliedAt", WallpaperContentStore.getLastAppliedAt(ctx))
                        map.putString(
                            "nextAt",
                            WallpaperContentStore.plusHoursIso(WallpaperContentStore.getLastAppliedAt(ctx), 24)
                        )
                        promise.resolve(map)
                        return@Thread
                    }
                }

                val entry = WallpaperContentStore.findEntryForDate(ctx, todayKey)
                if (entry == null) {
                    promise.resolve(
                        errorMap(
                            "NO_CONTENT_AVAILABLE",
                            "No wallpaper content is available yet. Please reopen NoorDaily once and try again."
                        )
                    )
                    return@Thread
                }

                val bitmap = WallpaperGenerator.generateBitmap(ctx, entry)
                val file = WallpaperGenerator.saveBitmapToFile(ctx, bitmap, "wallpaper_$todayKey.png")

                var lockSupported = true
                try {
                    FileInputStream(file).use { stream ->
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            WallpaperManager.getInstance(ctx).setStream(stream, null, true, WallpaperManager.FLAG_LOCK)
                        } else {
                            lockSupported = false
                        }
                    }
                } catch (e: Exception) {
                    lockSupported = false
                }

                val nowIso = WallpaperContentStore.nowIso()

                if (lockSupported) {
                    WallpaperContentStore.setLastAppliedAt(ctx, nowIso)
                    WallpaperContentStore.setLastAppliedDateKey(ctx, todayKey)
                    WallpaperContentStore.setCurrentId(ctx, entry.optString("id"))
                    WallpaperContentStore.setCurrentColor(ctx, entry.optString("backgroundColor"))
                    WallpaperContentStore.setLastError(ctx, null)
                    WallpaperContentStore.setLockSupported(ctx, true)
                    WallpaperContentStore.appendHistory(ctx, entry, "success", nowIso)
                    WallpaperGenerator.cleanupOldWallpapers(ctx)

                    val map = Arguments.createMap()
                    map.putBoolean("success", true)
                    map.putString("id", entry.optString("id"))
                    map.putString("backgroundColor", entry.optString("backgroundColor"))
                    map.putString("appliedAt", nowIso)
                    map.putString("nextAt", WallpaperContentStore.plusHoursIso(nowIso, 24))
                    promise.resolve(map)
                } else {
                    WallpaperContentStore.setLastError(ctx, "LOCK_SCREEN_UNSUPPORTED")
                    WallpaperContentStore.setLockSupported(ctx, false)
                    WallpaperContentStore.appendHistory(ctx, entry, "failed_unsupported", nowIso)
                    promise.resolve(
                        errorMap(
                            "LOCK_SCREEN_UNSUPPORTED",
                            "This device/Android version doesn't support setting the lock screen wallpaper separately from the home screen."
                        )
                    )
                }
            } catch (e: Exception) {
                promise.resolve(errorMap("GENERATION_FAILED", e.message))
            }
        }.start()
    }

    @ReactMethod
    fun enableAutomation(promise: Promise) {
        try {
            WallpaperContentStore.setEnabled(reactApplicationContext, true)
            WallpaperScheduler.schedule(reactApplicationContext)
            val map = Arguments.createMap()
            map.putBoolean("success", true)
            map.putString("nextAt", WallpaperContentStore.plusHoursIso(WallpaperContentStore.nowIso(), 24))
            promise.resolve(map)
        } catch (e: Exception) {
            promise.resolve(errorMap("SCHEDULE_FAILED", e.message))
        }
    }

    @ReactMethod
    fun disableAutomation(promise: Promise) {
        try {
            WallpaperScheduler.cancel(reactApplicationContext)
            WallpaperContentStore.setEnabled(reactApplicationContext, false)
            val map = Arguments.createMap()
            map.putBoolean("success", true)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.resolve(errorMap("DISABLE_FAILED", e.message))
        }
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        try {
            val ctx = reactApplicationContext
            val enabled = WallpaperContentStore.isEnabled(ctx)
            val lastAppliedAt = WallpaperContentStore.getLastAppliedAt(ctx)

            val map = Arguments.createMap()
            map.putBoolean("enabled", enabled)
            map.putBoolean("lockScreenSupported", WallpaperContentStore.isLockSupported(ctx))
            map.putString("currentWallpaperId", WallpaperContentStore.getCurrentId(ctx))
            map.putString("backgroundColor", WallpaperContentStore.getCurrentColor(ctx))
            map.putString("lastAppliedAt", lastAppliedAt)
            map.putString(
                "nextAt",
                if (enabled && lastAppliedAt != null) WallpaperContentStore.plusHoursIso(lastAppliedAt, 24) else null
            )
            map.putString("lastError", WallpaperContentStore.getLastError(ctx))
            promise.resolve(map)
        } catch (e: Exception) {
            promise.resolve(errorMap("STATUS_READ_FAILED", e.message))
        }
    }

    @ReactMethod
    fun getHistory(promise: Promise) {
        try {
            val arr = WallpaperContentStore.getHistoryArray(reactApplicationContext)
            val writable: WritableArray = Arguments.createArray()
            for (i in 0 until arr.length()) {
                val obj = arr.optJSONObject(i) ?: continue
                val map = Arguments.createMap()
                map.putString("id", obj.optString("id"))
                map.putString("date", obj.optString("date"))
                map.putString("backgroundColor", obj.optString("backgroundColor"))
                map.putString("appliedAt", obj.optString("appliedAt"))
                map.putString("status", obj.optString("status"))
                writable.pushMap(map)
            }
            promise.resolve(writable)
        } catch (e: Exception) {
            promise.resolve(Arguments.createArray())
        }
    }

    @ReactMethod
    fun resetWallpaperState(promise: Promise) {
        try {
            WallpaperScheduler.cancel(reactApplicationContext)
            WallpaperContentStore.clearAll(reactApplicationContext)
            val map = Arguments.createMap()
            map.putBoolean("success", true)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.resolve(errorMap("RESET_FAILED", e.message))
        }
    }
}
