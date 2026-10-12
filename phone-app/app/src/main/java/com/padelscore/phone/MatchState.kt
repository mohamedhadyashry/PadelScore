package com.padelscore.phone

import org.json.JSONArray
import org.json.JSONObject

/** The score as sent by the band (see band-app common/score.js for the format). */
data class MatchState(
    val golden: Boolean = false,
    val points: List<Int> = listOf(0, 0),
    val games: List<Int> = listOf(0, 0),
    val sets: List<Int> = listOf(0, 0),
    val tieBreak: Boolean = false,
    val doneSets: List<List<Int>> = emptyList(),
    val winner: Int = -1,
) {
    /** Point labels for team A and B, plus a note like DEUCE. */
    fun pointLabels(): Triple<String, String, String> {
        val (a, b) = points
        if (tieBreak) return Triple("$a", "$b", "TIE-BREAK")
        if (a >= 3 && b >= 3) {
            return when {
                a == b -> Triple("40", "40", if (golden) "GOLDEN POINT" else "DEUCE")
                a > b -> Triple("AD", "40", "")
                else -> Triple("40", "AD", "")
            }
        }
        val labels = listOf("0", "15", "30", "40")
        return Triple(labels[a], labels[b], "")
    }

    fun setsText(): String = doneSets.joinToString("  ") { "${it[0]}-${it[1]}" }

    companion object {
        fun fromJson(st: JSONObject): MatchState = MatchState(
            golden = st.optBoolean("golden"),
            points = st.getJSONArray("p").ints(),
            games = st.getJSONArray("g").ints(),
            sets = st.getJSONArray("s").ints(),
            tieBreak = st.optBoolean("tb"),
            doneSets = st.getJSONArray("done").let { arr ->
                (0 until arr.length()).map { arr.getJSONArray(it).ints() }
            },
            winner = st.optInt("winner", -1),
        )

        private fun JSONArray.ints(): List<Int> = (0 until length()).map { getInt(it) }
    }
}

/** One message from the band: what happened and the score after it. */
data class BandEvent(val event: String, val state: MatchState) {
    companion object {
        fun parse(text: String): BandEvent? = try {
            val json = JSONObject(text)
            BandEvent(json.getString("ev"), MatchState.fromJson(json.getJSONObject("st")))
        } catch (e: Exception) {
            null
        }
    }
}
