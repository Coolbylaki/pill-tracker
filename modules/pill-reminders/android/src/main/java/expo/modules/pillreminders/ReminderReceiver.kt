package expo.modules.pillreminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import java.util.concurrent.Executors

class ReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val pending = goAsync()
    executor.execute {
      try {
        if (intent.action == ReminderEngine.DELIVER) ReminderEngine.deliver(context.applicationContext, intent)
        else ReminderEngine.reconcile(context.applicationContext)
      } catch (error: Exception) {
        ReminderEngine.recordError(context, error)
      } finally { pending.finish() }
    }
  }

  companion object { private val executor = Executors.newSingleThreadExecutor() }
}
