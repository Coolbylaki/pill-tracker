package expo.modules.pillreminders

import org.junit.Assert.*
import org.junit.Test
import java.time.Instant
import java.time.ZoneId

class WidgetPlannerTest {
  private val zone = ZoneId.of("Europe/Belgrade")
  private val settings = RoutineSettings(8, 0, 60, 360, true)
  private fun state(time: String, records: Set<String> = emptySet(), delivered: Set<Pair<String, Int>> = emptySet(), routine: RoutineSettings? = settings) =
    WidgetPlanner.state(routine, Instant.parse(time), zone, records, delivered)

  @Test fun setupAndBeforePillTime() {
    assertNull(state("2026-10-10T05:00:00Z", routine = null).date)
    assertEquals("Pill at 08:00", state("2026-10-10T05:00:00Z").title)
    assertEquals("Today", state("2026-10-10T05:00:00Z").detail)
  }

  @Test fun outstandingStateFollowsFirstThenCriticalWithoutResettingDeliverySlots() {
    assertEquals("Reminder at 09:00", state("2026-10-10T06:00:00Z").detail)
    assertEquals("Reminder at 14:00", state("2026-10-10T07:00:00Z").detail)
    val both = setOf("2026-10-10" to 1, "2026-10-10" to 2)
    assertEquals("Not recorded today", state("2026-10-10T08:00:00Z", delivered = both).detail)
    assertEquals("Not recorded today", state("2026-10-10T12:00:00Z").detail)
  }

  @Test fun streakCountsConsecutiveRecordedDatesAndIgnoresFutureAndGaps() {
    val records = setOf("2026-10-11", "2026-10-10", "2026-10-09", "2026-10-07")
    val result = state("2026-10-10T08:00:00Z", records)
    assertEquals("2-day streak", result.title)
    assertEquals("Taken today", result.detail)
    assertTrue(result.taken)
    assertEquals("2026-10-10", result.date)
  }

  @Test fun undoAndCorrectionRecalculateStreak() {
    val records = setOf("2026-10-10", "2026-10-08")
    assertEquals("1-day streak", state("2026-10-10T08:00:00Z", records).title)
    assertEquals("3-day streak", state("2026-10-10T08:00:00Z", records + "2026-10-09").title)
    assertFalse(state("2026-10-10T08:00:00Z", records - "2026-10-10").taken)
  }

  @Test fun remindersOffStillPromptsButNeverPromisesNotification() {
    assertEquals("Reminders off", state("2026-10-10T08:00:00Z", routine = settings.copy(enabled = false)).detail)
  }

  @Test fun midnightReminderTargetsYesterdayUntilTodaysRoutineTakesPriority() {
    val late = RoutineSettings(23, 0, 60, 360, true)
    val result = state("2026-10-10T23:00:00Z", routine = late)
    assertEquals("Yesterday's routine", result.detail)
    assertEquals("2026-10-10", result.date)
    assertEquals("Pill at 23:00", state("2026-10-11T04:00:00Z", routine = late).title)
    assertEquals("Tomorrow at 00:00", state("2026-10-10T21:00:00Z", routine = late).detail)
    assertEquals("Taken today", state("2026-10-10T23:00:00Z", setOf("2026-10-11"), routine = late).detail)
  }

  @Test fun nextChangeHandlesLocalMidnightAndDstWithoutTwentyFourHourAssumption() {
    val now = Instant.parse("2026-10-25T13:00:00Z")
    assertEquals(Instant.parse("2026-10-25T23:00:00Z"), WidgetPlanner.nextChange(settings, now, zone))
    assertEquals(Instant.parse("2026-10-10T06:00:00Z"), WidgetPlanner.nextChange(settings, Instant.parse("2026-10-10T05:00:00Z"), zone))
  }
}
