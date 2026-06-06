package wellbeing

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

class AndroidWellbeingModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("AndroidWellbeing")

    Function("hasUsageStatsPermission") {
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
      mode == AppOpsManager.MODE_ALLOWED
    }

    Function("requestUsageStatsPermission") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      context.startActivity(intent)
    }

    Function("getSystemWellbeingMetrics") {
      val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      
      val calendar = Calendar.getInstance()
      val endTime = calendar.timeInMillis
      calendar.add(Calendar.DAY_OF_YEAR, -1)
      val startTime = calendar.timeInMillis

      val events = usageStatsManager.queryEvents(startTime, endTime)
      val event = UsageEvents.Event()

      var totalScreenOnTimeMs = 0L
      var lastInteractiveTime = 0L
      var unlockCount = 0

      val screenOffGaps = mutableListOf<Pair<Long, Long>>()
      var lastScreenOffTime = 0L

      while (events.hasNextEvent()) {
        events.getNextEvent(event)
        val eventTime = event.timeStamp
        
        when (event.eventType) {
          // SCREEN_INTERACTIVE (15)
          15 -> {
            lastInteractiveTime = eventTime
            if (lastScreenOffTime > 0L) {
              screenOffGaps.add(Pair(lastScreenOffTime, eventTime))
              lastScreenOffTime = 0L
            }
          }
          // SCREEN_NON_INTERACTIVE (16)
          16 -> {
            if (lastInteractiveTime > 0L) {
              totalScreenOnTimeMs += (eventTime - lastInteractiveTime)
              lastInteractiveTime = 0L
            }
            lastScreenOffTime = eventTime
          }
          // KEYGUARD_HIDDEN (18 - Unlock event)
          18 -> {
            unlockCount++
          }
        }
      }

      // If screen is currently interactive, add the final segment
      if (lastInteractiveTime > 0L) {
        totalScreenOnTimeMs += (System.currentTimeMillis() - lastInteractiveTime)
      }
      // If screen is currently off, close the final gap
      if (lastScreenOffTime > 0L) {
        screenOffGaps.add(Pair(lastScreenOffTime, System.currentTimeMillis()))
      }

      // Calculate sleep hours as the longest screen off gap
      var maxSleepGapMs = 0L
      for (gap in screenOffGaps) {
        val duration = gap.second - gap.first
        if (duration > maxSleepGapMs) {
          maxSleepGapMs = duration
        }
      }
      
      val sleepHours = maxSleepGapMs.toDouble() / (1000.0 * 60.0 * 60.0)

      mapOf(
        "screenTimeMinutes" to (totalScreenOnTimeMs / (1000 * 60)),
        "unlockCount" to unlockCount,
        "sleepHours" to sleepHours
      )
    }
  }
}
