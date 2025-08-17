<div align="center">
<img src="./resources/dotline.png" width="100" height="100" />

<h1>Dotline</h1>

<p>A modern crosshair overlay</p>

</div>

![Dotline Showcase](/images/appscreenshot.png)

## ✨ Features

- 🎯 Customizable Crosshairs
- 🖌 10+ Presets
- 📂 Import & Export your configs
- 🐧 Cross-Platform

### Tested Games

#### All games where tested on Windows 11 24H2

- CS2 ✅
- Rust ✅ (use Windowed fullscreen mode)
- Minecraft ✅

### Supported OSes

- Windows: ✅ (Tested on Windows 11 24H2)
- Linux: ✅ (Tested on Arch Linux on KDE)
- MacOS ⚠️ (Seems to work. must build yourself, tested on MacOS sequoia)

## ⚠️ Known Issues

- MacOS requires manual build, may not work on all versions.
- Linux window overlays may behave differently on Wayland vs X11.
- Does not work on Hyprland. may not work on other window managers

#### ⚠️ if the crosshair disapears in game try setting the game to windowed fullscreen mode.

### 🎯 Adding Preset Crosshairs

#### ⚠️ if you are adding a preset crosshair, be sure to have your github username to the creator field

Preset crosshairs are located in `src/renderer/src/lib/presets.ts`.

To add your own:

1. Open `presets.ts`
2. Copy one of the existing objects in the `presets` object
3. Modify the `name`, `style`, `color`, `thickness`, etc to ur liking.
4. Save and take a look at your new preset.
5. Commit and make a pull request.

Example:

```ts
{
  name: 'My Awesome Crosshair',
  config: { ...defaultConfig, style: 'dot', color: '#ff00ff', creator: 'YourName' }
}
```

## 🛠️ Building Dotline

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```
