# Dreamplay One

Current release: **v0.8.1**

Release folders use `dreamplay-one-vMAJOR.MINOR.PATCH` naming.

A standalone WebGL2 microvoxel prototype. No build step or external dependencies are required.

## v0.8.1 verdant valleys and predictive preload

- Replaced the valley-wide mud classification with saturated shoreline patches only
- Added grassy lowland coverage, dirt breaks, gravel outcrops, moss, and small hummocks around pools
- Expanded the prestream cache from 36×36 to 44×44 chunks
- Boot preparation is guaranteed to remain active for at least sixty seconds
- Cache replenishment receives up to 5 ms per frame so it stays ahead of walking and sprinting
- A brief bottom-right predictive-cache status appears approximately every twenty seconds
- Emergency visible generation remains available only if the deeper cache is actually outrun

## v0.8.0 Dreamplay identity and landscape gradients

- Renamed the project from Dremplayor One to **Dreamplay One**
- Replaced horizontal biome bands with slope, moisture, erosion, wind, and patch coverage fields
- Snow forms tongues, scoured rock faces, melt gaps, and variable-depth deposits
- Soil mantles vary in thickness and contain warped, interrupted stone lenses
- Grass, dirt, moss, and rock boundaries emerge as irregular ecological patches
- Replaced multi-octave cloud noise with efficient distant coarse voxel cloud decks
- Added a custom gold-and-phosphor retro pixel cursor
- Escape focuses the first menu command when pointer lock is released
- Restyled menus, windows, buttons, and headings with a medieval hacker aesthetic

## v0.7.4 stable chunk anchoring

- Fixed a bug where looking around moved the resident chunk window
- Camera yaw and pitch no longer trigger generation, eviction, or prefetch work
- Chunk shifts now depend exclusively on actual player position
- Added a four-chunk-wide central hysteresis zone to prevent boundary thrashing
- Standing still and rotating the camera performs no landscape streaming

## v0.7.3 prestreamed landscape cache

- Boot now pre-generates a 36×36 chunk landscape around the 24×24 resident window
- The extended boot may take substantially longer, with continuous progress reporting
- Six cached chunks are retained beyond every visible edge
- Normal view-window shifts consume prebuilt chunks without showing a loading interruption
- A silent background prefetcher spends at most 2 ms per frame replenishing the distant cache edge
- Clean chunks beyond the fixed prefetch ring are evicted to bound long-distance memory growth
- Emergency loading status appears only if movement somehow outruns the prefetch cache

## v0.7.2 nonblocking loader

- Loading status is a compact bottom-right window
- Loading never adds a fullscreen backdrop, tint, fade, or dimming layer
- Player movement, editing, water simulation, and rendering continue during runtime chunk generation
- Incoming landscape generation remains time-sliced to protect frame responsiveness

## v0.7.1 responsive loading and pointer control

- Boot generation is time-sliced across animation frames with visible progress
- Large directional landscape shifts show a streaming progress bar
- Streaming generates only incoming edge slabs instead of rescanning the resident window
- Resident-grid assembly uses native typed-array row copies
- The title screen is permanently retired after the first world entry
- Opening Console or any tool always leaves the live world visible
- Escape releases the pointer for GUI use
- With the cursor active, Space or Escape closes tools and returns to game-look control

## v0.7.0 mountain ecology and horizon streaming

- Snowcaps accumulate several voxels deep above a varied mountain snow line
- Narrow meltwater channels descend into persistent lowland pools
- Valleys expose dirt while middle elevations carry grass and moss
- Uneven 1–2 voxel non-colliding moss blades establish a future flora layer
- Mountain interiors use stone cores, thick variable dirt mantles, stone lenses, and clustered rock outcrops
- Removed procedural colored monoliths and floating platforms from natural terrain
- The fixed-memory resident window is biased 72% forward toward the camera
- Clean chunks falling behind the resident window are immediately evicted
- Reduced distance fog preserves a stronger landscape horizon
- Added moving, soft-edged, multi-layer procedural cloud decks with parallax and daylight shading
- Added editable Snow and Moss materials to the Material Designer

## v0.6.0 windowed tools and material IDs

- Opening tools keeps the live rendered world visible instead of showing the title screen
- Added a persistent top menu for Console, Material Editor, Options, Mods, Help, and About
- Every tool uses draggable title-bar window chrome
- Options provides live FOV, time, gravity, and lighting controls
- Material definitions have portable 16-digit hexadecimal properties IDs
- Copy and load buttons support saving and restoring material definitions
- Console equivalents: `material id <material>` and `material load <hex>`

## v0.5.0 Material Designer

- Added a draggable, windowed Material Designer with a live texture preview
- Edit base, light, and dark shades from the official palette subset
- Per-material noise strength, pattern scale, and blur/softness controls
- Stone and water default to broad smooth mottling; decorative materials remain crisp and noisy
- Changes apply directly to the live renderer and remain available as console commands
- Added draggable title-bar window chrome and close buttons to both tools
- Open the designer with the `designer` console command
- Scriptable controls: `material noise`, `material scale`, and `material blur`

## v0.4.1 mild material textures

- Every material now uses a close three-shade run from the official Myara palette
- Alternate light and dark pixels together occupy only about one eighth of a surface
- Removed high-contrast cross-hue combinations from the default material definitions

## v0.4.0 materials overhaul

- Palette-only deterministic color noise textures every solid and water material
- `palette` and `materials` list the available colors and materials
- `material <name|id>` inspects a material's base, light, and dark colors
- `material select` and `material sample` choose the right-click placement material
- `material set` edits any material color using an official palette index
- `material reset` restores one material or the complete default library

## v0.3.0 command console

- `help`: command list with descriptions and valid ranges
- `respawn`: return to the initial spawn point
- `gravity <m/s²>`: set downward acceleration
- `time <1-24>`: move the sun and change world lighting and sky
- `speed <m/s>`, `jump <m/s>`, `reach <m>`: tune movement and editing
- `brush <voxels>`: set carve and placement ball radius
- `waterflow <on|off>`: freeze or resume cellular water
- `fov <40-110>`: change field of view
- `where`: show exact player coordinates

## v0.2.4 isotropic smoothing

- Added six wider planar diagonal sample pairs at four-voxel radius
- Added all eight 3D corner directions as four opposite sample pairs
- Reduced axis-only cavity darkening to prevent terrace bands

## v0.2.3 slope smoothing

- Diagonal density samples make the lightmode-1 normal kernel more spherical
- Reduced direct cube-face bias on terrain
- Uniform grass base removes blocky color boundaries across outdoor slopes

## v0.2.2 cave lighting

- Lightmode 1 uses weighted 1-, 2-, and 4-voxel normal samples
- Smooth distance fog in lightmode 1 removes contour banding
- Local cavity darkening and restrained rock highlights
- Palette-only material variation breaks up flat solid-color terrain

## v0.2.1 lighting console

- Press `/` to open or close the console
- `Escape` also closes the console
- `lightmode 0`: hard Voxed face-direction shading
- `lightmode 1`: Voxlap estimated-normal directional lighting
- `help`: list console commands

## v0.2.0 lighting

- Voxlap/Voxed `lightmode 0`-style hard face-direction shading
- No smooth terrain normals
- No soft ambient occlusion
- Eight-level face brightness and sixteen-level distance shading
- Original Myara material palette retained

## Run

Open `index.html` in a WebGL2-capable desktop browser. If the browser restricts local files, serve this directory with any static HTTP server, for example:

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Controls

- WASD: move
- Shift: sprint
- Space: jump
- Mouse: look
- Left mouse: carve (hold to repeat)
- Right mouse: place (hold to repeat)
- Escape: release pointer lock

## Optimization pass

- Dirty-region `texSubImage3D` uploads for edits
- One-byte `R8UI` material voxels (4× smaller than the original RGBA storage)
- Circular GPU texture window with edge-slab streaming uploads
- Bounded eviction of distant, unedited chunks
- Multi-scale terrain combining broad hills with fine undulation and carved lowland basins
- Semi-transparent blue water blocks with budgeted gravity and sideways flow after terrain edits
- 768×160×768 resident voxel window, including 6.4 m (21 ft) below the old ground datum
- Six-metre crosshair editing reach for predictable nearby targeting
- Right-click places a voxel ball instead of a single dot
- Terrain, structure, platform, and water material textures use exact `myara_1.aseprite` palette entries
- Lighting, fog, and sky remain smooth and are not screen-quantized
- Fixed render scaling to prevent black frames caused by drawing-buffer resizing
- CRT scan overlay removed for a visually stable, non-flashing presentation
- Reduced distance fog so the expanded terrain remains visible
- Blue procedural sky with horizon haze and a warm sun glow
- Adjustable internal render resolution
- Runtime profiling overlay
- Deterministic voxel colors and floating features
- Correct feet/eye player origin
- Wall sliding, swept vertical movement, and stair stepping
- Player-safe voxel placement and held-button editing

Edited chunks remain resident so player changes are never silently lost. IndexedDB persistence and worker-based generation are the next architectural optimizations.
