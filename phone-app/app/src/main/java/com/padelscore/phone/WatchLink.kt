package com.padelscore.phone

import android.content.Context
import com.huawei.wearengine.HiWear
import com.huawei.wearengine.auth.AuthCallback
import com.huawei.wearengine.auth.Permission
import com.huawei.wearengine.device.Device
import com.huawei.wearengine.p2p.Message
import com.huawei.wearengine.p2p.Receiver

/**
 * Listens for score messages from the band via Huawei Wear Engine.
 * All Huawei-specific code lives in this one file.
 */
class WatchLink(
    private val context: Context,
    private val onStatus: (String) -> Unit,
    private val onMessage: (String) -> Unit,
) {
    private val p2p = HiWear.getP2pClient(context).apply {
        setPeerPkgName(BAND_PACKAGE)
        setPeerFingerPrint(BAND_FINGERPRINT)
    }

    private var registered = false

    private val receiver = Receiver { message: Message ->
        if (message.type == Message.MESSAGE_TYPE_DATA && message.data != null) {
            onMessage(String(message.data, Charsets.UTF_8))
        }
    }

    fun connect() {
        onStatus("Connecting…")
        try {
            HiWear.getAuthClient(context)
                .requestPermission(object : AuthCallback {
                    override fun onOk(permissions: Array<out Permission>?) = findBand()
                    override fun onCancel() = onStatus("Permission denied")
                }, Permission.DEVICE_MANAGER)
                .addOnFailureListener { onStatus("Wear Engine error: ${it.message}") }
        } catch (e: Throwable) {
            onStatus("Wear Engine unavailable – is Huawei Health installed?")
        }
    }

    private fun findBand() {
        HiWear.getDeviceClient(context).bondedDevices
            .addOnSuccessListener { devices: List<Device>? ->
                val band = devices?.firstOrNull { it.isConnected }
                if (band == null) {
                    onStatus("No band connected")
                } else {
                    listen(band)
                }
            }
            .addOnFailureListener { onStatus("Can't list devices: ${it.message}") }
    }

    private fun listen(band: Device) {
        p2p.registerReceiver(band, receiver)
            .addOnSuccessListener {
                registered = true
                onStatus("Connected to ${band.name}")
            }
            .addOnFailureListener { onStatus("Can't listen to band: ${it.message}") }
    }

    fun disconnect() {
        if (registered) {
            p2p.unregisterReceiver(receiver)
            registered = false
        }
    }

    private companion object {
        // Must match bundleName in band-app config.json.
        const val BAND_PACKAGE = "com.padelscore.band"
        // The band app's fingerprint from your HarmonyOS signing profile (see README).
        const val BAND_FINGERPRINT = "REPLACE_WITH_BAND_APP_FINGERPRINT"
    }
}
