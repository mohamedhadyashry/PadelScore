package com.padelscore.phone

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

class MainActivity : ComponentActivity() {

    private lateinit var history: MatchHistory
    private lateinit var link: WatchLink

    private var ui by mutableStateOf(ScoreboardUi())
    private var flashCount by mutableIntStateOf(0)
    private var savedThisMatch = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // A scoreboard should not go to sleep.
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        history = MatchHistory(this)
        ui = ui.copy(
            names = listOf(history.teamName(0), history.teamName(1)),
            history = history.all(),
        )
        link = WatchLink(
            context = this,
            onStatus = { text -> runOnUiThread { ui = ui.copy(status = text) } },
            onMessage = { text -> runOnUiThread { onBandMessage(text) } },
        )

        setContent {
            ScoreboardScreen(
                ui = ui,
                flashCount = flashCount,
                onReconnect = { link.disconnect(); link.connect() },
                onRename = { team, name ->
                    history.setTeamName(team, name)
                    ui = ui.copy(names = listOf(history.teamName(0), history.teamName(1)))
                },
            )
        }
        link.connect()
    }

    override fun onDestroy() {
        link.disconnect()
        super.onDestroy()
    }

    private fun onBandMessage(text: String) {
        val msg = BandEvent.parse(text) ?: return
        val prev = ui.state
        val st = msg.state
        var banner = ui.banner

        when (msg.event) {
            "new" -> {
                banner = null
                savedThisMatch = false
            }
            "set" -> {
                val last = st.doneSets.last()
                val winner = if (last[0] > last[1]) 0 else 1
                banner = "Set ${st.doneSets.size} to ${ui.names[winner]}  ${last[0]}-${last[1]}"
            }
            "match" -> {
                val name = ui.names[st.winner]
                banner = "$name wins!  ${st.setsText()}"
                if (!savedThisMatch) {
                    history.add(FinishedMatch(System.currentTimeMillis(), name, st.setsText()))
                    savedThisMatch = true
                }
            }
            "undo" -> {
                // Undoing the winning point takes the match back out of the history.
                if (prev.winner >= 0 && st.winner < 0 && savedThisMatch) {
                    history.removeLatest()
                    savedThisMatch = false
                    banner = null
                }
            }
        }

        val scorer = scorer(prev, st)
        ui = ui.copy(
            state = st,
            banner = banner,
            lastScorer = if (msg.event == "undo") -1 else scorer,
            history = history.all(),
        )
        if (msg.event != "undo" && msg.event != "new") flashCount++
    }

    /** Which team just won something (-1 if unknown). */
    private fun scorer(prev: MatchState, now: MatchState): Int {
        for (t in 0..1) {
            if (now.sets[t] > prev.sets[t] || now.games[t] > prev.games[t]) return t
        }
        // Compare point changes (going back to deuce lowers the other side's points).
        val diffA = now.points[0] - prev.points[0]
        val diffB = now.points[1] - prev.points[1]
        return when {
            diffA > diffB -> 0
            diffB > diffA -> 1
            else -> -1
        }
    }
}
