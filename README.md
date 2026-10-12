# PadelScore

A very simple padel scorer for **Huawei Band 8 / 9 / 10** with an optional
**Android phone scoreboard**.

- **Band:** tap the top half when team A wins a point and the bottom half when team B does.
  The band shows the points (0 / 15 / 30 / 40 / AD), games and sets, flashes the
  side that scored and vibrates (longer vibration when a game or set is won).
- **Phone:** a big dark scoreboard that updates live from the band, shows each
  set's result, announces finished sets, and keeps a list of past matches.

```
band-app/    Huawei Band app (HarmonyOS "lite wearable", JavaScript)  -> DevEco Studio
phone-app/   Android scoreboard app (Kotlin + Jetpack Compose)         -> Android Studio
tools/       Tests for the scoring logic
```

---

## Using it on court

| On the band                     | What it does                                    |
|---------------------------------|-------------------------------------------------|
| Tap the **top** half            | Point to team A (lime)                          |
| Tap the **bottom** half         | Point to team B (cyan)                          |
| Tap the **middle strip**        | Undo the last point (up to 30 back)             |
| Long-press the **middle strip** | Back to the start screen (the match is saved)   |
| Start screen → **RESUME**       | Continue the saved match                        |
| Start screen → **ADVANTAGE**    | New match, normal deuce / advantage             |
| Start screen → **GOLDEN PT**    | New match, golden point at 40-40                |
| Winner screen: tap / long-press | Tap: finish. Long-press: undo the winning point |

The middle strip shows the games of the current set (`4 - 3`) and either the set
number or `DEUCE` / `GOLDEN` / `TIE-BREAK`. Small dots next to each team show sets won.

**Rules used:** best of 3 sets, sets to 6 games with a 2-game lead, tie-break
(first to 7, lead of 2) at 6-6. The match is saved after every point, so it
survives the app closing or the band going to sleep.

On the phone, tap a team name to rename it (e.g. to the players' names), and tap the
status chip at the top right to reconnect to the band.

---

## Which bands work?

Huawei bands don't run Android apps. Band 8, 9 and 10 run Huawei's small
**"lite wearable"** app platform. Apps for it are written in JavaScript and built
with **Huawei DevEco Studio**, not Android Studio. That's what `band-app/` is.

- **Band 8 / 9 / 10:** screen is 194 × 368. The layout was designed for that size.
- **Band 11 or anything newer:** it should work if DevEco Studio lists it as a
  lite wearable target. Most sizes in the layout are percentages, so a slightly
  different screen will still fit.

So you need **two tools**: DevEco Studio for the band and Android Studio for the phone.

---

## 1. Put the app on your band (DevEco Studio)

1. **Install DevEco Studio** from <https://developer.huawei.com/consumer/en/deveco-studio/>
   and sign in with a (free) Huawei developer account. Use a version that offers
   **Lite Wearable** projects.
2. **Create a project:** *File → New → Create Project → Lite Wearable → Empty Ability (JS)*.
   Set the bundle name to `com.padelscore.band`.
3. **Copy the code in:**
   - Copy everything in `band-app/entry/src/main/js/default/` into your project's
     `entry/src/main/js/<folder>/`. The folder is called `default` or `MainAbility`,
     depending on the DevEco version. Replace the template's files.
   - In your project's `entry/src/main/config.json`, make the `pages` list match
     the one in `band-app/entry/src/main/config.json`:
     `"pages/index/index", "pages/match/match"`. Keep the rest of the template's config.
4. **Try it on the simulator first:** open `pages/match/match.hml` and use the
   **Previewer**, or start the **Lite Wearable simulator** (*Tools → Device Manager*).
   You can tap and score there with no band at all.
5. **Sign the app:** a real band only installs signed apps.
   - In [AppGallery Connect](https://developer.huawei.com/consumer/en/service/josp/agc/index.html),
     create a project, then add a HarmonyOS app with bundle name `com.padelscore.band`.
   - Create a debug certificate and a debug profile. You register your band's
     UDID for the profile. In DevEco, *File → Project Structure → Signing Configs*
     can do this for you automatically ("Automatically generate signature").
6. **Install on the band:** follow Huawei's guide *"Running a lite wearable app on a
   real device"* in the DevEco docs. Usually you turn on developer mode for the band
   in the **Huawei Health** app, connect it to DevEco through the phone, and click **Run**.
   The exact steps change between DevEco versions, so trust the current docs here.
   - To install it permanently and share it with friends, publish it on
     AppGallery (it can be a private / test release).

> Font sizes: some lite wearables only render text at 30 px and 38 px, so the
> point numbers use 38 px. If your band shows bigger fonts in the previewer, you
> can raise `.num` and `.games` in `pages/match/match.css`.

---

## 2. Install the phone scoreboard (Android Studio)

1. Open the `phone-app/` folder in **Android Studio** (*File → Open*). Let Gradle sync.
2. Plug in your phone (with USB debugging on) and press **Run ▶**.

The phone needs the **Huawei Health** app installed and paired with your band. That's
how the phone talks to the band.

Until you finish step 3, the app opens and shows an empty scoreboard with a status
like "Wear Engine error". That's expected.

---

## 3. Connecting the phone and the band (Huawei Wear Engine)

The band sends the score to the phone through **Huawei Wear Engine**. Huawei only
lets approved apps use it, so this is a one-time setup:

1. **Apply for Wear Engine:** in the Huawei Developer console go to
   *Wear Engine → Apply for Wear Engine service*. Register the phone app
   (`com.padelscore.phone`) and its signing certificate fingerprint. To get the
   fingerprint, run `./gradlew signingReport` in `phone-app/` and copy the **SHA-256**.
   Approval can take a few days.
2. **Phone app:** in `phone-app/app/src/main/AndroidManifest.xml` replace
   `REPLACE_WITH_YOUR_APP_ID` with your AppGallery Connect app ID. In
   `WatchLink.kt` replace `REPLACE_WITH_BAND_APP_FINGERPRINT` with the band app's
   fingerprint. The Wear Engine docs show where to find it (it comes from the
   band app's signing profile).
3. **Band app:** download the official **`wearengine.js`** for lite wearables from
   the Wear Engine SDK download page. Use it to **replace**
   `band-app/.../common/wearengine.js`, which is only a placeholder that does nothing.
   Then in `common/phone-link.js` replace `REPLACE_WITH_PHONE_APP_SHA256_FINGERPRINT`
   with the phone app's SHA-256 fingerprint from step 1. Use the format the Wear
   Engine docs ask for.
4. Rebuild and reinstall both apps. Open the phone app. The status should say
   "Connected to …". Then start a match on the band.

Every point, undo and new match on the band sends the full score to the phone.
If the phone is out of range, the band carries on scoring normally. The phone
catches up with the next point.

---

## Tests

The scoring rules are tested with Node.js (no device needed):

```
node tools/test-score.mjs
```

## Good to know

- The band code is written in plain old JavaScript (ES5 style) on purpose,
  because the band's JS engine is very small.
- The band app and the phone app were written without access to Huawei
  hardware or the Huawei SDKs. The scoring logic is tested. The first build in
  DevEco Studio / Android Studio may still need small fixes, e.g. a newer Wear
  Engine version number in `phone-app/app/build.gradle.kts`.
