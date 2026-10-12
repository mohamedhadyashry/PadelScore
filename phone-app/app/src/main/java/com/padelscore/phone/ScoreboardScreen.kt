package com.padelscore.phone

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.DateFormat
import java.util.Date

val Lime = Color(0xFFC6F432)
val Cyan = Color(0xFF3DD6F5)
private val Card = Color(0xFF141416)
private val Muted = Color(0xFF8E8E93)

data class ScoreboardUi(
    val state: MatchState = MatchState(),
    val names: List<String> = listOf("Team A", "Team B"),
    val status: String = "Not connected",
    val banner: String? = null,
    val lastScorer: Int = -1,
    val history: List<FinishedMatch> = emptyList(),
)

@Composable
fun ScoreboardScreen(
    ui: ScoreboardUi,
    flashCount: Int,
    onReconnect: () -> Unit,
    onRename: (Int, String) -> Unit,
) {
    var renaming by remember { mutableStateOf(-1) }

    MaterialTheme(colorScheme = darkColorScheme(primary = Lime, background = Color.Black)) {
        Column(
            Modifier
                .fillMaxSize()
                .background(Color.Black)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
        ) {
            Header(ui.status, onReconnect)
            Spacer(Modifier.height(24.dp))

            val labels = ui.state.pointLabels()
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Card)
                    .padding(vertical = 8.dp),
            ) {
                for (team in 0..1) {
                    TeamRow(
                        name = ui.names[team],
                        color = if (team == 0) Lime else Cyan,
                        doneSets = ui.state.doneSets.map { it[team] to it[1 - team] },
                        games = ui.state.games[team],
                        point = if (team == 0) labels.first else labels.second,
                        flash = if (ui.lastScorer == team) flashCount else -1,
                        onNameClick = { renaming = team },
                    )
                }
            }

            Text(
                text = labels.third,
                color = Muted,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 4.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
            )

            AnimatedVisibility(
                visible = ui.banner != null,
                enter = fadeIn() + slideInVertically { it },
                exit = fadeOut(),
            ) {
                Text(
                    text = ui.banner.orEmpty(),
                    color = Color.Black,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Lime)
                        .padding(16.dp),
                )
            }

            Spacer(Modifier.height(32.dp))
            Text("RECENT MATCHES", color = Muted, fontSize = 13.sp, letterSpacing = 2.sp)
            Spacer(Modifier.height(8.dp))
            if (ui.history.isEmpty()) {
                Text("Finished matches will appear here.", color = Muted, fontSize = 15.sp)
            }
            ui.history.forEach { HistoryRow(it) }
        }

        if (renaming >= 0) {
            RenameDialog(
                current = ui.names[renaming],
                onDone = { name ->
                    if (name != null) onRename(renaming, name)
                    renaming = -1
                },
            )
        }
    }
}

@Composable
private fun Header(status: String, onReconnect: () -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text("PADEL", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Black, letterSpacing = 6.sp)
        Box(
            Modifier
                .padding(start = 8.dp)
                .size(12.dp)
                .clip(CircleShape)
                .background(Lime),
        )
        Spacer(Modifier.weight(1f))
        Text(
            text = status,
            color = Muted,
            fontSize = 13.sp,
            modifier = Modifier
                .clip(RoundedCornerShape(50))
                .clickable(onClick = onReconnect)
                .background(Card)
                .padding(horizontal = 12.dp, vertical = 6.dp),
        )
    }
}

@Composable
private fun TeamRow(
    name: String,
    color: Color,
    doneSets: List<Pair<Int, Int>>, // (this team's games, other team's games)
    games: Int,
    point: String,
    flash: Int,
    onNameClick: () -> Unit,
) {
    // Brief glow on the row of the team that just scored.
    val glow = remember { Animatable(0f) }
    LaunchedEffect(flash) {
        if (flash >= 0) {
            glow.snapTo(0.35f)
            glow.animateTo(0f, tween(700))
        }
    }

    Row(
        Modifier
            .fillMaxWidth()
            .background(color.copy(alpha = glow.value))
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier
                .width(6.dp)
                .height(44.dp)
                .clip(RoundedCornerShape(3.dp))
                .background(color),
        )
        Text(
            text = name,
            color = Color.White,
            fontSize = 22.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            modifier = Modifier
                .weight(1f)
                .padding(start = 12.dp)
                .clickable(onClick = onNameClick),
        )
        doneSets.forEach { (mine, theirs) ->
            Text(
                text = "$mine",
                color = if (mine > theirs) Color.White else Muted,
                fontSize = 22.sp,
                fontWeight = if (mine > theirs) FontWeight.Bold else FontWeight.Normal,
                textAlign = TextAlign.Center,
                modifier = Modifier.width(30.dp),
            )
        }
        Text(
            text = "$games",
            color = color,
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            modifier = Modifier.width(40.dp),
        )
        Box(
            Modifier
                .padding(start = 8.dp)
                .width(76.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Color.Black),
            contentAlignment = Alignment.Center,
        ) {
            AnimatedContent(
                targetState = point,
                transitionSpec = {
                    (slideInVertically { it } + fadeIn()) togetherWith (slideOutVertically { -it } + fadeOut())
                },
                label = "point",
            ) { value ->
                Text(
                    text = value,
                    color = Color.White,
                    fontSize = 38.sp,
                    fontWeight = FontWeight.Black,
                    modifier = Modifier.padding(vertical = 4.dp),
                )
            }
        }
    }
}

@Composable
private fun HistoryRow(match: FinishedMatch) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(Card)
            .padding(14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Column {
            Text(match.winnerName, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            Text(
                DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT).format(Date(match.time)),
                color = Muted,
                fontSize = 12.sp,
            )
        }
        Text(match.sets, color = Lime, fontSize = 18.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun RenameDialog(current: String, onDone: (String?) -> Unit) {
    var text by remember { mutableStateOf(current) }
    AlertDialog(
        onDismissRequest = { onDone(null) },
        title = { Text("Team name") },
        text = { OutlinedTextField(value = text, onValueChange = { text = it }, singleLine = true) },
        confirmButton = { TextButton(onClick = { onDone(text) }) { Text("Save") } },
        dismissButton = { TextButton(onClick = { onDone(null) }) { Text("Cancel") } },
    )
}
