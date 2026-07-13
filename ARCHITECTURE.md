# Dremplay One: Infinite Detail Voxel Engine

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
| 3 | 10 m | 250 ft–1 km | hierarchical horizon atlas |

Future octaves may refine below 5 cm around the gaze, editing brush, and inspected Resource. They must be requested through screen-space error and device budgets, not by globally doubling world resolution.

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
