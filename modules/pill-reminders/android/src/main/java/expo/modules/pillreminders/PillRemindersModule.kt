package expo.modules.pillreminders

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PillRemindersModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PillReminders")
    AsyncFunction("executeStorage") { statements: List<String> ->
      PillDatabase.execute(requireNotNull(appContext.reactContext), statements)
    }
    AsyncFunction("runStorage") { sql: String, parameters: List<String?> ->
      PillDatabase.run(requireNotNull(appContext.reactContext), sql, parameters)
    }
    AsyncFunction("queryStorage") { sql: String, parameters: List<String> ->
      PillDatabase.query(requireNotNull(appContext.reactContext), sql, parameters)
    }
    AsyncFunction("reconcile") {
      val context = requireNotNull(appContext.reactContext)
      ReminderEngine.reconcile(context)
      ReminderEngine.status(context)
    }
    AsyncFunction("getStatus") {
      ReminderEngine.status(requireNotNull(appContext.reactContext))
    }
    AsyncFunction("openAlarmSettings") {
      val context = requireNotNull(appContext.reactContext)
      val action = if (android.os.Build.VERSION.SDK_INT >= 31) Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM else Settings.ACTION_APPLICATION_DETAILS_SETTINGS
      context.startActivity(Intent(action, Uri.parse("package:${context.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }
}
