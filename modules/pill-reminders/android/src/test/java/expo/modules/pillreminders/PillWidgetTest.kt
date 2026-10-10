package expo.modules.pillreminders

import android.content.Context
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.SQLiteMode
import java.time.Instant
import java.time.ZoneId

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], manifest = Config.NONE)
@SQLiteMode(SQLiteMode.Mode.NATIVE)
class PillWidgetTest {
  private val context: Context get() = RuntimeEnvironment.getApplication()
  private val now = Instant.parse("2026-10-10T08:00:00Z")
  private val zone = ZoneId.of("Europe/Belgrade")
  private fun seed() {
    PillDatabase.execute(context, listOf("BEGIN TRANSACTION",
      "CREATE TABLE app_preferences (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, value TEXT NOT NULL)",
      "CREATE TABLE pill_records (routine_date TEXT PRIMARY KEY, taken_at TEXT, recorded_at TEXT NOT NULL)",
      "CREATE TABLE reminder_deliveries (routine_date TEXT, sequence INTEGER, delivered_at TEXT, PRIMARY KEY (routine_date, sequence))",
      "PRAGMA user_version = 2", "COMMIT"))
    PillDatabase.run(context, "INSERT INTO app_preferences VALUES (1, 1, ?)", listOf(
      """{"routineHour":8,"routineMinute":0,"firstDelayMinutes":60,"criticalDelayMinutes":360,"remindersEnabled":true}"""))
  }

  @Test fun nativeWidgetReadsExistingRecordsCorrectionsUndoAndSettingsWithoutChangingLedger() {
    seed()
    assertEquals("Reminder at 14:00", PillWidget.read(context, now, zone).first.detail)
    for (date in listOf("2026-10-10", "2026-10-09"))
      PillDatabase.run(context, "INSERT INTO pill_records VALUES (?, NULL, 'test')", listOf(date))
    assertEquals("2-day streak", PillWidget.read(context, now, zone).first.title)
    PillDatabase.run(context, "DELETE FROM pill_records WHERE routine_date = ?", listOf("2026-10-09"))
    assertEquals("1-day streak", PillWidget.read(context, now, zone).first.title)
    PillDatabase.run(context, "DELETE FROM pill_records WHERE routine_date = ?", listOf("2026-10-10"))
    PillDatabase.run(context, "INSERT INTO reminder_deliveries VALUES (?, 2, 'test')", listOf("2026-10-10"))
    assertEquals("Not recorded today", PillWidget.read(context, now, zone).first.detail)
    assertEquals(1, PillDatabase.query(context, "SELECT * FROM reminder_deliveries", emptyList()).size)
    PillDatabase.run(context, "UPDATE app_preferences SET value = ?", listOf(
      """{"routineHour":12,"routineMinute":30,"firstDelayMinutes":60,"criticalDelayMinutes":360,"remindersEnabled":false}"""))
    assertEquals("Pill at 12:30", PillWidget.read(context, now, zone).first.title)
  }

  @Test fun addingWidgetBeforeFirstLaunchDoesNotCreateDatabase() {
    assertEquals("Open to set up", PillWidget.read(context, now, zone).first.detail)
    assertNull(PillDatabase.open(context))
  }
}
