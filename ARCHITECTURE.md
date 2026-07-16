# Dremplay One: Infinite Detail Voxel Engine

## Autopilot navigation laboratory

Autopilot is a client of the same world API as the human player. Its sensor stage samples the immutable terrain, slope, water margin, trail field, and current location at candidate headings. Its evaluator scores those observations according to a selected survey purpose while retaining universal safety penalties. Its steering stage turns and walks through the ordinary player collision, gravity, clipmap, water, and Resource systems. No mode teleports the observer or bypasses a late region.

This separation is intentionally reusable for later actors. A bot may replace the current wandering objective with a destination planner while retaining the sensor contract, local evaluator, and physical steering. Deterministic coordinate queries mean the navigator can reason about unloaded terrain without generating its fine voxels.

The laboratory samples its own consequences once per second. Position, travelled distance, frame time, GPU time, exact and known chunk counts, voxel bytes, provenance size, and stream time form a portable tab-separated report. This turns sustained walking from a visual impression into a repeatable renderer and cache test.

## Continuous one-kilometer voxel horizon and atomic regions

The distant landscape is rendered as geometry, not as a finite painted wall. A compact 10 m control atlas is sampled onto distance-dependent 1–16 m voxel cells and ray-intersected through the full 1 km view. The far trace begins where exact traversal actually ended, so it cannot re-enter terrain behind the ray and invent a vertical boundary. Atmospheric color and fog operate on spatial hits without replacing their quantized silhouettes. A miss is sky.

The parent streamer works in world-aligned 100 × 100 m regions. Every scheduled region solves and commits its complete 10 × 10 control-cell square atomically; the atlas never advertises a row or column as a loaded region. Directional prediction crosses into the next region after the player passes a 35/65-percent threshold, providing early loading without oscillating when the camera turns.

State zero in the resident chunk table means “immutable mathematical parent,” not empty space. Local rays query that parent until an exact child arrives. State two alone means proven-empty sky and may be skipped wholesale. This distinction guarantees a continuous walkable surface while the bounded microvoxel cache refines nearby detail.

## Sparse surface clipmap

The editable near field is a 384 × 416 × 384 R8UI toroidal cache. It spans 38.4 m horizontally—enough for the complete 50-foot exact interaction tier with margin—while terrain beyond it remains the immutable mathematical height, hydrology, biome, and Resource field. The previous 768 × 416 × 768 volume represented the same source data with four times the resident memory and is retired.

The cache carries two tiny acceleration layers. A chunk-state texture distinguishes exact children, authoritative empty sky, and an unrefined mathematical parent. A second R8UI texture stores one occupancy bit per 4 × 4 × 4 exact block. Rays skip empty exact blocks and whole sky chunks; they never infer world data from those bits. If a mathematical child has not arrived, local traversal queries the immutable parent directly. Exact terrain and Resources replace the parent atomically.

Only surface children are predicted outside the resident ring. Shallow editable matter and canopies materialize after their mathematical column enters the ring; deep bedrock remains implicit until editing or visibility requests it. Incoming regions advance by complete 6.4 m sectors, and sparse CPU chunks may be discarded without changing terrain, Resource seeds, provenance, water, or edits. The collector runs during sustained travel and defers only while an atomic upload is active. A WebGL disjoint timer query measures the actual GPU frame; nonurgent decoding receives no budget while the renderer exceeds its presentation target.

## Retired full-island horizon panorama

The earlier renderer built a 2 KiB maximum-elevation panorama for 512 azimuths. Although sourced from the immutable heightmap, it was a screen-direction cache and could appear as a flat mountain wall. It is no longer generated at startup, fast travel, or during play, and the fragment renderer does not composite it.

The old functions remain temporarily as dormant reference code while background options are consolidated. They are not world data and are not a renderer fallback. Terrain inside the configured kilometer must come from the spatial atlas; a ray that misses it sees atmosphere and sky.

World refinement is gated by measured JavaScript and WebGL GPU work, not presentation interval alone. A browser may present a GPU-bound WebGL canvas while the main thread spends only one millisecond preparing each frame; the disjoint timer query still identifies the renderer as the limiting system. In that case optional decoding stops until the GPU is back inside budget. Rendering remains the only work inside `requestAnimationFrame`.

## Atmospheric distance projection

The beautiful background matte is a view of the same immutable world equation, not a second landscape. After detailed and far voxel observations end, the renderer ray-intersects the supplied height atlas and shades that hit with broad world-space derivatives. Ridge, valley, hydrology, snow, and coastline silhouettes therefore agree with the editable foreground and remain deterministic at every camera position.

The projection is intentionally lower-frequency than the height data. Twenty-meter derivative taps suppress individual atlas facets, while continuous height reconstruction preserves the island's true horizon. A smooth handoff between the Far away and Background thresholds changes the observation filter from visible voxels to the matte; it does not change or regenerate the underlying terrain.

Atmospheric color is distance based and stable. Nearby projected land begins in restrained green and teal, water remains brighter blue, and successive depth recedes toward the time-of-day horizon. The pass has no temporal noise, screen-space dither, alternating sample pattern, dynamic resolution, or overlay dimming. It adds four fixed atlas taps only after the detailed renderer misses, so it does not consume the foreground frame budget.

## 60 Hz frame ownership

The display frame is not a streaming timeslice. At 60 Hz the renderer owns the 16.67 ms interval; background systems run through browser idle callbacks and may consume only a bounded fraction of measured main-thread headroom. The scheduler tracks CPU work separately from requestAnimationFrame spacing, suspends optional refinement after a missed refresh, and runs no more than one background stage per idle callback. Far-atlas refresh, terrain prefetch, Resource compilation, ecology staging, and GPU publication therefore cannot stack their nominal budgets in the animation callback. A bounded timer fallback retains portability where the idle-callback API is absent.

Resource rasterization is resumable. Tree capsules and volume Resources advance in 256-sample batches, and emission of material plus part provenance advances through the same deadline-aware state machine. World-coordinate anchors partition emitted points into chunk slices during compilation. A newly encountered adult tree is therefore a sequence of sub-millisecond tasks rather than one synchronous graph, leaf-spray, voxel, taxonomy, and slicing burst.

Atomic visibility is decoupled from atomic upload. A 5×5 Resource neighborhood is built one chunk at a time, its GPU children are uploaded while marked invalid, and the renderer continues showing their mathematical parent. After every child is present, one small validity-texture update publishes the complete neighborhood. This retains coherent trunks and crowns without a multi-megabyte, dozens-of-calls commit frame.

Balanced GPU traversal uses a stable focus-weighted detail radius. The central interaction field retains the 5 cm virtual octave; peripheral rays transition continuously to the exact 10 cm resident grid and begin that traversal at the point where fine traversal stopped. The mapping depends only on screen position and never alternates between frames, avoiding the flashes and shimmer associated with dynamic framebuffer resizing. Full Soft quality retains the 5 cm octave across the entire frame.

## Multirate landscape and Resource compilation

The world equation and its render sampling rate are deliberately separate. Exact terrain height and hydrology remain available at every 10 cm resident column, while ecology-scale quantities—biome weights, strata mixture, snow accumulation, trails, soil mantle, and surface classification—are evaluated on a 40 cm lattice and shared by their fine children. A 32×32 terrain chunk therefore performs at most 81 expensive ecology queries rather than 1,024, a 12.6× reduction in that dominant query stack without changing the mathematical height silhouette. Those queries are keyed in world coordinates, so neighboring chunks share their border samples and each resident ecology coordinate runs the fused stack once while retained by the bounded LRU.

Dense vertical iteration is not a terrain representation. A prepared column exposes its solid top and bounded water interval; surface chunks write those occupied runs directly and do not test their empty sky cells. Fully subterranean chunks retain a constant-time homogeneous-bedrock representation until edits or visibility require detail.

A Resource definition remains the authority, but its temporary voxel observation is compiled in two stages. The first stage evaluates the seeded equation once and records material plus semantic part identity. The second partitions those points by world chunk. A trunk child, crown child, or neighboring overlap then consumes only the relevant slice rather than rescanning the complete adult tree. Surface micro-Resources use a rasterized root-exclusion mask derived from the same accepted prop equations, replacing repeated pairwise distance queries without changing placement.

All four accelerators are disposable caches. Eviction may discard ecology tiles, vertical spans, Resource slices, or root masks; querying the same coordinates and seed reconstructs the same terrain, Resource, material, and provenance.

## Portrait mobile interface

Touch play separates unobstructed observation from the thumb field without shrinking the world. In portrait orientation the renderer remains full-height. The upper two-thirds is one continuous look and aim gesture area; a thin divider marks the lower thumb field while the world remains visible behind it. Empty overlay space does not capture input. The cross D-pad is a continuous radial input with eight-direction feedback, while action, posture, and editing buttons keep independent pointer capture so movement and interaction may occur together.

Device presentation is explicit rather than inferred from touch alone. Dremplay Navigator owns the narrow phone composition and safe-area behavior. Tablet Touch shares the touch-control input system but retains the robust movable-window composition. PC Desktop disables touch surfaces and uses pointer lock, mouse, and keyboard. Auto mode classifies coarse-pointer phone widths separately from larger touch hardware, and every resolved mode is represented by a distinct body class.

The AI Loading Monitor is an observer, not a modal state. Closing it sets a persistent in-page visibility flag; loading, streaming, and frame telemetry continue updating its model without mutating that flag. Only the Loading menu command clears the closed state. The Resource identity HUD is a separate bottom-right layer and therefore remains available when the monitor is absent.

Navigator renders loader telemetry without the conveyor. Tablet Touch and PC Desktop share a compact duplicated conveyor whose half-width is measured explicitly and animated at a constant pixel velocity. The track is constructed once; phase transitions only change colors. Closing uses visibility and pointer exclusion rather than display removal, preserving the animation timeline and preventing mobile WebKit from rebuilding an oversized compositor layer.

Live-world input owns its gesture surface. Multi-touch browser zoom, WebKit gesture events, control-wheel zoom, selection, drag, callout, and tap-highlight behaviors are cancelled only when their target belongs to the world HUD or renderer. Tool windows, form fields, the loading log, and the Navigator launcher remain ordinary accessible document controls.

The document declares `width=device-width`, an initial scale of one, and `viewport-fit=cover`. This declaration is part of the renderer contract: without it, mobile Safari creates a desktop-width layout viewport and scales every CSS control down after layout, preventing portrait breakpoints and safe-area rules from matching the physical device. Zoom is not disabled.

Select opens a complete touch launcher rather than depending on keyboard shortcuts or an overflowing desktop menu. Every tool window becomes safe-area-aware, full-screen, independently scrollable, and uses iOS-sized controls. Start opens the mathematical heightmap directly. Landscape touch play retains the same controls without shrinking the renderer, and desktop pointer-lock behavior is unchanged.

## Graph-compiled Resource Builder

Resources are authored as compact formation graphs rather than meshes or stored voxel arrays. A graph contains a typed seed and named biological or geological stages connected by parent references. Each stage carries taxonomy, normalized graph position, length, child count, and angle. Vegetation graphs express roots, trunks or stems, branches, and terminals; fungi express spores, mycelium, stipes, caps, gills, or pores; mineral graphs express catalysts, eroded matrices, shards, terminals, and aggregate fields.

The Builder has three coordinated views: a draggable 2D formation graph, an interactive 3D curve or voxel preview, and a parameter pane. The graph and preview may detach into movable panes; detached panes leave normal grid flow and the main window contracts around what remains. Both previews compile from the same definition that the runtime queries; they do not create a second authoring representation. Parameter inputs invalidate the definition-keyed preview cache immediately, display their exact values, and visibly acknowledge the redraw.

Built-in Resource roles are immutable identity facts. Loading a library entry synchronizes its name, biological kingdom, compatible preset, graph taxonomy, materials, and preview in one transaction. A graph whose taxonomy does not belong to the Resource kingdom is discarded in favor of the matching canonical preset. Geological graph stages are not decorative metadata: eroded-rock lichen length, density, and angle feed the same patina equation used by voxel emission.

The graph is serialized inside the portable Resource transfer ID along with type, preset, deterministic seed, materials, and mathematical controls. At runtime the graph and high-level controls compile into bounded equations and seeded architecture. Render voxels remain disposable samples of those equations.

Every emitted Resource voxel receives provenance at part granularity. The identifier is a stable combination of Resource name and taxonomy label, such as `silver birch tree trunk`, `woodland mushroom gill`, or `pentagonal quartz cluster crystal terminal`. Inspection resolves this identity directly from the sparse provenance sidecar, allowing later harvesting, damage, crafting, and editor tools to address meaningful parts without changing the underlying material number.

Builder visualization is not part of engine initialization. Graph and voxel previews are evaluated lazily when the Builder opens and are guarded from the world loader. Runtime emission caches the registered identity for each `(Resource, taxonomy)` pair, so thousands of voxels may share one semantic part ID without repeating string construction or registry work during preload.

## Immutable world query

The authoritative level is a pure coordinate field. `terrainSample(x,z)`, `worldBiomeField(x,z)`, `worldTrailField(x,z)`, and the Resource equations return the same terrain, blended biome weights, ecological seed, natural trail occupancy, wind, and Resource roots independently of query order. Fine voxels are a disposable observation cache, not world data.

Fast travel changes the observer coordinates, publishes a bounded mathematical parent immediately, and clears stale fine-cache validity. Collision falls back to the same height equation while detail is refined. Player edits remain sparse overrides above the immutable field.

## Supplied heightmap world

The default playable level is finite and immutable at the macro scale. `heightmap-world-v2.js` is built directly from the supplied 1254×1254 grayscale map. Principal-axis fitting maps the island to 7.5 km SW–NE by 4.5 km cross-axis inside a 9 km ocean atlas. Its 1126×1126 control lattice is sampled every 8 m and indexed as 8,100 world-aligned 100×100 m regions. Elevation, valleys, water, drainage, and ridge strength are direct bounded lookups with smooth quintic-bilinear interpolation at runtime. The offline bake script is the only terrain-authoring stage; it is not a runtime fallback generator.

## Physical ecology and trails

The biome classifier does not read the painted concept map. It measures the immutable heightfield: elevation, first and second derivatives, local concavity, drainage and water proximity, deposition, soil depth, prevailing-wind exposure and shelter, solar aspect, erosion, temperature, and snow accumulation. Twelve biome weights overlap and normalize at every coordinate, so ecological boundaries alter materials, vegetation probability, and species selection continuously rather than drawing hard bands.

Woody recruitment uses those continuous measurements before selecting a species. Sugar maple occupies sheltered mesic forest with moderate slopes and sufficient moisture; birch and fir bias toward wetter ground, oak toward drier slopes, and spruce or fir toward cool montane terrain. Adult, sapling, and leaf-spray Resources share a species genome but derive immutable per-instance seeds from their world coordinates.

Natural trails are also continuous queries. Animal movement uses sheltered meadow, woodland, water access, meandering route fields, and deterministic branch breaks. Wind traces align to the shared wind vector on exposed coast and alpine ground. Dry washes follow drainage margins but exclude active water. The strongest field removes grass and selects locally plausible dirt, mud, sand, or gravel. No trail vertices or individual trail voxels are stored in the level.

The resident 10 cm voxel texture is deliberately not a second copy of the whole level. It is a disposable view cache for collision, carving, water, and Resources. Distance rendering reads the immutable atlas at configured voxel octaves. The moving cache cannot own terrain or Resource identity; invalid cells evaluate their continuous mathematical parent until a finer sample becomes available.

The first 300 m around the player is a hard visibility invariant. Startup verifies atlas coverage on all four sides before enabling play. Within this radius, terrain remains a quantized voxel representation and cannot be replaced by fog or the optional vector background matte. Local editable-overlay decoding is independent and cannot remove this coarse resident landscape.

## Product focus

Dremplay One is a browser-first voxel engine for mathematical worlds. It is designed to run on iPads, laptops, and modern smartphones through portable GPU facilities, bounded memory, deterministic procedural data, and resolution that follows visual need rather than a single global grid.

“Infinite detail” describes the source definition: a Resource or terrain field may be evaluated at any requested scale. A particular frame remains finite and budgeted. The engine must never promise infinite work, memory, or pixels.

## Continuous scene contract

World data is expressed in world units, never in cache-cell adjacency. Terrain is a continuous height/material field. Bedrock is an implicit solid. A Resource is a deterministic equation plus seed, transform, material field, and provenance. A pebble field, for example, defines continuous center positions, radii, shapes, and separation; it does not define a prebuilt collection of pebble voxels.

View-dependent voxels are filtered observations of this scene. A distant riverbed sample may carry aggregate coverage, mean normal, roughness, and occlusion. Refinement evaluates the same deterministic field and reveals gravel clusters, then individual pebbles, then their continuous rounded surfaces. Changing cache resolution cannot move a pebble, alter its real separation, or create a shadow solely because sampled cells became adjacent.

Lighting consumes continuous surface position, normal, material response, and mathematical visibility. Voxel-neighbor occupancy may accelerate a local query but is not authoritative geometry or occlusion. Sparse user edits are constructive-solid-geometry operations layered over the mathematical scene and must survive every cache eviction and resolution change.

Smooth terrain materials reconstruct lighting normals from multiple parent-scale occupancy radii. The fine 5 cm traversal still determines visibility and editing precision, but a stair-step side is not treated as an unrelated dark cube face. Ground cavity shading is disabled, wrapped diffuse response preserves readable shadowed slopes, and blurred palette noise is evaluated in stable parent coordinates. Random erosion may perturb the continuous field, but it may never punch isolated renderer-only holes into solid terrain.

## Influences

### John Lin / Voxely

The engine adopts the general-volume principle described in *The Perfect Voxel Engine*: use the representation best suited to each system. Allocation selects where and how long data lives; tagging declares attributes; conversion moves information between mathematical, editable, renderable, simulated, serialized, and network forms.

Source: <https://voxely.net/blog/the-perfect-voxel-engine/>

### Euclideon Pty Ltd

The engine draws architectural inspiration from WO 2014/043735 A1: hierarchy portions are tested using their dimensions, focal length, and display resolution; refinement stops when a cheaper representation sufficiently approximates perspective; child projection work should be derived from parent work where practical.

Dremplay One does not claim to reproduce Euclideon’s implementation. Patent status varies by jurisdiction and must be reviewed before commercial deployment.

Source: <https://patents.google.com/patent/WO2014043735A1/en>

### Atomontage

The product direction shares Atomontage’s publicly described emphasis on progressively streamed microvoxels, deep matter editing, browser distribution, and adapting one world to multiple devices. Dremplay One uses its own formats and implementation.

Source: <https://www.atomontage.com/>

## Non-negotiable invariants

1. The main thread must remain responsive. Procedural generation, conversion, compression, and persistence are incremental or off-thread.
2. Resolution transitions must be stable. Camera motion cannot regenerate material noise, change Resource identity, or visibly reshuffle silhouettes.
3. Every fine-cache cell has a complete mathematical parent. A newly refined cell becomes valid atomically, but missing children can never expose strips, holes, or half-converted terrain.
4. The closest required data is scheduled first, but work is predicted in broad directional sectors rather than narrow strips.
5. A frame has explicit CPU, upload, memory, and pixel budgets derived from the device profile.
6. Lighting consumes a common surface contract so octave changes do not change brightness or create black facets.
7. Mathematical definitions and edits are authoritative. Render voxels are caches and may be discarded or rebuilt.

### Legacy atomic resident-ring handoff

As of v0.0.1.4.1, sector conversion has an explicit prepare/commit boundary. Chunk and weather tiles are assembled in CPU-owned immutable buffers while the live ring remains untouched. After every buffer and the player's handoff corridor have been verified, all GPU subimage transfers execute in one render interval and the ring origin changes before drawing resumes. A cancelled prediction discards staging buffers; it never repairs or regenerates the current sector because that sector was never modified.

v0.0.1.4.2 makes the compact regional atlas the latency-hiding lead representation. It refreshes independently of exact-sector work and may fill an otherwise empty ray from 50 ft onward, but it never accepts edits or simulation state. Exact prediction is ordered surface-first, and an eight-chunk recent-region guard prevents heading jitter from immediately evicting work that was just completed. The resident ring remains the sole editable authority and changes only at the verified atomic handoff.

v0.0.1.4.3 restores the preview as a mathematical elevation and hydrography field rather than a flat sky-colored placeholder. Its reduction pyramid preserves relief, ridges, and stream coverage through the 10/20/40/80 m preview octaves. Directional Worker requests solve the same terrain equations on the upcoming 0.8 m lattice; no preview object instances are transferred. Ecology candidates and instance variation are threshold evaluations of continuous quasiperiodic fields, advancing the Resource system away from stored placements and toward definitions that can be reevaluated at arbitrary detail.

v0.0.1.5.0 retires the blocking handoff. A toroidal clipmap changes origin immediately and uses a compact validity texture to distinguish reusable physical storage from current world samples. v0.0.1.5.1 adds a mathematical proxy for every invalid child, globally prioritizes surface samples, and leaves deep bedrock implicit. These changes make voxels disposable observations of the world rather than the world database itself.

v0.0.1.4.4 treats the 10 m RGBA atlas strictly as mathematical control data. The fragment tracer reconstructs its continuous field on explicit 1/2/4/8 m virtual voxel lattices, providing tenfold near-preview sampling without tenfold samples along both atlas axes. Three resident-region-width rings are a renderer invariant and remain available independently of exact-sector readiness. The maximum-height texture remains a separate conservative acceleration structure; it proves empty intervals but no longer replaces reconstructed elevation with block maxima.

## Volume pipeline

| Format | Allocation | Important tags | Typical conversions |
|---|---|---|---|
| `resource_field` | immutable definition | equation, seed, material, provenance | fine overlay, resident grid |
| `ecology_seed` | sparse CPU | species, growth, habitat, Resource ID | Resource field |
| `resident_grid` | CPU + GPU ring | material, water, Resource ID, edits | merged grid, collision, network |
| `microvoxel_overlay` | procedural GPU cache | parent, field sample, palette shade | visible fragments |
| `merged_grid` | procedural GPU cache | occupancy, source coordinate, material | visible fragments |
| `horizon_atlas` | compact GPU hierarchy | height, water, biome, max height | distant fragments |
| `water_state` | sparse CPU queue | level, source, wake state | resident grid |
| `edit_csg` | sparse CPU log | operation, center, radius, material | resident grid, network |

Conversions are named, measurable operations. Each declares source format, destination format, required tags, output ownership, cancellation behavior, and estimated cost.

## Voxel octaves

An octave is a factor-of-two sampling band over the same underlying matter.

| Octave | Current pitch | Current range | Representation |
|---:|---:|---:|---|
| 0 | 5 cm | 0–20 ft | fine procedural overlay |
| 1 | 10 cm | 20–50 ft | authoritative editable grid |
| 2 | 20 cm | 50–250 ft | merged traversal grid |
| 3 | 10 m | 250–500 ft | hierarchical horizon atlas |
| 4 | 20 m | 500–1,000 ft | hierarchical horizon atlas |
| 5 | 40 m | 1,000–2,000 ft | hierarchical horizon atlas |
| 6 | 80 m | 2,000 ft–1 km | hierarchical horizon atlas |

The horizon atlas exposes four visible sub-octaves rather than filtering one atlas continuously: 10 m from 250–500 ft, 20 m from 500–1,000 ft, 40 m from 1,000–2,000 ft, and 80 m beyond 2,000 ft. Enlarged cells take their height from the matching maximum-reduction level, preserving mountain silhouettes. Small isolated underwater geological Resources are folded into the streambed representation after 50 ft so pebble detail follows the same distance contract.

Future octaves may refine below 5 cm around the gaze, editing brush, and inspected Resource. They must be requested through screen-space error and device budgets, not by globally doubling world resolution.

### v0.0.3.0 active scheduling

The resident 10 cm ring remains the editable authority. An embedded Worker now fills an 18-chunk mathematical terrain-plan reserve from interleaved 1.6 m samples, the main-thread voxel cache follows a movement-time horizon up to fourteen chunks, and the kilometer max-height atlas remains the final landscape octave. Fine planning fills the alternate samples only when a sector approaches. This deliberately loads equations and low-cost plans farther than dense matter.

GPU conversion is committed in 32×32×416-cell tiles using reusable staging memory. Water changes use independent 8×8×8 dirty tiles. Both systems have byte budgets, so spatially distant changes cannot accidentally form one massive transfer.

The first equation-defined exemplar set contains five- and seven-sided crystal clusters, recursive bracken fronds, a phyllotactic palm crown and bark rosettes, a weathered pyramid, and a columned stone temple. These definitions are stored as Resource identity rather than one frozen mesh.

## Mathematical Resource contract

A Resource definition contains:

- stable identity and version;
- deterministic seed and coordinate frame;
- conservative bounds at a requested growth stage;
- occupancy or signed-distance evaluator;
- material and provenance evaluator;
- optional recursive components and growth rules;
- scale-aware error bound;
- collision proxy conversion;
- octave-independent edit mapping.

The renderer requests samples at a physical pitch. It never owns the Resource’s identity. The same oak can therefore become a coarse crown, editable resident voxels, or close leaf microvoxels without becoming three unrelated objects.

## Selection and projection

For a hierarchy node of world-space diameter `d`, camera-space depth `z`, vertical field of view `fov`, and viewport height `h`, the projected diameter is approximately:

`pixels = d * h / (2 * z * tan(fov / 2))`

Subdivision continues only when projected error exceeds the quality target and budgets permit it. Thresholds use hysteresis so a node does not oscillate between octaves near a boundary.

## Predictive streaming

The scheduler scores broad sectors using:

- current distance and visibility;
- velocity and look-direction evidence;
- time until the player can reach the sector;
- missing octave coverage;
- edit, water, and ecology urgency;
- conversion and upload cost;
- device CPU, memory, and bandwidth profile.

Serial stages are allocation, source evaluation, tagging, conversion, compression, upload, validation, and atomic commit. Completed caches are retained behind the player until memory pressure requires eviction; authoritative definitions and edits remain.

## Portable acceleration path

The baseline remains WebGL2 with typed arrays, 2D/3D textures, mip hierarchies, instancing where appropriate, and Web Workers. WebGPU is an optional accelerator, not a requirement. SIMD/WASM may accelerate deterministic conversion later, but every release must preserve a functional portable path.

## Migration sequence

1. Instrument the restored renderer and freeze performance baselines.
2. Route existing LOD decisions through the octave registry.
3. Move terrain and Resource generation behind named conversion jobs.
4. Add worker-produced immutable sector packages and atomic commits.
5. Introduce a screen-space hierarchy for one Resource exemplar behind a feature flag.
6. Match lighting, collision, editing, and provenance across that hierarchy.
7. Expand only after frame-time, memory, visual-stability, and interaction tests pass on mobile and desktop profiles.

No phase may remove the stable fallback until its replacement is demonstrably faster and visually equivalent or better.
