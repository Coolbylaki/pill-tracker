package expo.modules.pillreminders

import java.time.Instant
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

data class WidgetState(val title: String, val detail: String, val date: String?, val taken: Boolean = false)

object WidgetPlanner {
  fun state(settings: RoutineSettings?, now: Instant, zone: ZoneId, records: Set<String>, delivered: Set<Pair<String, Int>>): WidgetState {
    if (settings == null) return WidgetState("Pill Tracker", "Open to set up", null)
    val today = now.atZone(zone).toLocalDate()
    val todayKey = today.toString()
    if (todayKey in records) {
      var date = today
      var streak = 0
      while (date.toString() in records) { streak++; date = date.minusDays(1) }
      return WidgetState("$streak-day streak", "Taken today", todayKey, true)
    }
    val routine = today.atTime(settings.hour, settings.minute).atZone(zone).toInstant()
    val yesterday = today.minusDays(1).toString()
    // Show an outstanding cross-midnight routine until today's pill time takes priority.
    val previousPending = settings.enabled && yesterday !in records && now < routine &&
      RoutinePlanner.due(settings, yesterday, 2, zone) > now && (yesterday to 2) !in delivered
    val key = if (previousPending) yesterday else todayKey
    if (!previousPending && now < routine) {
      return WidgetState("Pill at ${LocalTime.of(settings.hour, settings.minute).format(DateTimeFormatter.ofPattern("HH:mm"))}", "Today", key)
    }
    val next = if (settings.enabled) (1..2).mapNotNull { sequence ->
      val due = RoutinePlanner.due(settings, key, sequence, zone)
      if (due > now && (key to sequence) !in delivered) due else null
    }.minOrNull() else null
    val detail = if (previousPending) "Yesterday's routine" else if (next != null)
      "${if (next.atZone(zone).toLocalDate() > today) "Tomorrow at" else "Reminder at"} ${next.atZone(zone).format(DateTimeFormatter.ofPattern("HH:mm"))}"
      else if (!settings.enabled) "Reminders off" else "Not recorded today"
    return WidgetState("Take your pill", detail, key)
  }

  fun nextChange(settings: RoutineSettings?, now: Instant, zone: ZoneId): Instant {
    val today = now.atZone(zone).toLocalDate()
    val candidates = mutableListOf(today.plusDays(1).atStartOfDay(zone).toInstant())
    if (settings != null) {
      candidates.add(today.atTime(settings.hour, settings.minute).atZone(zone).toInstant())
      if (settings.enabled) for (day in listOf(today.minusDays(1), today)) for (sequence in 1..2)
        candidates.add(RoutinePlanner.due(settings, day.toString(), sequence, zone))
    }
    return candidates.filter { it > now }.minOrNull()!!
  }
}
