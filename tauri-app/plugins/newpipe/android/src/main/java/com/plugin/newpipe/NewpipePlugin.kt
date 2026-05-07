package com.plugin.newpipe

import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.JSArray
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke

import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.ServiceList
import org.schabi.newpipe.extractor.stream.StreamInfoItem
import org.schabi.newpipe.extractor.channel.ChannelInfoItem
import org.schabi.newpipe.extractor.InfoItem

@InvokeArg
class VideoArgs {
  var videoId: String? = null
}

@InvokeArg
class SearchArgs {
  var query: String? = null
}

@InvokeArg
class ChannelArgs {
  var channelId: String? = null
}

@TauriPlugin
class NewpipePlugin(private val activity: Activity): Plugin(activity) {

    override fun load(webView: android.webkit.WebView) {
        super.load(webView)
        // Initialize NewPipe
        NewPipe.init(DownloaderImpl.getInstance())
    }

    @Command
    fun get_dash_url(invoke: Invoke) {
        val args = invoke.parseArgs(VideoArgs::class.java)
        val videoId = args.videoId ?: return invoke.reject("Missing videoId")
        
        Thread {
            try {
                val url = "https://www.youtube.com/watch?v=$videoId"
                val extractor = ServiceList.YouTube.getStreamExtractor(url)
                extractor.fetchPage()
                val dashUrl = extractor.dashMpdUrl
                
                if (dashUrl == null || dashUrl.isEmpty()) {
                    invoke.reject("No DASH manifest found")
                } else {
                    val ret = JSObject()
                    ret.put("dashUrl", dashUrl)
                    invoke.resolve(ret)
                }
            } catch (e: Exception) {
                invoke.reject("Failed to extract: ${e.message}")
            }
        }.start()
    }

    private fun mapStreamInfoItem(item: StreamInfoItem): JSObject {
        val obj = JSObject()
        obj.put("type", "video")
        obj.put("title", item.name ?: "")
        
        // Extract videoId from URL if possible
        var vId = item.url ?: ""
        if (vId.contains("v=")) {
            vId = vId.substringAfter("v=").substringBefore("&")
        } else if (vId.contains("youtu.be/")) {
            vId = vId.substringAfter("youtu.be/").substringBefore("?")
        } else {
            vId = vId.substringAfterLast("/")
        }
        obj.put("videoId", vId)
        
        obj.put("author", item.uploaderName ?: "")
        
        // Use full URL or extract channel ID
        var aId = item.uploaderUrl ?: ""
        if (aId.contains("/channel/")) {
            aId = aId.substringAfter("/channel/")
        }
        obj.put("authorId", aId)
        
        obj.put("authorAvatar", "") // StreamInfoItem doesn't always have this directly
        
        var thumbUrl = ""
        if (item.thumbnails != null && item.thumbnails.isNotEmpty()) {
            thumbUrl = item.thumbnails[0].url
        }
        obj.put("thumbnail", thumbUrl)
        
        obj.put("viewCount", item.viewCount)
        obj.put("lengthSeconds", item.duration)
        obj.put("publishedText", item.textualUploadDate ?: "")
        
        return obj
    }

    @Command
    fun search(invoke: Invoke) {
        val args = invoke.parseArgs(SearchArgs::class.java)
        val query = args.query ?: return invoke.reject("Missing query")

        Thread {
            try {
                val extractor = ServiceList.YouTube.getSearchExtractor(query)
                extractor.fetchPage()
                val items = extractor.getInitialPage().items
                
                val results = JSArray()
                for (item in items) {
                    if (item is StreamInfoItem) {
                        results.put(mapStreamInfoItem(item))
                    }
                }
                
                val ret = JSObject()
                ret.put("videos", results)
                invoke.resolve(ret)
            } catch (e: Exception) {
                invoke.reject("Search failed: ${e.message}")
            }
        }.start()
    }

    @Command
    fun get_channel_videos(invoke: Invoke) {
        val args = invoke.parseArgs(ChannelArgs::class.java)
        val channelId = args.channelId ?: return invoke.reject("Missing channelId")

        Thread {
            try {
                var url = if (channelId.startsWith("http")) channelId else "https://www.youtube.com/channel/$channelId"
                if (!url.endsWith("/videos")) {
                    url += "/videos"
                }
                
                val linkHandler = ServiceList.YouTube.channelTabLHFactory.fromUrl(url)
                val extractor = ServiceList.YouTube.getChannelTabExtractor(linkHandler)
                extractor.fetchPage()
                val items = extractor.getInitialPage().items
                
                val results = JSArray()
                for (item in items) {
                    if (item is StreamInfoItem) {
                        results.put(mapStreamInfoItem(item))
                    }
                }
                
                val ret = JSObject()
                ret.put("videos", results)
                invoke.resolve(ret)
            } catch (e: Exception) {
                invoke.reject("Channel fetch failed: ${e.message}")
            }
        }.start()
    }
}
