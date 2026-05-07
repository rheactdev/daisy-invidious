use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::Newpipe;
#[cfg(mobile)]
use mobile::Newpipe;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the newpipe APIs.
pub trait NewpipeExt<R: Runtime> {
  fn newpipe(&self) -> &Newpipe<R>;
}

impl<R: Runtime, T: Manager<R>> crate::NewpipeExt<R> for T {
  fn newpipe(&self) -> &Newpipe<R> {
    self.state::<Newpipe<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("newpipe")
    .invoke_handler(tauri::generate_handler![commands::ping])
    .setup(|app, api| {
      #[cfg(mobile)]
      let newpipe = mobile::init(app, api)?;
      #[cfg(desktop)]
      let newpipe = desktop::init(app, api)?;
      app.manage(newpipe);
      Ok(())
    })
    .build()
}
