package expo.modules.pillreminders

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONObject
import java.time.Instant
import java.time.ZoneId
import java.util.concurrent.Executors

class PillWidgetProvider : AppWidgetProvider() {
  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    // Includes widget add/resize/periodic refresh and our own boundary alarm.
    val pending = goAsync()
    executor.execute {
      try { PillWidget.update(context.applicationContext) } finally { pending.finish() }
    }
  }

  companion object { private val executor = Executors.newSingleThreadExecutor() }
}

object PillWidget {
  private const val UPDATE = "expo.modules.pillreminders.WIDGET_REFRESH"

  private fun operation(context: Context) = PendingIntent.getBroadcast(context, 8300,
    Intent(context, PillWidgetProvider::class.java).setAction(UPDATE),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

  fun read(context: Context, now: Instant, zone: ZoneId): Pair<WidgetState, RoutineSettings?> {
    PillDatabase.open(context)?.use { database ->
      database.rawQuery("PRAGMA user_version", null).use {
        require(it.moveToFirst() && it.getInt(0) == 2)
      }
      // One read transaction keeps preferences, confirmations and delivery limits consistent.
      database.beginTransactionNonExclusive()
      try {
        val settings = database.rawQuery("SELECT version, value FROM app_preferences WHERE id = 1", null).use {
          if (!it.moveToFirst()) null else {
            require(it.getInt(0) == 1)
            val value = JSONObject(it.getString(1))
            RoutineSettings(value.getInt("routineHour"), value.getInt("routineMinute"),
              value.getInt("firstDelayMinutes"), value.getInt("criticalDelayMinutes"), value.getBoolean("remindersEnabled"))
          }
        }
        val records = mutableSetOf<String>()
        database.rawQuery("SELECT routine_date FROM pill_records WHERE routine_date <= ?",
          arrayOf(now.atZone(zone).toLocalDate().toString())).use { while (it.moveToNext()) records.add(it.getString(0)) }
        val delivered = mutableSetOf<Pair<String, Int>>()
        val hasLedger = database.rawQuery("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'reminder_deliveries'", null).use { it.moveToFirst() }
        if (hasLedger) database.rawQuery("SELECT routine_date, sequence FROM reminder_deliveries WHERE routine_date >= ?",
          arrayOf(now.atZone(zone).toLocalDate().minusDays(1).toString())).use {
          while (it.moveToNext()) delivered.add(it.getString(0) to it.getInt(1))
        }
        val state = WidgetPlanner.state(settings, now, zone, records, delivered)
        database.setTransactionSuccessful()
        return state to settings
      } finally { database.endTransaction() }
    }
    return WidgetState("Pill Tracker", "Open to set up", null) to null
  }

  @Synchronized
  fun update(context: Context) {
    try {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, PillWidgetProvider::class.java))
      val alarms = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      alarms.cancel(operation(context))
      if (ids.isEmpty()) return
      val now = Instant.now()
      val zone = ZoneId.systemDefault()
      var failed = false
      val (state, settings) = try { read(context, now, zone) } catch (_: Exception) {
        failed = true
        WidgetState("Pill Tracker", "Open to refresh", null) to null
      }
      ids.forEach { id ->
        val views = RemoteViews(context.packageName, R.layout.pill_widget)
        views.setTextViewText(R.id.widget_title, state.title)
        views.setTextViewText(R.id.widget_detail, state.detail)
        views.setTextColor(R.id.widget_title, Color.parseColor(if (state.taken) "#9BF2CD" else "#FFFFFF"))
        views.setContentDescription(R.id.widget_root, "${state.title}. ${state.detail}. Open Pill Tracker")
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
        if (launch != null) {
          val scheme = if (context.packageName.endsWith(".test")) "pill-tracker-test" else "pill-tracker-dev"
          launch.action = Intent.ACTION_VIEW
          launch.data = Uri.parse("$scheme://home")
          launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
          views.setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(context, 8400 + id, launch,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
        }
        manager.updateAppWidget(id, views)
      }
      // A non-wakeup inexact alarm updates time-dependent text without borrowing reminder slots.
      val due = if (failed) now.plusSeconds(1800) else WidgetPlanner.nextChange(settings, now, zone)
      alarms.set(AlarmManager.RTC, due.toEpochMilli(), operation(context))
    } catch (error: Exception) {
      // Widget failures must never turn a committed record into a reported storage/reminder failure.
      android.util.Log.e("PillWidget", "Widget update failed: ${error.javaClass.simpleName}")
    }
  }
}
