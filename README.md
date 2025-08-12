<div align="center">
<img src="./resources/dotline.png" width="60" height="60" />

<h1>Dotline</h1>

<p>a modern crosshair overlay</p>

</div>

![Dotline Showcase](/images/appscreenshot.png)

## ✨ Features

- 🎯 Customizble Crosshairs
- 🖌 10+ Presets
- 📂 Import & Export your configs
- 🐧 Cross-Platform

### 🎯 Adding Preset crosshairs

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
