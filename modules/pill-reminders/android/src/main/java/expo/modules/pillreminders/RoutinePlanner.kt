package expo.modules.pillreminders

import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId

data class RoutineSettings(val hour: Int, val minute: Int, val firstDelay: Int, val criticalDelay: Int, val enabled: Boolean) {
  init {
    require(hour in 0..23 && minute in 0..59)
    require(firstDelay in 1..1439 && criticalDelay in (firstDelay + 1)..1440)
  }
}

data class PlannedReminder(val routineDate: String, val sequence: Int, val due: Instant)

object RoutinePlanner {
  fun due(settings: RoutineSettings, routineDate: String, sequence: Int, zone: ZoneId): Instant {
    require(sequence in 1..2)
    val routine = LocalDate.parse(routineDate).atTime(LocalTime.of(settings.hour, settings.minute)).atZone(zone).toInstant()
    return routine.plusSeconds((if (sequence == 1) settings.firstDelay else settings.criticalDelay) * 60L)
  }

  fun next(settings: RoutineSettings, now: Instant, zone: ZoneId, confirmed: (String) -> Boolean, delivered: (String, Int) -> Boolean): List<PlannedReminder> {
    if (!settings.enabled) return emptyList()
    val today = now.atZone(zone).toLocalDate()
    return (1..2).mapNotNull { sequence ->
      (-1L..7L).mapNotNull { offset ->
        val date = today.plusDays(offset).toString()
        val due = due(settings, date, sequence, zone)
        if (due > now && !confirmed(date) && !delivered(date, sequence)) PlannedReminder(date, sequence, due) else null
      }.minByOrNull { it.due }
    }
  }

  fun mayDeliver(settings: RoutineSettings, reminder: PlannedReminder, now: Instant, zone: ZoneId, confirmed: Boolean, delivered: Boolean): Boolean {
    return settings.enabled && !confirmed && !delivered && reminder.due == due(settings, reminder.routineDate, reminder.sequence, zone) &&
      now >= reminder.due && now < reminder.due.plus(Duration.ofDays(1))
  }
}
