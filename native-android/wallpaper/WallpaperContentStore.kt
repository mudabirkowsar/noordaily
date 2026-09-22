package com.noordaily.app.wallpaper

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/**
 * All persistent state for the Daily Wallpaper feature lives here:
 *  - a small SharedPreferences file for flags/status (enabled, last/next
 *    applied timestamps, current wallpaper id/color, last error, a
 *    capped history list)
 *  - one JSON file (app-private, internal storage) holding a rolling
 *    window of pre-computed daily content, synced from JavaScript
 *    (see wallpaperService.buildContentCache in the JS layer)
 *
 * Everything here is plain Android APIs (SharedPreferences + java.io +
 * org.json) so the WorkManager worker can read it with zero dependency
 * on the React Native bridge being alive.
 */
object WallpaperContentStore {

    private const val PREFS_NAME = "noordaily_wallpaper_prefs"
    private const val CACHE_FILE_NAME = "noordaily_wallpaper_content_cache.json"
    private const val MAX_HISTORY = 30

    private const val KEY_ENABLED = "enabled"
    private const val KEY_LAST_APPLIED_AT = "last_applied_at"
    private const val KEY_LAST_APPLIED_DATE_KEY = "last_applied_date_key"
    private const val KEY_CURRENT_ID = "current_id"
    private const val KEY_CURRENT_COLOR = "current_color"
    private const val KEY_LAST_ERROR = "last_error"
    private const val KEY_LOCK_SUPPORTED = "lock_supported"
    private const val KEY_HISTORY = "history_json"

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    // ---- Enabled flag ----
    fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, false)
    fun setEnabled(context: Context, value: Boolean) {
        prefs(context).edit().putBoolean(KEY_ENABLED, value).apply()
    }

    // ---- Status fields ----
    fun getLastAppliedAt(context: Context): String? = prefs(context).getString(KEY_LAST_APPLIED_AT, null)
    fun setLastAppliedAt(context: Context, iso: String?) {
        prefs(context).edit().putString(KEY_LAST_APPLIED_AT, iso).apply()
    }

    fun getLastAppliedDateKey(context: Context): String? =
        prefs(context).getString(KEY_LAST_APPLIED_DATE_KEY, null)
    fun setLastAppliedDateKey(context: Context, dateKey: String?) {
        prefs(context).edit().putString(KEY_LAST_APPLIED_DATE_KEY, dateKey).apply()
    }

    fun getCurrentId(context: Context): String? = prefs(context).getString(KEY_CURRENT_ID, null)
    fun setCurrentId(context: Context, id: String?) {
        prefs(context).edit().putString(KEY_CURRENT_ID, id).apply()
    }

    fun getCurrentColor(context: Context): String? = prefs(context).getString(KEY_CURRENT_COLOR, null)
    fun setCurrentColor(context: Context, hex: String?) {
        prefs(context).edit().putString(KEY_CURRENT_COLOR, hex).apply()
    }

    fun getLastError(context: Context): String? = prefs(context).getString(KEY_LAST_ERROR, null)
    fun setLastError(context: Context, code: String?) {
        prefs(context).edit().putString(KEY_LAST_ERROR, code).apply()
    }

    fun isLockSupported(context: Context): Boolean = prefs(context).getBoolean(KEY_LOCK_SUPPORTED, true)
    fun setLockSupported(context: Context, value: Boolean) {
        prefs(context).edit().putBoolean(KEY_LOCK_SUPPORTED, value).apply()
    }

    // ---- Content cache (written by JS, read by the worker/module) ----
    private fun cacheFile(context: Context): File = File(context.filesDir, CACHE_FILE_NAME)

    fun saveContentCache(context: Context, json: String) {
        cacheFile(context).writeText(json)
    }

    fun readContentCache(context: Context): JSONObject? {
        val file = cacheFile(context)
        if (!file.exists()) return null
        return try {
            JSONObject(file.readText())
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Finds the pre-computed content entry for [dateKey] ("yyyy-MM-dd").
     * If the exact date isn't in the cache (e.g. the app hasn't been
     * opened in a very long time and the rolling window ran out), falls
     * back to the most recent entry with a date <= today rather than
     * failing outright — the worker should degrade gracefully, not skip
     * a day silently forever.
     */
    fun findEntryForDate(context: Context, dateKey: String): JSONObject? {
        val cache = readContentCache(context) ?: return null
        val entries = cache.optJSONArray("entries") ?: return null

        var fallback: JSONObject? = null
        for (i in 0 until entries.length()) {
            val entry = entries.optJSONObject(i) ?: continue
            val entryDate = entry.optString("date")
            if (entryDate == dateKey) return entry
            if (entryDate <= dateKey) {
                // Track the closest past entry as a fallback candidate.
                if (fallback == null || entryDate > fallback.optString("date")) {
                    fallback = entry
                }
            }
        }
        return fallback ?: entries.optJSONObject(0)
    }

    // ---- History (capped list of applied wallpapers) ----
    fun getHistoryArray(context: Context): JSONArray {
        val raw = prefs(context).getString(KEY_HISTORY, null) ?: return JSONArray()
        return try {
            JSONArray(raw)
        } catch (e: Exception) {
            JSONArray()
        }
    }

    fun appendHistory(context: Context, entry: JSONObject, status: String, appliedAtIso: String) {
        val history = getHistoryArray(context)
        val record = JSONObject()
        record.put("id", entry.optString("id"))
        record.put("date", entry.optString("date"))
        record.put("backgroundColor", entry.optString("backgroundColor"))
        record.put("appliedAt", appliedAtIso)
        record.put("status", status)

        // Prepend (most recent first), then cap.
        val updated = JSONArray()
        updated.put(record)
        for (i in 0 until minOf(history.length(), MAX_HISTORY - 1)) {
            updated.put(history.get(i))
        }
        prefs(context).edit().putString(KEY_HISTORY, updated.toString()).apply()
    }

    // ---- Reset ----
    fun clearAll(context: Context) {
        prefs(context).edit().clear().apply()
        val file = cacheFile(context)
        if (file.exists()) file.delete()
        val wallpaperDir = File(context.filesDir, "noordaily_wallpapers")
        if (wallpaperDir.exists()) {
            wallpaperDir.listFiles()?.forEach { it.delete() }
        }
    }

    /** "yyyy-MM-dd" in the device's current local time zone. */
    fun todayDateKey(): String {
        val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        fmt.timeZone = TimeZone.getDefault()
        return fmt.format(java.util.Date())
    }

    private fun isoFormatter(): SimpleDateFormat {
        val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        fmt.timeZone = TimeZone.getTimeZone("UTC")
        return fmt
    }

    /**
     * ISO-8601 UTC timestamp for "now". Deliberately avoids java.time
     * (API 26+) so this works down to minSdkVersion 24 without requiring
     * core library desugaring.
     */
    fun nowIso(): String = isoFormatter().format(java.util.Date())

    /** ISO-8601 UTC timestamp [hours] hours after [iso] (or after now, if [iso] is null/invalid). */
    fun plusHoursIso(iso: String?, hours: Int): String {
        val base = try {
            if (iso != null) isoFormatter().parse(iso)?.time ?: System.currentTimeMillis()
            else System.currentTimeMillis()
        } catch (e: Exception) {
            System.currentTimeMillis()
        }
        return isoFormatter().format(java.util.Date(base + hours.toLong() * 60 * 60 * 1000))
    }
}
