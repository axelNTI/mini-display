use std::io::{Read, Write};
use std::net::TcpListener;
use std::thread;
use std::time::{Duration, Instant};

use keyring::Entry;
use tauri::Emitter;

const SPOTIFY_CREDENTIAL_SERVICE: &str = "com.taxel.mini-display";
const SPOTIFY_CREDENTIAL_USER: &str = "spotify-refresh-token";

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn load_spotify_refresh_token() -> Result<Option<String>, String> {
    let entry = Entry::new(SPOTIFY_CREDENTIAL_SERVICE, SPOTIFY_CREDENTIAL_USER)
        .map_err(|error| error.to_string())?;

    match entry.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
fn store_spotify_refresh_token(refresh_token: String) -> Result<(), String> {
    let entry = Entry::new(SPOTIFY_CREDENTIAL_SERVICE, SPOTIFY_CREDENTIAL_USER)
        .map_err(|error| error.to_string())?;
    entry
        .set_password(&refresh_token)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn start_spotify_callback(app: tauri::AppHandle) -> Result<(), String> {
    let listener = TcpListener::bind("127.0.0.1:43821").map_err(|error| error.to_string())?;
    listener
        .set_nonblocking(true)
        .map_err(|error| error.to_string())?;

    thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_secs(180);
        loop {
            match listener.accept() {
                Ok((mut stream, _)) => {
                    let mut request = [0; 8192];
                    let Ok(size) = stream.read(&mut request) else {
                        break;
                    };
                    let request = String::from_utf8_lossy(&request[..size]);
                    let target = request
                        .lines()
                        .next()
                        .and_then(|line| line.split_whitespace().nth(1));

                    if let Some(target) = target.filter(|target| target.starts_with("/callback?")) {
                        let callback_url = format!("http://127.0.0.1:43821{target}");
                        let page = "Spotify authorization complete. You can return to Mini Display.";
                        let _ = write!(
                            stream,
                            "HTTP/1.1 200 OK\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                            page.len(),
                            page
                        );
                        let _ = app.emit("spotify-auth-callback", callback_url);
                    } else {
                        let page = "Invalid Spotify callback.";
                        let _ = write!(
                            stream,
                            "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                            page.len(),
                            page
                        );
                    }
                    break;
                }
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                    if Instant::now() >= deadline {
                        let _ = app.emit("spotify-auth-timeout", ());
                        break;
                    }
                    thread::sleep(Duration::from_millis(100));
                }
                Err(_) => break,
            }
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            load_spotify_refresh_token,
            store_spotify_refresh_token,
            start_spotify_callback
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
