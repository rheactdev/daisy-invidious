package com.plugin.newpipe

import okhttp3.OkHttpClient
import okhttp3.RequestBody.Companion.toRequestBody
import org.schabi.newpipe.extractor.downloader.Downloader
import org.schabi.newpipe.extractor.downloader.Request
import org.schabi.newpipe.extractor.downloader.Response
import java.util.concurrent.TimeUnit

class DownloaderImpl private constructor() : Downloader() {

    private val client: OkHttpClient = OkHttpClient.Builder()
        .readTimeout(30, TimeUnit.SECONDS)
        .connectTimeout(30, TimeUnit.SECONDS)
        .build()

    override fun execute(request: Request): Response {
        val builder = okhttp3.Request.Builder()
            .url(request.url())

        val headers = request.headers()
        if (headers != null) {
            for ((key, values) in headers) {
                for (value in values) {
                    builder.addHeader(key, value)
                }
            }
        }

        when (request.httpMethod()) {
            "GET" -> builder.get()
            "POST" -> builder.post(request.dataToSend()?.toRequestBody() ?: "".toRequestBody())
            "HEAD" -> builder.head()
            "OPTIONS" -> builder.method("OPTIONS", null)
            "PUT" -> builder.put(request.dataToSend()?.toRequestBody() ?: "".toRequestBody())
            "DELETE" -> builder.delete(request.dataToSend()?.toRequestBody())
        }

        val response = client.newCall(builder.build()).execute()
        
        val responseHeaders = mutableMapOf<String, List<String>>()
        response.headers.names().forEach { name ->
            responseHeaders[name] = response.headers.values(name)
        }

        return Response(
            response.code,
            response.message,
            responseHeaders,
            response.body?.string(),
            request.url()
        )
    }

    companion object {
        private var instance: DownloaderImpl? = null

        fun getInstance(): DownloaderImpl {
            if (instance == null) {
                instance = DownloaderImpl()
            }
            return instance!!
        }
    }
}
