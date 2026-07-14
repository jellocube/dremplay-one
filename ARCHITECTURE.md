# Dremplay One: Infinite Detail Voxel Engine

## Supplied heightmap world

The default playable level is finite and immutable at the macro scale. `heightmap-world-v2.js` is built directly from the supplied 1254×1254 grayscale map. Principal-axis fitting maps the island to 5 km SW–NE by 3 km cross-axis inside a 6 km ocean atlas. Its 751×751 control lattice is sampled every 8 m and indexed as 3,600 world-aligned 100×100 m regions. Elevation, valleys, water, drainage, and ridge strength are direct bounded lookups with smooth quintic-bilinear interpolation at runtime. The offline bake script is the only terrain-authoring stage; it is not a runtime fallback generator.

The resident 10 cm voxel texture is deliberately not a second copy of the whole level. It is a local decoded/editable overlay for collision, carving, water, and Resources. Distance rendering reads the immutable atlas at configured voxel octaves. This separation keeps the complete map immediately available while bounding CPU and GPU memory on iPad and mobile browsers.

The first 300 m around the player is a hard visibility invariant. Startup verifies atlas coverage on all four sides before enabling play. Within this radius, terrain remains a quantized voxel representation and cannot be replaced by fog or the optional vector background matte. Local editable-overlay decoding is independent and cannot remove this coarse resident landscape.

## Product focus

Dremplay One is a browser-first voxel engine for mathematical worlds. It is designed to run on iPads, laptops, and modern smartphones through portable GPU facilities, bounded memory, deterministic procedural data, and resolution that follows visual need rather than a single global grid.

“Infinite detail” describes the source definition: a Resource or terrain field may be evaluated at any requested scale. A particular frame remains finite and budgeted. The engine must never promise infinite work, memory, or pixels.

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
3. New data becomes visible atomically by region. The engine may prepare a sector in the background but must not expose strips, holes, or half-converted chunks.
4. The closest required data is scheduled first, but work is predicted in broad directional sectors rather than narrow strips.
5. A frame has explicit CPU, upload, memory, and pixel budgets derived from the device profile.
6. Lighting consumes a common surface contract so octave changes do not change brightness or create black facets.
7. Mathematical definitions and edits are authoritative. Render voxels are caches and may be discarded or rebuilt.

### Atomic resident-ring handoff

As of v0.0.1.4.1, sector conversion has an explicit prepare/commit boundary. Chunk and weather tiles are assembled in CPU-owned immutable buffers while the live ring remains untouched. After every buffer and the player's handoff corridor have been verified, all GPU subimage transfers execute in one render interval and the ring origin changes before drawing resumes. A cancelled prediction discards staging buffers; it never repairs or regenerates the current sector because that sector was never modified.

v0.0.1.4.2 makes the compact regional atlas the latency-hiding lead representation. It refreshes independently of exact-sector work and may fill an otherwise empty ray from 50 ft onward, but it never accepts edits or simulation state. Exact prediction is ordered surface-first, and an eight-chunk recent-region guard prevents heading jitter from immediately evicting work that was just completed. The resident ring remains the sole editable authority and changes only at the verified atomic handoff.

v0.0.1.4.3 restores the preview as a mathematical elevation and hydrography field rather than a flat sky-colored placeholder. Its reduction pyramid preserves relief, ridges, and stream coverage through the 10/20/40/80 m preview octaves. Directional Worker requests solve the same terrain equations on the upcoming 0.8 m lattice; no preview object instances are transferred. Ecology candidates and instance variation are threshold evaluations of continuous quasiperiodic fields, advancing the Resource system away from stored placements and toward definitions that can be reevaluated at arbitrary detail.

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
