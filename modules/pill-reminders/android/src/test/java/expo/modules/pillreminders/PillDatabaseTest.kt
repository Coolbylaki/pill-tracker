package expo.modules.pillreminders

import android.content.Context
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.SQLiteMode
import java.time.LocalDate
import java.time.LocalTime

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], manifest = Config.NONE)
@SQLiteMode(SQLiteMode.Mode.NATIVE)
class PillDatabaseTest {
  private val context: Context get() = RuntimeEnvironment.getApplication()
  private fun seed() {
    PillDatabase.execute(context, listOf(
      "BEGIN TRANSACTION",
      "CREATE TABLE app_preferences (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, value TEXT NOT NULL)",
      "CREATE TABLE pill_records (routine_date TEXT PRIMARY KEY, taken_at TEXT, recorded_at TEXT NOT NULL)",
      "PRAGMA user_version = 2", "COMMIT"
    ))
  }
  private fun preferences(enabled: Boolean, critical: Int = 360): String {
    val time = LocalTime.now()
    return JSONObject().put("theme", "light").put("routineHour", time.hour).put("routineMinute", time.minute)
      .put("remindersEnabled", enabled).put("firstDelayMinutes", 60).put("criticalDelayMinutes", critical).toString()
  }
  private fun save(value: String) = PillDatabase.run(context,
    "INSERT OR REPLACE INTO app_preferences (id, version, value) VALUES (1, 1, ?)", listOf(value))

  @Test fun updatedSettingsSurviveReopenAndSchedulerReconciliation() {
    seed()
    PillDatabase.execute(context, listOf("PRAGMA journal_mode = WAL"))
    save(preferences(true))
    val updated = preferences(false, 300)
    save(updated)
    ReminderEngine.reconcile(context)
    assertEquals(false, ReminderEngine.status(context)["enabled"])
    assertEquals(emptyList<Any>(), ReminderEngine.status(context)["scheduled"])
    assertEquals(updated, PillDatabase.query(context, "SELECT value FROM app_preferences WHERE id = 1", emptyList()).single()["value"])
    PillDatabase.open(context)!!.use { database ->
      assertTrue(database.isWriteAheadLoggingEnabled)
      database.rawQuery("PRAGMA journal_mode", null).use { assertTrue(it.moveToFirst()); assertEquals("wal", it.getString(0)) }
    }
    save(preferences(true, 300))
    ReminderEngine.reconcile(context)
    assertEquals(true, ReminderEngine.status(context)["enabled"])
    val saved = JSONObject(PillDatabase.query(context, "SELECT value FROM app_preferences WHERE id = 1", emptyList()).single()["value"] as String)
    assertEquals("light", saved.getString("theme"))
    assertEquals(300, saved.getInt("criticalDelayMinutes"))
  }

  @Test fun undoIsVisibleToSchedulerWithoutRestart() {
    seed()
    save(preferences(true, 300))
    val today = LocalDate.now().toString()
    PillDatabase.run(context, "INSERT INTO pill_records VALUES (?, ?, ?)", listOf(today, null, "test-entry"))
    ReminderEngine.reconcile(context)
    fun dates() = (ReminderEngine.status(context)["scheduled"] as List<*>).map { (it as Map<*, *>)["routineDate"] }
    assertFalse(dates().contains(today))
    PillDatabase.run(context, "DELETE FROM pill_records WHERE routine_date = ? AND recorded_at = ?", listOf(today, "test-entry"))
    ReminderEngine.reconcile(context)
    assertEquals(listOf(today, today), dates())
  }

  @Test fun failedBatchRollsBackAndBackgroundOpenNeverCreatesMissingDatabase() {
    assertNull(PillDatabase.open(context))
    try {
      PillDatabase.execute(context, listOf("BEGIN TRANSACTION", "CREATE TABLE temporary_test (id INTEGER)", "INVALID SQL", "COMMIT"))
      fail("Expected SQL failure")
    } catch (_: android.database.sqlite.SQLiteException) { }
    assertTrue(PillDatabase.query(context, "SELECT name FROM sqlite_master WHERE name = 'temporary_test'", emptyList()).isEmpty())
  }
}
