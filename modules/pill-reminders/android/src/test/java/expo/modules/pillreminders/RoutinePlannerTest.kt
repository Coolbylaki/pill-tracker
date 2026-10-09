package expo.modules.pillreminders

import org.junit.Assert.*
import org.junit.Test
import java.time.Instant
import java.time.ZoneId

class RoutinePlannerTest {
  private val settings = RoutineSettings(8, 0, 60, 360, true)
  private val zone = ZoneId.of("Europe/Belgrade")
  private fun now(value: String) = Instant.parse(value)
  private fun plan(at: String, confirmed: (String) -> Boolean = { false }, delivered: (String, Int) -> Boolean = { _, _ -> false }) = RoutinePlanner.next(settings, now(at), zone, confirmed, delivered)

  @Test fun lateSetupSkipsExpiredTimesAndConfirmedToday() {
    val next = plan("2026-10-09T15:00:00Z", { it == "2026-10-09" })
    assertEquals(listOf("2026-10-10", "2026-10-10"), next.map { it.routineDate })
    assertEquals(listOf(now("2026-10-10T07:00:00Z"), now("2026-10-10T12:00:00Z")), next.map { it.due })
    assertEquals(next, plan("2026-10-09T15:00:00Z"))
  }

  @Test fun confirmationAndUndoOnlyAffectFutureUndeliveredTimes() {
    assertEquals(listOf("2026-10-10", "2026-10-09"), plan("2026-10-09T08:00:00Z").map { it.routineDate })
    assertEquals(listOf("2026-10-10", "2026-10-10"), plan("2026-10-09T08:00:00Z", { it == "2026-10-09" }).map { it.routineDate })
    assertEquals(listOf("2026-10-10", "2026-10-09"), plan("2026-10-09T08:00:00Z", { false }).map { it.routineDate })
    assertEquals(listOf("2026-10-10", "2026-10-10"), plan("2026-10-09T08:00:00Z", { false }, { date, sequence -> date == "2026-10-09" && sequence == 2 }).map { it.routineDate })
  }

  @Test fun toggleDisablesEveryDailyAlarm() {
    assertTrue(RoutinePlanner.next(settings.copy(enabled = false), now("2026-10-09T06:00:00Z"), zone, { false }, { _, _ -> false }).isEmpty())
  }

  @Test fun eveningRoutineKeepsItsOriginalDateAcrossYearBoundary() {
    val evening = RoutineSettings(23, 30, 60, 360, true)
    val next = RoutinePlanner.next(evening, now("2026-12-31T23:00:00Z"), zone, { false }, { _, _ -> false })
    assertEquals(listOf("2026-12-31", "2026-12-31"), next.map { it.routineDate })
    assertEquals(listOf(now("2026-12-31T23:30:00Z"), now("2027-01-01T04:30:00Z")), next.map { it.due })
  }

  @Test fun staleChangedConfirmedAndDuplicateDeliveriesAreRejected() {
    val reminder = PlannedReminder("2026-10-09", 1, now("2026-10-09T07:00:00Z"))
    val at = now("2026-10-09T07:00:01Z")
    assertTrue(RoutinePlanner.mayDeliver(settings, reminder, at, zone, false, false))
    assertFalse(RoutinePlanner.mayDeliver(settings, reminder, at, zone, true, false))
    assertFalse(RoutinePlanner.mayDeliver(settings, reminder, at, zone, false, true))
    assertFalse(RoutinePlanner.mayDeliver(settings.copy(hour = 9), reminder, at, zone, false, false))
    assertFalse(RoutinePlanner.mayDeliver(settings.copy(enabled = false), reminder, at, zone, false, false))
    assertFalse(RoutinePlanner.mayDeliver(settings, reminder, now("2026-10-09T06:59:59Z"), zone, false, false))
    assertFalse(RoutinePlanner.mayDeliver(settings, reminder, now("2026-10-10T07:00:00Z"), zone, false, false))
  }

  @Test fun timeZonesAndDaylightSavingUseLocalPillTimeAndElapsedDelays() {
    val spring = RoutineSettings(2, 30, 60, 360, true)
    assertEquals(now("2026-03-29T02:30:00Z"), RoutinePlanner.due(spring, "2026-03-29", 1, zone))
    assertEquals(now("2026-10-25T01:30:00Z"), RoutinePlanner.due(spring, "2026-10-25", 1, zone))
    assertEquals(now("2026-10-09T16:00:00Z"), RoutinePlanner.due(settings, "2026-10-09", 1, ZoneId.of("America/Los_Angeles")))
  }

  @Test fun renewalContinuesForConsecutiveDaysWithoutAccumulatingAlarms() {
    for (day in 9..20) {
      val date = "2026-10-${day.toString().padStart(2, '0')}"
      val next = plan("${date}T06:00:00Z")
      assertEquals(2, next.size)
      assertTrue(next.all { it.routineDate == date })
    }
  }
}
