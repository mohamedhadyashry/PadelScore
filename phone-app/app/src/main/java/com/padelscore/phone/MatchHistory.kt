package com.padelscore.phone

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class FinishedMatch(
    val time: Long,
    val winnerName: String,
    val sets: String,
)

/** Finished matches, newest first, stored on the phone. */
class MatchHistory(context: Context) {
    private val prefs = context.getSharedPreferences("padelscore", Context.MODE_PRIVATE)

    fun all(): List<FinishedMatch> {
        val arr = JSONArray(prefs.getString(KEY, "[]"))
        return (0 until arr.length()).map {
            val o = arr.getJSONObject(it)
            FinishedMatch(o.getLong("time"), o.getString("winner"), o.getString("sets"))
        }
    }

    fun add(match: FinishedMatch) = write(listOf(match) + all().take(MAX - 1))

    fun removeLatest() = write(all().drop(1))

    private fun write(list: List<FinishedMatch>) {
        val arr = JSONArray()
        list.forEach {
            arr.put(JSONObject().put("time", it.time).put("winner", it.winnerName).put("sets", it.sets))
        }
        prefs.edit().putString(KEY, arr.toString()).apply()
    }

    fun teamName(team: Int): String =
        prefs.getString("team$team", null) ?: if (team == 0) "Team A" else "Team B"

    fun setTeamName(team: Int, name: String) {
        prefs.edit().putString("team$team", name.trim().ifEmpty { null }).apply()
    }

    private companion object {
        const val KEY = "history"
        const val MAX = 50
    }
}
