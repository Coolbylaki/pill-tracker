package expo.modules.pillreminders

import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import java.io.File

/** Foreground storage and background reminders use the same SQLite engine and WAL configuration. */
object PillDatabase {
  fun open(context: Context, create: Boolean = false): SQLiteDatabase? {
    val file = File(context.filesDir, "SQLite/pill-tracker.db")
    if (!create && !file.exists()) return null
    if (create) check(file.parentFile!!.isDirectory || file.parentFile!!.mkdirs())
    val flags = SQLiteDatabase.OPEN_READWRITE or SQLiteDatabase.NO_LOCALIZED_COLLATORS or
      SQLiteDatabase.ENABLE_WRITE_AHEAD_LOGGING or (if (create) SQLiteDatabase.CREATE_IF_NECESSARY else 0)
    return SQLiteDatabase.openDatabase(file.path, null, flags)
  }

  private fun statement(database: SQLiteDatabase, sql: String) {
    if (sql.trimStart().startsWith("PRAGMA ", ignoreCase = true))
      database.rawQuery(sql, null).use { it.moveToFirst() }
    else database.execSQL(sql)
  }

  fun execute(context: Context, statements: List<String>) {
    requireNotNull(open(context, true)).use { database ->
      val transaction = statements.firstOrNull()?.trim()?.equals("BEGIN TRANSACTION", true) == true
      if (transaction) {
        require(statements.last().trim().equals("COMMIT", true))
        database.beginTransactionNonExclusive()
        try {
          statements.drop(1).dropLast(1).forEach { statement(database, it) }
          database.setTransactionSuccessful()
        } finally { database.endTransaction() }
      } else statements.forEach { statement(database, it) }
    }
  }

  fun run(context: Context, sql: String, parameters: List<String?>) {
    requireNotNull(open(context, true)).use { database ->
      database.execSQL(sql, parameters.toTypedArray())
    }
  }

  fun query(context: Context, sql: String, parameters: List<String>): List<Map<String, Any?>> =
    requireNotNull(open(context, true)).use { database ->
      database.rawQuery(sql, parameters.toTypedArray()).use { cursor ->
        val rows = mutableListOf<Map<String, Any?>>()
        while (cursor.moveToNext()) {
          rows.add(cursor.columnNames.mapIndexed { index, name ->
            name to when (cursor.getType(index)) {
              Cursor.FIELD_TYPE_NULL -> null
              Cursor.FIELD_TYPE_INTEGER -> cursor.getLong(index)
              Cursor.FIELD_TYPE_FLOAT -> cursor.getDouble(index)
              else -> cursor.getString(index)
            }
          }.toMap())
        }
        rows
      }
    }
}
