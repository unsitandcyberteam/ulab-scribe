# ULab Scribe

Local-first meeting transcription and summarisation. Audio is captured, transcribed and
summarised on the machine it runs on. This build sends **no telemetry**.

Built by Unissant ULab — [unissant.us](https://unissant.us)

Based on [Meetily](https://github.com/Zackriya-Solutions/meeting-minutes) by Zackriya
Solutions, MIT licensed. See [LICENSE.md](LICENSE.md). The original project README is
preserved as [README.upstream.md](README.upstream.md).

---

## What changed from upstream

| Area | Change |
|---|---|
These changes reflect the requirements of our own deployment environment. They are not a
judgement on the upstream project, whose defaults are reasonable for its own users.

| Area | Change |
|---|---|
| Telemetry | **Removed.** Upstream includes an optional PostHog analytics client. Our environment does not permit usage data to leave the machine, so it is removed rather than disabled: the Rust `analytics` module, the `posthog-rs` dependency and all 25 Tauri commands are gone, and the frontend module is a typed no-op shim. |
| Auto-updater | **Removed.** The updater is configured against the upstream release feed and signing key, which is correct for upstream builds but means a ULab Scribe install would update itself to upstream binaries. We hold neither the feed nor the key. See `frontend/src/services/updateService.ts` for how to re-enable against a Unissant-controlled feed. |
| Consent UI | Removed. A consent toggle for telemetry that is no longer present would be misleading. |
| Branding | `ULab Scribe` / `com.unissant.ulabscribe` / binary `ULab Scribe`. |

### Artifacts still fetched from upstream

**Deliberately unchanged** — repointing them without an internal artifact host would break the
build. This is a normal property of forking an actively maintained project, not a defect in it;
we simply need these under our own control before wide deployment:

- `backend/start_with_output.ps1` downloads `whisper-server.exe` from upstream's GitHub
  releases at runtime.
- `frontend/src-tauri/src/parakeet_engine/parakeet_engine.rs` fetches Parakeet models from
  `meetily.towardsgeneralintelligence.com`.
- `backend/whisper.cpp` is a git submodule of an upstream fork of whisper.cpp.
- The build script downloads a 101 MB FFmpeg binary at compile time from
  `github.com/Zackriya-Solutions/ffmpeg-binaries` (see `frontend/src-tauri/build/ffmpeg.rs`).
- The legacy-database import paths still reference `/var/meetily/` on purpose — that is where
  an existing Meetily install keeps its data, and the import feature depends on it.

For wide deployment, mirror all four internally so builds and installs do not depend on any
external host's availability.

### Not yet done

- **Code signing.** `signCommand` has been removed from `tauri.conf.json` so unsigned
  internal builds succeed; the original is preserved at `tauri.conf.json.signed-bak`.
  Restore it once a Unissant certificate is available. Unsigned builds trip SmartScreen.

---

## Building on Windows

### 1. Prerequisites

Run in an **elevated** PowerShell:

```powershell
winget install --id Rustlang.Rustup   -e --accept-package-agreements --accept-source-agreements
winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
winget install --id Kitware.CMake     -e --accept-package-agreements --accept-source-agreements
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

`Microsoft.VisualStudio.Workload.VCTools` is the large one (several GB) and supplies the
MSVC linker Rust needs on Windows. WebView2 ships with Windows 11 — verify at
`C:\Program Files (x86)\Microsoft\EdgeWebView\Application`.

### LLVM — install 18.1.8, not the latest

`whisper-rs-sys 0.11.1` uses `bindgen 0.69.5`, which cannot parse the whisper.cpp headers
with a modern clang. Under **clang 22** bindgen emits a `whisper_full_params` struct with
**2 fields instead of 59** — silently, with no error or warning. The build then fails much
later with ~71 `error[E0609]: no field ... on type whisper_full_params` errors pointing
*inside the `whisper-rs` crate*. It looks exactly like a dependency version conflict. It
is not one.

Get libclang 18 without disturbing any LLVM you already have — extract it rather than
running the installer (the NSIS installer uninstalls your existing LLVM first, and will
leave you with none if it then aborts):

```powershell
$url = 'https://github.com/llvm/llvm-project/releases/download/llvmorg-18.1.8/LLVM-18.1.8-win64.exe'
Invoke-WebRequest -Uri $url -OutFile "$env:TEMP\LLVM-18.1.8-win64.exe" -UseBasicParsing
& 'C:\Program Files\7-Zip\7z.exe' x "$env:TEMP\LLVM-18.1.8-win64.exe" -oC:\LLVM18 -y
[Environment]::SetEnvironmentVariable('LIBCLANG_PATH','C:\LLVM18\bin','Machine')
```

Only `libclang.dll` is needed; nothing has to be on `PATH`.

Diagnosing it, if you hit those E0609 errors:

```powershell
$b = Get-ChildItem target\debug\build\whisper-rs-sys-*\out\bindings.rs | Select-Object -First 1
Select-String -Path $b.FullName -Pattern "pub initial_prompt"   # must match; empty = truncated bindings
```

After changing libclang, force the sys crate to regenerate: `cargo clean -p whisper-rs-sys`.

Open a **new** shell so PATH updates apply, then:

```powershell
rustup default stable-x86_64-pc-windows-msvc
corepack enable
corepack prepare pnpm@latest --activate
```

Confirm: `rustc --version`, `cargo --version`, `node --version`, `pnpm --version`, `cmake --version`.

### 2. Fetch the whisper.cpp submodule

The repo was cloned shallow. The backend needs the submodule:

```powershell
cd $env:USERPROFILE\Projects\meetily
git submodule update --init --recursive --depth 1
```

### 3. Build the llama-helper sidecar

`tauri.conf.json` declares two `externalBin` sidecars. FFmpeg is downloaded automatically
by the build script, but `llama-helper` must be built from the crate in this repo and
placed with the target-triple suffix Tauri expects, or the build fails with
`resource path binaries\llama-helper-x86_64-pc-windows-msvc.exe doesn't exist`:

```powershell
cd $env:USERPROFILE\Projects\meetily\llama-helper
cargo build --release
Copy-Item ..\target\release\llama-helper.exe `
  ..\frontend\src-tauri\binaries\llama-helper-x86_64-pc-windows-msvc.exe
```

### 4. Install frontend dependencies

```powershell
cd frontend
pnpm install
```

### 5. Run in development

```powershell
pnpm tauri dev
```

This starts Next.js on `http://localhost:3118` and launches the Tauri shell against it.
First run compiles the whole Rust dependency tree — expect 10–25 minutes. Later runs are
incremental.

### 6. Build the Windows installer

```powershell
cd frontend
pnpm tauri build
```

Artifacts land in `frontend/src-tauri/target/release/bundle/`:

- `msi/ULab Scribe_0.4.0_x64_en-US.msi`
- `nsis/ULab Scribe_0.4.0_x64-setup.exe`
- the raw binary at `frontend/src-tauri/target/release/ulab-scribe.exe`

### Build notes

- **Code signing:** removed. Upstream's `tauri.conf.json` invoked
  `scripts/sign-windows.ps1` via a `signCommand` key, which fails without a certificate.
  The original config is kept at `tauri.conf.json.signed-bak`; restore that key once a
  Unissant signing cert exists.
- **Branding assets:** the full icon set, `public/logo.png` (845×295 wordmark) and
  `public/logo-collapsed.png` (500×500) are generated from `ulab-scribe-icon.png` in the
  repo root. Regenerate the app icons with `pnpm tauri icon ..\ulab-scribe-icon.png`.
- **GPU acceleration:** CUDA and Vulkan backends are optional; the CPU build works
  everywhere. See `docs/` for enabling them.
- **First build size:** the Rust target directory reaches 10–20 GB.

---

## Building for macOS

**A macOS build cannot be produced on Windows.** Not a tooling gap that can be closed — Tauri's
`.app` and `.dmg` bundlers, `codesign`, `hdiutil`, `lipo` and the macOS SDK are Apple-only. The
Rust target (`aarch64-apple-darwin`) installs fine, but there is nothing to link with. Two real
paths:

### Option A — on a Mac (Apple Silicon)

```bash
xcode-select --install                       # Apple toolchain
brew install cmake llvm@18 node pnpm
export LIBCLANG_PATH="$(brew --prefix llvm@18)/lib"   # same bindgen constraint as Windows
rustup target add aarch64-apple-darwin

git clone <this-repo> && cd meetily
git submodule update --init --recursive

cargo build --release -p llama-helper --features metal
mkdir -p frontend/src-tauri/binaries
cp target/release/llama-helper frontend/src-tauri/binaries/llama-helper-aarch64-apple-darwin

cd frontend && pnpm install && pnpm tauri build --target aarch64-apple-darwin
```

Artifacts land in `target/aarch64-apple-darwin/release/bundle/` as `dmg/*.dmg` and `macos/*.app`.

### Option B — GitHub Actions (no Mac required)

`.github/workflows/build-macos.yml` runs on `macos-latest` and is `workflow_dispatch` (manual).
It already builds the llama-helper sidecar with Metal and produces DMG + .app. Set
`sign-build: false` and it produces an **unsigned** build with no Apple Developer account —
the same posture as the current Windows build.

For a signed and notarized build, populate these repository secrets: `APPLE_CERTIFICATE`,
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_ID_PASSWORD`,
`APPLE_TEAM_ID`. Apple gatekeeping is stricter than SmartScreen — an unsigned `.app` from the
internet is blocked outright rather than warned about, so notarization matters more on macOS
than it does on Windows.

### macOS-specific notes

- `tauri.conf.json` sets `signingIdentity: "-"` (ad-hoc) and `hardenedRuntime: true`. Ad-hoc
  signing is fine locally; distribution needs a real Developer ID.
- The updater removal means `TAURI_SIGNING_PRIVATE_KEY` in the workflow is now unused. Harmless,
  but it no longer produces `.sig` files because `createUpdaterArtifacts` is `false`.
- `whisper-rs` builds with Metal and CoreML features on macOS — different acceleration path from
  the Windows CPU build, so transcription performance will not be comparable.
- The macOS console helper shells out to `log stream --process "ULab Scribe"`. The quotes matter:
  the product name contains a space.

---

## Verifying the telemetry removal

After building, confirm nothing phones home:

```powershell
# no analytics module or dependency left in the tree
Select-String -Path "frontend\src-tauri\Cargo.toml" -Pattern "posthog"
Get-ChildItem frontend\src-tauri\src\analytics -ErrorAction SilentlyContinue

# no PostHog host string in the compiled binary
Get-Content "frontend\src-tauri\target\release\ulab-scribe.exe" -AsByteStream -Raw |
  ForEach-Object { [System.Text.Encoding]::ASCII.GetString($_) } |
  Select-String -Pattern "posthog" -AllMatches
```

All three should return nothing. For a stronger check, run the app behind a proxy or with
Wireshark and confirm the only outbound connections are to the model endpoints you
configured.
