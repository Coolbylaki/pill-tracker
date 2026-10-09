package expo.modules.pillreminders

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.database.sqlite.SQLiteDatabase
import android.net.Uri
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

object ReminderEngine {
  const val DELIVER = "expo.modules.pillreminders.DELIVER"
  private const val REFRESH = "expo.modules.pillreminders.REFRESH"
  private const val CHANNEL = "pill-tracker-reminders"
  private const val TAG = "pill-routine:"
  private const val STORE = "pill-reminder-scheduler-v1"

  private fun alarms(context: Context) = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
  private fun notifications(context: Context) = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
  private fun store(context: Context) = context.getSharedPreferences(STORE, Context.MODE_PRIVATE)

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= 26) {
      val channel = NotificationChannel(CHANNEL, "Daily pill reminders", NotificationManager.IMPORTANCE_HIGH)
      channel.description = "First and final reminders for your daily routine"
      notifications(context).createNotificationChannel(channel)
    }
  }

  private fun notificationsAllowed(context: Context): Boolean {
    val manager = notifications(context)
    return manager.areNotificationsEnabled() && (Build.VERSION.SDK_INT < 26 || manager.getNotificationChannel(CHANNEL)?.importance != NotificationManager.IMPORTANCE_NONE)
  }

  private fun exactAllowed(context: Context) = Build.VERSION.SDK_INT < 31 || alarms(context).canScheduleExactAlarms()

  private fun openDatabase(context: Context): SQLiteDatabase? {
    val file = File(context.filesDir, "SQLite/pill-tracker.db")
    if (!file.exists()) return null
    val database = SQLiteDatabase.openDatabase(file.path, null, SQLiteDatabase.OPEN_READWRITE or SQLiteDatabase.NO_LOCALIZED_COLLATORS)
    try {
      database.rawQuery("PRAGMA user_version", null).use { require(it.moveToFirst() && it.getInt(0) == 2) { "Unknown pill database version" } }
      database.execSQL("CREATE TABLE IF NOT EXISTS reminder_deliveries (routine_date TEXT NOT NULL, sequence INTEGER NOT NULL CHECK (sequence IN (1, 2)), delivered_at TEXT NOT NULL, PRIMARY KEY (routine_date, sequence))")
      return database
    } catch (error: Exception) { database.close(); throw error }
  }

  private fun settings(database: SQLiteDatabase): RoutineSettings? = database.rawQuery("SELECT version, value FROM app_preferences WHERE id = 1", null).use { cursor ->
    if (!cursor.moveToFirst()) return@use null
    require(cursor.getInt(0) == 1) { "Unknown preferences version" }
    val value = JSONObject(cursor.getString(1))
    RoutineSettings(value.getInt("routineHour"), value.getInt("routineMinute"), value.getInt("firstDelayMinutes"), value.getInt("criticalDelayMinutes"), value.getBoolean("remindersEnabled"))
  }

  private fun confirmed(database: SQLiteDatabase, date: String) = database.rawQuery("SELECT 1 FROM pill_records WHERE routine_date = ?", arrayOf(date)).use { it.moveToFirst() }
  private fun delivered(database: SQLiteDatabase, date: String, sequence: Int) = database.rawQuery("SELECT 1 FROM reminder_deliveries WHERE routine_date = ? AND sequence = ?", arrayOf(date, sequence.toString())).use { it.moveToFirst() }

  private fun pending(context: Context, sequence: Int, intent: Intent = Intent(context, ReminderReceiver::class.java)): PendingIntent {
    intent.action = if (sequence == 0) REFRESH else DELIVER
    return PendingIntent.getBroadcast(context, 8100 + sequence, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun cancelAlarms(context: Context) { (0..2).forEach { alarms(context).cancel(pending(context, it)) } }

  private fun schedule(context: Context, due: Instant, sequence: Int, intent: Intent) {
    val operation = pending(context, sequence, intent)
    if (sequence != 0 && exactAllowed(context)) {
      try {
        alarms(context).setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, due.toEpochMilli(), operation)
        return
      } catch (_: SecurityException) { /* Access can be revoked between checking and scheduling. */ }
    }
    alarms(context).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, due.toEpochMilli(), operation)
  }

  private fun dismissCompleted(context: Context, database: SQLiteDatabase?, enabled: Boolean) {
    val manager = notifications(context)
    manager.activeNotifications.filter { it.tag?.startsWith(TAG) == true }.forEach { item ->
      if (!enabled || database != null && confirmed(database, item.tag.removePrefix(TAG))) manager.cancel(item.tag, item.id)
    }
  }

  @Synchronized
  fun reconcile(context: Context) {
    ensureChannel(context)
    cancelAlarms(context)
    val preferences = store(context)
    val generation = preferences.getLong("generation", 0L) + 1L
    check(preferences.edit().putLong("generation", generation).putString("scheduled", "[]").commit())
    try {
      openDatabase(context)?.use { database ->
        val settings = settings(database)
        val enabled = settings?.enabled == true
        dismissCompleted(context, database, enabled)
        preferences.edit().putBoolean("enabled", enabled).apply()
        if (settings != null && enabled && notificationsAllowed(context)) {
          val now = Instant.now()
          val zone = ZoneId.systemDefault()
          val next = RoutinePlanner.next(settings, now, zone, { confirmed(database, it) }, { date, sequence -> delivered(database, date, sequence) })
          val scheduled = JSONArray()
          next.forEach { reminder ->
            val intent = Intent(context, ReminderReceiver::class.java).putExtra("routineDate", reminder.routineDate).putExtra("sequence", reminder.sequence).putExtra("due", reminder.due.toEpochMilli()).putExtra("generation", generation)
            schedule(context, reminder.due, reminder.sequence, intent)
            scheduled.put(JSONObject().put("routineDate", reminder.routineDate).put("sequence", reminder.sequence).put("at", reminder.due.toString()))
          }
          // Renewal also runs when a day is already confirmed or delivery was interrupted.
          val midnight = now.atZone(zone).toLocalDate().plusDays(1).atStartOfDay(zone).plusMinutes(3).toInstant()
          schedule(context, midnight, 0, Intent(context, ReminderReceiver::class.java))
          check(preferences.edit().putString("scheduled", scheduled.toString()).commit())
        }
      } ?: run {
        preferences.edit().putBoolean("enabled", false).apply()
        dismissCompleted(context, null, false)
      }
      preferences.edit().remove("error").putString("lastSync", Instant.now().toString()).apply()
    } catch (error: Exception) {
      cancelAlarms(context)
      preferences.edit().putString("scheduled", "[]").apply()
      recordError(context, error)
      // Retry without posting a notification or replaying expired reminders.
      schedule(context, Instant.now().plusSeconds(3600), 0, Intent(context, ReminderReceiver::class.java))
      throw error
    }
  }

  @Synchronized
  fun deliver(context: Context, intent: Intent) {
    if (intent.getLongExtra("generation", -1L) != store(context).getLong("generation", 0L)) return
    val date = intent.getStringExtra("routineDate") ?: return
    val sequence = intent.getIntExtra("sequence", 0)
    if (sequence !in 1..2) return
    val reminder = PlannedReminder(date, sequence, Instant.ofEpochMilli(intent.getLongExtra("due", 0L)))
    try {
      openDatabase(context)?.use { database ->
        val settings = settings(database) ?: return@use
        // Hold the SQLite writer lock through the delivery decision, so a confirmation
        // cannot commit between the confirmation check and posting the notification.
        database.beginTransactionNonExclusive()
        try {
          val now = Instant.now()
          if (notificationsAllowed(context) && RoutinePlanner.mayDeliver(settings, reminder, now, ZoneId.systemDefault(), confirmed(database, date), delivered(database, date, sequence))) {
            database.execSQL("INSERT OR IGNORE INTO reminder_deliveries (routine_date, sequence, delivered_at) VALUES (?, ?, ?)", arrayOf(date, sequence, now.toString()))
            post(context, reminder)
          }
          database.setTransactionSuccessful()
        } finally { database.endTransaction() }
      }
    } finally { reconcile(context) }
  }

  private fun post(context: Context, reminder: PlannedReminder) {
    val scheme = if (context.packageName.endsWith(".test")) "pill-tracker-test" else "pill-tracker-dev"
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: error("App launch activity unavailable")
    launch.action = Intent.ACTION_VIEW
    launch.data = Uri.parse("$scheme://routine/${reminder.routineDate}")
    launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    val content = PendingIntent.getActivity(context, 8200 + reminder.sequence, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val date = LocalDate.parse(reminder.routineDate).format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(Locale.getDefault()))
    val body = "Your routine for $date is still unconfirmed. Open to check your record."
    val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(context, CHANNEL) else Notification.Builder(context)
    val notification = builder.setSmallIcon(R.drawable.ic_pill_reminder)
      .setContentTitle(if (reminder.sequence == 1) "Daily pill reminder" else "Critical pill reminder")
      .setContentText(body).setStyle(Notification.BigTextStyle().bigText(body)).setContentIntent(content)
      .setAutoCancel(true).setVisibility(Notification.VISIBILITY_PRIVATE).setCategory(Notification.CATEGORY_REMINDER).build()
    notifications(context).notify(TAG + reminder.routineDate, reminder.sequence, notification)
  }

  @Synchronized
  fun status(context: Context): Map<String, Any?> {
    ensureChannel(context)
    val preferences = store(context)
    val array = JSONArray(preferences.getString("scheduled", "[]"))
    val scheduled = (0 until array.length()).map { index ->
      val value = array.getJSONObject(index)
      mapOf("routineDate" to value.getString("routineDate"), "sequence" to value.getInt("sequence"), "at" to value.getString("at"))
    }
    return mapOf("supported" to true, "enabled" to preferences.getBoolean("enabled", false), "notificationsAllowed" to notificationsAllowed(context), "exactAllowed" to exactAllowed(context), "scheduled" to scheduled, "error" to preferences.getString("error", null))
  }

  @Synchronized
  fun recordError(context: Context, error: Exception) {
    store(context).edit().putString("error", "Daily reminders could not be updated. Open the app and try again.").apply()
    android.util.Log.e("PillReminders", "Reminder scheduling failed: ${error.javaClass.simpleName}")
  }
}
