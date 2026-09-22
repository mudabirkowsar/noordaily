package com.noordaily.app.wallpaper

import android.app.WallpaperManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

/**
 * Draws one wallpaper: a single flat solid-color background (no images,
 * gradients, or patterns) with the day's Ayah and Hadith rendered as
 * text. Runs entirely natively so it works with no JS bridge — WorkManager
 * calls this directly from a background thread.
 *
 * Sizing is resolution-independent: the canvas size comes from
 * WallpaperManager's own "desired minimum" dimensions (falling back to
 * the device's real display metrics), and every font size is derived as
 * a fraction of that width rather than a hard-coded pixel value, so the
 * same code produces a correctly-proportioned wallpaper on small and
 * large phones alike. Font sizes shrink together, in a loop, until the
 * content fits the safe area — text is never truncated or ellipsized.
 */
object WallpaperGenerator {

    private const val MIN_WIDTH = 1080
    private const val MIN_HEIGHT = 1920
    private const val MIN_SCALE = 0.4f // never shrink text below 40% of its starting size
    private const val SHRINK_STEP = 0.94f

    private fun targetSize(context: Context): Pair<Int, Int> {
        val wm = WallpaperManager.getInstance(context)
        var width = try { wm.desiredMinimumWidth } catch (e: Exception) { 0 }
        var height = try { wm.desiredMinimumHeight } catch (e: Exception) { 0 }

        if (width <= 0 || height <= 0) {
            val metrics = context.resources.displayMetrics
            width = metrics.widthPixels
            height = metrics.heightPixels
        }

        if (width < MIN_WIDTH) width = MIN_WIDTH
        if (height < MIN_HEIGHT) height = MIN_HEIGHT
        return Pair(width, height)
    }

    private fun textPaint(sizePx: Float, color: Int, isBold: Boolean = false, isItalic: Boolean = false): TextPaint {
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG)
        paint.textSize = sizePx
        paint.color = color
        paint.textAlign = Paint.Align.LEFT // StaticLayout handles centering via ALIGN_CENTER
        if (isBold && isItalic) paint.typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD_ITALIC)
        else if (isBold) paint.typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
        else if (isItalic) paint.typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.ITALIC)
        return paint
    }

    private fun buildLayout(text: String, paint: TextPaint, maxWidth: Int, lineSpacingMultiplier: Float = 1.15f): StaticLayout {
        val builder = StaticLayout.Builder.obtain(text, 0, text.length, paint, maxWidth)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setLineSpacing(0f, lineSpacingMultiplier)
            .setIncludePad(false)
        return builder.build()
    }

    /** One piece of text (e.g. the Ayah translation) at a given base font-size fraction of width. */
    private class TextBlock(
        val text: String,
        val baseSizeFraction: Float,
        val color: Int,
        val bold: Boolean = false,
        val italic: Boolean = false,
        val spacingAfterFraction: Float = 0.018f // vertical gap after this block, as a fraction of bitmap height
    )

    /**
     * Renders the given non-empty text blocks at [scale] (1.0 = full base
     * size) within [maxWidth], returning the built layouts plus total
     * height including inter-block spacing, so callers can shrink
     * [scale] in a loop until everything fits.
     */
    private fun layoutBlocks(
        blocks: List<TextBlock>,
        width: Int,
        height: Int,
        maxWidth: Int,
        scale: Float
    ): Pair<List<StaticLayout>, Int> {
        val layouts = mutableListOf<StaticLayout>()
        var totalHeight = 0
        for (block in blocks) {
            // Blocks are pre-filtered by the caller to only include
            // non-blank text, so `blocks` and `layouts` always stay
            // index-aligned (relied on by the draw loop below).
            val sizePx = (width * block.baseSizeFraction * scale).coerceAtLeast(1f)
            val paint = textPaint(sizePx, block.color, block.bold, block.italic)
            val layout = buildLayout(block.text, paint, maxWidth)
            layouts.add(layout)
            totalHeight += layout.height + (height * block.spacingAfterFraction * scale).toInt()
        }
        return Pair(layouts, totalHeight)
    }

    fun generateBitmap(context: Context, content: JSONObject): Bitmap {
        val (width, height) = targetSize(context)

        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        val backgroundHex = content.optString("backgroundColor", "#14532D")
        val backgroundColor = try { Color.parseColor(backgroundHex) } catch (e: Exception) { Color.parseColor("#14532D") }
        canvas.drawColor(backgroundColor)

        val isLightText = content.optString("textStyle", "light") != "dark"
        val primary = if (isLightText) Color.parseColor("#FFFFFF") else Color.parseColor("#1F2933")
        val secondary = if (isLightText) Color.parseColor("#E5E7EB") else Color.parseColor("#374151")
        val muted = if (isLightText) Color.parseColor("#9CA3AF") else Color.parseColor("#6B7280")
        val dividerColor = if (isLightText) Color.parseColor("#4DFFFFFF") else Color.parseColor("#4D1F2933")

        val ayah = content.optJSONObject("ayah")
        val hadith = content.optJSONObject("hadith")

        // Safe area: reserve space at the top for the system clock/date
        // that Android draws on the lock screen, and a small margin at
        // the bottom, so generated text never collides with system UI.
        val topReserve = (height * 0.16f).toInt()
        val bottomReserve = (height * 0.07f).toInt()
        val horizontalPadding = (width * 0.09f).toInt()
        val maxTextWidth = width - horizontalPadding * 2
        val footerHeight = (height * 0.045f).toInt()
        val availableHeight = height - topReserve - bottomReserve - footerHeight

        val blocks = mutableListOf<TextBlock>()
        val ayahArabic = ayah?.optString("arabic").orEmpty()
        val ayahTranslation = ayah?.optString("translation").orEmpty()
        val ayahReference = ayah?.optString("reference").orEmpty()
        val hadithArabic = hadith?.optString("arabic").orEmpty()
        val hadithTranslation = hadith?.optString("translation").orEmpty()
        val hadithReference = hadith?.optString("reference").orEmpty()

        if (ayahArabic.isNotBlank()) {
            blocks.add(TextBlock(ayahArabic, 0.062f, primary, bold = false, spacingAfterFraction = 0.020f))
        }
        if (ayahTranslation.isNotBlank()) {
            blocks.add(TextBlock("\u201C$ayahTranslation\u201D", 0.042f, primary, italic = true, spacingAfterFraction = 0.012f))
        }
        if (ayahReference.isNotBlank()) {
            blocks.add(TextBlock(ayahReference, 0.028f, secondary, bold = true, spacingAfterFraction = 0.035f))
        }
        // Divider is drawn manually between the two sections (see below),
        // so it isn't part of the text-block list.
        if (hadithArabic.isNotBlank()) {
            blocks.add(TextBlock(hadithArabic, 0.040f, primary, spacingAfterFraction = 0.016f))
        }
        if (hadithTranslation.isNotBlank()) {
            blocks.add(TextBlock(hadithTranslation, 0.034f, primary, spacingAfterFraction = 0.012f))
        }
        if (hadithReference.isNotBlank()) {
            val gradeSuffix = hadith?.optString("grade").orEmpty()
            val refText = if (gradeSuffix.isNotBlank()) "$hadithReference \u00B7 $gradeSuffix" else hadithReference
            blocks.add(TextBlock(refText, 0.026f, secondary, bold = true))
        }

        val dividerHeightAllowance = (height * 0.045f).toInt() // space reserved for the divider line + its margins

        // Iteratively shrink font sizes until everything (both blocks +
        // divider allowance) fits the available safe-area height. Text
        // content itself is never cut or ellipsized — only the size
        // shrinks, down to MIN_SCALE.
        var scale = 1.0f
        var layouts: List<StaticLayout>
        var contentHeight: Int
        while (true) {
            val (builtLayouts, totalHeight) = layoutBlocks(blocks, width, height, maxTextWidth, scale)
            layouts = builtLayouts
            contentHeight = totalHeight + dividerHeightAllowance
            if (contentHeight <= availableHeight || scale <= MIN_SCALE) break
            scale *= SHRINK_STEP
        }

        // Draw everything, centered as a whole vertical block within the
        // safe area (so short days don't look top-heavy, long days still
        // fit without overlapping the clock or bottom edge).
        var cursorY = topReserve + maxOf(0, (availableHeight - contentHeight) / 2)
        val ayahBlockCount = listOf(ayahArabic, ayahTranslation, ayahReference).count { it.isNotBlank() }

        for ((index, layout) in layouts.withIndex()) {
            canvas.save()
            canvas.translate(horizontalPadding.toFloat(), cursorY.toFloat())
            layout.draw(canvas)
            canvas.restore()

            val block = blocks[index]
            cursorY += layout.height + (height * block.spacingAfterFraction * scale).toInt()

            // Draw the divider immediately after the last Ayah block.
            if (index == ayahBlockCount - 1 && ayahBlockCount > 0) {
                val dividerWidth = (width * 0.22f)
                val dividerY = cursorY + (dividerHeightAllowance / 2f)
                val paint = Paint(Paint.ANTI_ALIAS_FLAG)
                paint.color = dividerColor
                paint.strokeWidth = maxOf(2f, width * 0.0025f)
                canvas.drawLine(
                    (width - dividerWidth) / 2f, dividerY,
                    (width + dividerWidth) / 2f, dividerY,
                    paint
                )
                cursorY += dividerHeightAllowance
            }
        }

        // Footer: app name + date, small and unobtrusive.
        val footerText = buildFooterText(content.optString("date"))
        val footerPaint = textPaint(height * 0.018f, muted)
        val footerLayout = buildLayout(footerText, footerPaint, maxTextWidth)
        canvas.save()
        canvas.translate(
            horizontalPadding.toFloat(),
            (height - bottomReserve - footerLayout.height).toFloat()
        )
        footerLayout.draw(canvas)
        canvas.restore()

        return bitmap
    }

    private fun buildFooterText(dateKey: String?): String {
        if (dateKey.isNullOrBlank()) return "NoorDaily"
        return try {
            val parser = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
            val formatter = java.text.SimpleDateFormat("EEEE, MMMM d", java.util.Locale.US)
            val date = parser.parse(dateKey)
            if (date != null) "NoorDaily \u00B7 ${formatter.format(date)}" else "NoorDaily"
        } catch (e: Exception) {
            "NoorDaily"
        }
    }

    private fun wallpaperDir(context: Context): File {
        val dir = File(context.filesDir, "noordaily_wallpapers")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun saveBitmapToFile(context: Context, bitmap: Bitmap, fileName: String): File {
        val file = File(wallpaperDir(context), fileName)
        FileOutputStream(file).use { out ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
        }
        return file
    }

    /** Keeps only the most recent [keep] generated wallpaper images. */
    fun cleanupOldWallpapers(context: Context, keep: Int = 5) {
        val dir = wallpaperDir(context)
        val files = dir.listFiles()?.sortedByDescending { it.lastModified() } ?: return
        if (files.size <= keep) return
        for (file in files.drop(keep)) {
            file.delete()
        }
    }
}
