use std::collections::HashMap;

fn build_reqwest_client() -> reqwest::Client {
    reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
        .build()
        .expect("Failed to build reqwest client")
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
async fn proxy_fetch(url: String) -> Result<String, String> {
    let resp = reqwest::get(&url)
        .await
        .map_err(|e| format!("Request failed for {}: {}", url, e))?;
    let status = resp.status();
    if !status.is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("HTTP {} from {}: {}", status.as_u16(), url, body));
    }
    resp.text()
        .await
        .map_err(|e| format!("Body read failed: {}", e))
}

#[derive(serde::Serialize)]
struct ProxyResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: String,
}

#[tauri::command]
async fn proxy_request(
    url: String,
    method: String,
    headers: HashMap<String, String>,
    body: Option<String>,
) -> Result<ProxyResponse, String> {
    let client = build_reqwest_client();

    let mut req = match method.to_uppercase().as_str() {
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        "PATCH" => client.patch(&url),
        "HEAD" => client.head(&url),
        _ => client.get(&url),
    };

    for (key, value) in &headers {
        req = req.header(key.as_str(), value.as_str());
    }

    if let Some(b) = body {
        req = req.body(b);
    }

    let resp = req
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    let status = resp.status().as_u16();

    let mut resp_headers = HashMap::new();
    for (key, value) in resp.headers() {
        if let Ok(v) = value.to_str() {
            resp_headers.insert(key.to_string(), v.to_string());
        }
    }

    let resp_body = resp
        .text()
        .await
        .map_err(|e| format!("Body read failed: {}", e))?;

    Ok(ProxyResponse {
        status,
        headers: resp_headers,
        body: resp_body,
    })
}

#[tauri::command]
async fn fetch_and_rewrite_manifest(url: String) -> Result<String, String> {
    let client = build_reqwest_client();
    let resp = client.get(&url).send().await.map_err(|e| format!("Request failed: {}", e))?;
    
    if !resp.status().is_success() {
        return Err(format!("HTTP {} fetching manifest", resp.status().as_u16()));
    }
    
    let mut xml = resp.text().await.map_err(|e| format!("Body read failed: {}", e))?;
    
    // YouTube's DASH manifests usually have a single <BaseURL> or relative paths
    // We can inject a BaseURL inside each <Representation> or globally to force routing through proxy
    // For simplicity, we replace existing BaseURL or inject our proxy prefix.
    // The proxy expects the full YouTube chunk URL to be URL-encoded after stream://localhost/
    // Since replacing XML safely requires parsing, a simple hack is to wrap the BaseURL
    // Wait, the easiest way for dashjs is if we don't modify the manifest but rather register
    // an interceptor in dashjs. But if we must modify the manifest:
    // Actually, `invidious-companion` rewrites the `<BaseURL>` tags.
    // YouTube sets `<BaseURL>https://...</BaseURL>`. We can just regex replace it.
    let re = regex::Regex::new(r"<BaseURL>(.*?)</BaseURL>").unwrap();
    xml = re.replace_all(&xml, |caps: &regex::Captures| {
        let base = &caps[1];
        let encoded = urlencoding::encode(base);
        format!("<BaseURL>stream://localhost/{}</BaseURL>", encoded)
    }).to_string();
    
    Ok(xml)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();
    
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_newpipe::init())
        .invoke_handler(tauri::generate_handler![proxy_fetch, proxy_request, fetch_and_rewrite_manifest])
        .register_asynchronous_uri_scheme_protocol("stream", |_ctx, request, responder| {
            tauri::async_runtime::spawn(async move {
                let uri = request.uri().to_string();
                // URL is encoded after "stream://localhost/"
                let video_url = match uri.strip_prefix("stream://localhost/") {
                    Some(encoded) => urlencoding::decode(encoded)
                        .unwrap_or_default()
                        .into_owned(),
                    None => {
                        let resp = tauri::http::Response::builder()
                            .status(400)
                            .body(b"Bad request".to_vec())
                            .unwrap();
                        responder.respond(resp);
                        return;
                    }
                };

                let client = build_reqwest_client();
                let mut req = client.get(&video_url);

                // Forward Range header for video seeking
                if let Some(range) = request.headers().get("range") {
                    if let Ok(range_str) = range.to_str() {
                        req = req.header("Range", range_str);
                    }
                }

                let resp = match req.send().await {
                    Ok(r) => r,
                    Err(e) => {
                        let resp = tauri::http::Response::builder()
                            .status(502)
                            .body(format!("Proxy error: {}", e).into_bytes())
                            .unwrap();
                        responder.respond(resp);
                        return;
                    }
                };

                let status = resp.status().as_u16();

                let mut builder = tauri::http::Response::builder().status(status);

                // Forward essential headers for video playback
                for key in &[
                    "content-type",
                    "content-length",
                    "content-range",
                    "accept-ranges",
                ] {
                    if let Some(val) = resp.headers().get(*key) {
                        if let Ok(v) = val.to_str() {
                            builder = builder.header(*key, v);
                        }
                    }
                }

                // Allow cross-origin access from the webview
                builder = builder.header("access-control-allow-origin", "*");

                match resp.bytes().await {
                    Ok(bytes) => {
                        responder.respond(builder.body(bytes.to_vec()).unwrap());
                    }
                    Err(e) => {
                        let resp = tauri::http::Response::builder()
                            .status(502)
                            .body(format!("Body read error: {}", e).into_bytes())
                            .unwrap();
                        responder.respond(resp);
                    }
                }
            });
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
