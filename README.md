# Dremplay One

**Infinite Detail Voxel Engine**

Current release: **v0.0.1.5.3**

## v0.0.1.5.3 biome Resources restored

- Restored deterministic biome Resources to the working mathematical terrain cache: trees and saplings, shrubs, flowers, moss, grass blades, boulders, stone fragments, sand grains, and stream pebbles again resolve from their continuous ecology fields.
- Replaced the reversed deferred-decoration order with a near-first surface/canopy queue. Nearby Resources now become visible before distant canopy work instead of remaining trapped behind thousands of far cells.
- Uses the existing preload audit frames to rasterize a device-scaled near-spawn Resource neighborhood without extending the startup timer or interrupting walking.
- Added deterministic root exclusion. Rocks reserve their footprints before trees; trees reserve theirs before shrubs and flowers; micro-grass and grains leave coherent clearance around all accepted props. Plants no longer emerge from flowers, and trees no longer grow from rocks.
- Keeps Resources surface-only, reproducible, provenance-tagged, and disposable as render-cache samples. The mathematical biome definition remains independent of voxel resolution.

## v0.0.1.5.2 continuous surface-span fix

- Fixed the rectangular trenches, floating terrain shelves, black openings, and abrupt chunk faces visible while the moving cache refined.
- Replaced one-centre-height scheduling with a conservative mathematical height-range query across every 3.2 m horizontal chunk. Every vertical child intersected by a slope is now classified as surface work.
- Preserved global surface-first priority: all intersected surface children across the incoming region resolve before shallow soil, canopy, or Resource refinement.
- Uploads exact local mathematical height/moisture proxy data for newly exposed columns before their fine children become visible. Pending cells no longer splice the coarse 10 m far atlas directly against 10 cm terrain.
- Retains implicit bedrock and disposable view caches from v0.0.1.5.1; this is a stitching correction, not an architectural rollback.
- Added a regression case for a sloped horizontal column crossing two vertical chunk levels.

## v0.0.1.5.1 mathematical surface first

- Corrected the data model: the continuous height/material/Resource fields are authoritative; resident voxels are disposable view samples rather than world ownership.
- Added an in-shader mathematical terrain proxy for every pending cache cell. It supplies surface material, hydrography and one implicit stone volume, so fine chunks can refine without visible construction walls.
- Reordered startup, prediction and moving-cache work globally. Every surface cell across the requested region now resolves before shallow subsurface or canopy samples; the old per-column vertical-stack order is gone.
- Reduced routine materialization from thirteen vertical chunks per terrain column to the surface, two shallow editable chunks (about twenty feet), and three optional canopy chunks.
- Deep bedrock is no longer streamed as ordinary voxel chunks. It remains an implicit mathematical solid until digging, editing or a close query explicitly requests that location.
- Predictive terrain generation no longer instantiates procedural Resources while walking. Deterministic Resource definitions refine later under idle budgets.
- Documented the resolution consequence honestly: doubling linear voxel resolution does not increase mathematical world data, but the previous cache implementation performed eight times the local voxel work and shifted twice as often. This update removes most of that inappropriate work.

## v0.0.1.5.0 whole-world moving clipmap

- Replaced the blocking sector streamer with a moving toroidal voxel clipmap. The cache origin follows the player immediately instead of waiting for 1,248 chunks to generate and stage.
- Added a 24×13×24 chunk-validity texture. A cache shift transfers only 7.5 KiB of residency state; stale physical voxel slots are ignored without clearing or rebuilding the 40 MiB incoming volume.
- Kept the immutable mathematical landscape visible beneath every invalid or pending fine chunk, so decoder latency can reduce detail but cannot expose an edge, wall, or air cliff.
- Fine terrain chunks upload independently under a frame budget. Natural Resources decorate later during idle frames rather than delaying terrain continuity.
- Made the complete 6×6 km atlas a sparse editable world. The 24×24-chunk volume is only a GPU view cache; dirty authored chunks remain globally owned and are never discarded when the cache moves.
- Added a one-kilometre multi-direction walking regression test covering clipmap recentering, the 300 m parent-terrain invariant, and sparse edit retention.

## v0.0.1.4.9 continuous terrain handoff

- Fixed the false vertical terrain curtain at the edge of the 76.8 m editable voxel ring. The mathematical height-field trace now begins inside the resident ring and solves the real surface crossing instead of treating the decoder boundary as terrain.
- Made the immutable supplied height field authoritative for collision while a fine chunk is pending. Walking can no longer turn a late decoder job into an air cliff or world edge.
- Kept exact voxels, edits, caves, water, and Resources authoritative as soon as their chunk is resident; the fallback changes no world coordinates and requires no procedural world regeneration.
- Advanced the cache revision so browsers replace the broken boundary shader and collision path immediately.

## v0.0.1.4.8 supplied heightmap island

- Replaced the synthetic example island with the supplied 1254×1254 grayscale heightmap as the authoritative macro landscape.
- Fits the image’s measured principal axis to a five-kilometer SW–NE island length and its cross-axis to three kilometers, preserving the intended diagonal orientation, coastline, outlying rocks, enclosed lakes, and visible drainage structure.
- Bakes the map into a 751×751 immutable control lattice across a six-kilometer ocean atlas. Samples are eight meters apart and evaluate as a continuous quintic-bilinear height field at arbitrary voxel coordinates, so source pixels do not appear as terrain blocks.
- Maps grayscale elevation into the engine’s full 2–350 voxel vertical range while retaining black water and coastline regions as pool/ocean coverage. Local strata, materials, vegetation, Resources, and editable voxels continue to derive from this fixed elevation field.
- Expands the finite region directory to 3,600 complete 100×100 m squares while retaining the mandatory 300 m visible voxel radius and fixed one-kilometer horizon.
- Ships only the compact compressed runtime heightmap atlas. The original source image remains in the local project’s `source-assets` directory for future rebakes and calibration.

## v0.0.1.4.7 guaranteed 300 m voxel ring

- Made 300 m of viewable landscape voxels in every direction a startup gate. Play remains disabled unless the pre-baked far atlas proves at least that much coverage on all four sides of the spawn point.
- Protected the first 300 m from fog. The previous 12 m default fog start could make already-resident terrain appear absent; all presets now begin fog at 300 m or farther.
- Protected the first 300 m from vector-matte substitution. Detail progresses through quantized 1 m, 2 m, and configurable background voxels, while the optional smooth matte may only take over beyond the guaranteed ring.
- Added an explicit coverage audit to the loading monitor. It reports available resident mathematical-voxel coverage and accepts the world only when the 300 m invariant passes.
- Retained the fixed one-kilometer horizon and the complete pre-baked 3 km world. The local 10 cm editable overlay may decode independently without gating or erasing the guaranteed distant voxel landscape.

## v0.0.1.4.6 pre-baked example world

- Replaced unbounded runtime macro-terrain generation with `Long Island Example`, a finite 3 km × 3 km world baked into the release. Its 376×376 immutable control lattice contains elevation, valleys, water, stream distance, and ridge data at 8 m spacing, with smooth mathematical interpolation between samples.
- The world is indexed as 900 world-aligned 100×100 m regions. Region data is already present at startup; movement performs bounded array lookup and interpolation rather than evaluating terrain noise.
- Changed far-atlas assembly and refresh scheduling from rows to complete 100 m squares. A square is solved as one indivisible unit, and the next atlas center is predicted about 150 m ahead of movement.
- Increased moving/idle atlas budgets now that every terrain sample is a cheap lookup. Newly exposed squares are packed much faster without exposing partial rows or columns.
- Kept the high-resolution editable voxel ring local to the player. It decodes collision, materials, Resources, water, and authored edits from the immutable world atlas instead of pretending the whole 3 km level can fit in a mobile GPU as 10 cm voxels.
- Added a hard ocean boundary at the edge of the finite example level. Missing world assets disable play rather than silently falling back to a different procedurally generated map.

## v0.0.1.4.5 regional detail laboratory

- Partitioned distant preview updates into world-aligned 100×100 m regions. The active mathematical horizon always contains the player’s current region plus three complete region rings: a 7×7 neighborhood guaranteeing 300 m in every direction.
- Reuses overlapping preview control cells when crossing a region boundary and calculates only newly exposed 100 m edge regions. New regions are ordered nearest-first and the complete field is committed atomically, so the visible preview never becomes a partially replaced strip.
- Added live Detail, Near, Far, and Background distance controls. Far and background voxel pitch are independently adjustable, with chunky voxels, a continuous vector background matte, or a combined matte-over-voxel view.
- Added Bugtesting mode, enabled by default. Every Options row gains a Copy button that emits a versioned option identity/transfer ID containing the individual setting and complete LOD snapshot.
- Plants now require an explicit soil or grass substrate and their procedural voxels only occupy air. Trees, saplings, shrubs, flowers, moss, and grass therefore cannot grow from or overwrite exposed stone.
- Increased fir and blue-spruce recruitment in suitable hill and mountain habitats, including an extra deterministic upland conifer candidate, while retaining slope, snow, water, moisture, and geology exclusions.

## v0.0.1.4.4 tenfold regional preview

- Increased distant elevation/hydrography sampling resolution tenfold. The compact 10 m mathematical atlas is now a control field reconstructed by the GPU on a 1 m virtual lattice rather than displayed as block-sized texels.
- Guaranteed three complete resident-region-width preview rings around the player at all times: 1 m mathematical voxels through the first ring, 2 m through the second, and 4 m through the third. An 8 m mathematical voxel octave continues to the fixed 1 km horizon.
- Continuous elevation and stream interpolation removes the abrupt block terraces introduced by directly displaying control texels. The independent maximum-height hierarchy still conservatively skips empty ray intervals without changing the reconstructed surface.
- Removed the secondary RGBA reduction pyramid and its refresh-time allocations. A 256 KiB control field now produces the denser virtual representation, avoiding the approximately 100× CPU generation cost and 25 MiB allocation of a literal 2,560² atlas.
- Exact editable sectors still load surface-first behind the preview. Missing or unfinished sectors cannot create a sky gap inside the three guaranteed preview rings.

## v0.0.1.4.3 mathematical elevation preview

- Restored elevation and stream visibility in the non-editable regional preview. The atlas now carries a complete nearest-voxel mip pyramid: elevation and ridges use conservative maxima, moisture is averaged, and hydrography uses conservative coverage at every distance octave.
- Added an analytic river-distance footprint. Streams narrower than a 10 m preview texel remain represented without placing stream meshes or evaluating multiple complete terrain stacks per cell.
- Removed the low-valley-only restriction from preview hydrography, allowing mathematically generated upland streams to remain blue as they descend toward pools.
- Re-aims the terrain-planning Worker along the current movement/camera prediction. Exact 0.8 m elevation, basin, ridge, and stream samples are solved ahead of the player before dense editable voxel and Resource synthesis reaches them.
- Natural tree, sapling, shrub, boulder, moss, flower, size, and instance-seed selection now derives from continuous quasiperiodic ecology fields rather than stored object placements or cell hashes.
- Added a dedicated `blue_spruce_frond` material slot. Its aesthetic payload comes from `0xD304000B0085000C1FA2C702`; builder stone remains a separate unchanged material, and only blue spruce trees, saplings, and needle sprays use the new slot.

## v0.0.1.4.2 preview-led regional streaming

- Restored the compact height/material region preview as the continuity layer whenever exact resident or merged voxels have not arrived. It can now fill a missing 50–250 ft interval instead of leaving sky until the former 250 ft gate.
- Removed preview starvation during exact-sector preparation. The 2.56 km atlas refresh receives a small independent frame budget, recenters after 90 m instead of 180 m, and remains visible while dense editable matter is prepared.
- Fixed needless sector regeneration after turning. The memory recycler now keeps an eight-chunk recent-region guard rather than deleting everything more than three chunks behind the instantaneous predicted heading.
- Changed predictive work order from empty sky first to terrain surface first. Each ahead column resolves its visible surface, neighboring subsurface, deep rock, and empty upper chunks in useful order.
- Recovery handoffs likewise prioritize surface-bearing chunks while retaining the v0.0.1.4.1 invariant: incoming data is staged offscreen and cannot modify the live resident ring before the atomic origin change.
- The coarse preview is never authoritative for edits. Carving, placement, water, Resources, and collision transfer to the exact resident representation only after its verified handoff.

## v0.0.1.4.1 atomic resident-sector fix

- Fixed sector streaming writing incremental upload tiles directly into physical slots still addressed by the current resident ring.
- Incoming sectors are now prepared entirely in immutable CPU staging buffers. The live 3D texture and new ring origin are committed together before the next rendered frame, so no partially replaced sector can appear.
- Every generation, staging, and final commit phase revalidates that the player remains inside the requested handoff corridor. Obsolete movement predictions are discarded without touching the live resident texture.
- Diagonal travel resolves one broad axis per commit, bounding staging memory and preventing two overlapping exit bands from recycling visible slots.
- This is numbered after the requested `v0.0.1.4` line without replacing the existing historical `v0.0.1.4` release.

## v0.0.3.0.1 visible distance-octave fix

- Fixed the far landscape atlas being linearly filtered like an ordinary height map. Horizon data now uses nearest voxel sampling, so its actual cell boundaries remain visible.
- Added explicit horizon octaves: 10 m cells from 250–500 ft, 20 m from 500–1,000 ft, 40 m from 1,000–2,000 ft, and 80 m beyond 2,000 ft to the one-kilometre limit.
- Uses the existing maximum-height hierarchy when cells enlarge. Peaks and ridges remain represented instead of being averaged out by coarse sampling.
- Added pebble-specific LOD behavior. Rounded stream pebbles remain distinct nearby, use normal authoritative cells through 50 ft, and merge into the lower-frequency streambed/water representation in the 20 cm distance tier.

## v0.0.3.0 octave planner and smooth budgets

- Removed the artificial 12-second startup hold. The title enters Ready state when the resident ring, weather relief, horizon hierarchy, and GPU transfer are actually complete.
- Added an embedded terrain-planning Worker. At boot it computes an 18-chunk outer reserve of deterministic warped, ridged, and basin octave samples while the main thread builds playable fine voxels.
- Extended the time-horizon directional cache to as much as fourteen fine chunks ahead. Idle/title time fills it aggressively; walking frames accept background generation only after a healthy frame and observe a cooldown.
- Reduced full-height streaming uploads from 64×64 to 32×32 cells: about 416 KiB per tile. Reusable typed-array staging buffers remove repeated large allocations and garbage-collection spikes.
- Replaced water's single potentially enormous dirty AABB with an 8³ dirty-tile queue, adaptive simulation work, and explicit per-frame upload-byte budgets.
- Throttled the AI Loading Monitor's DOM log painting without dropping log records or resetting its conveyor.
- Added equation-defined pentagonal and septagonal crystals, bracken fern, fan palm and palm bark, a weathered pyramid, and a stone temple to the Resource Editor. Their compact definitions remain valid across voxel octaves.

## v0.0.2.1 predictive memory and streaming

- Fixed unbounded retention of implicit all-air chunks. The memory recycler now walks every generated chunk record, including records without an allocated voxel array, and releases clean regions outside the directional reserve.
- Separated authored edits from transient water simulation. Flowing water no longer marks every touched chunk permanently dirty; disposable fluid levels and queue keys are reclaimed with their evicted chunks, while placed Resources, carving, building, and authored springs remain protected.
- Made the CPU reserve asymmetric: ten chunks are retained in the predicted travel direction and three behind the resident world. This preserves a deep ahead cache while releasing unused regions behind the player much sooner.
- Moved resident-world handoff to roughly 32 m before the boundary instead of roughly 19 m. Predictive generation now reaches the full ten-chunk/32 m frontier before those sectors enter the visible resident ring.
- Reduced terrain-planning garbage collection by replacing four full temporary terrain objects per column with scalar height interpolation for slope taps.
- Converted terrain, Resource voxel, Resource architecture, and Resource ceiling caches to device-tiered bounded LRUs. Mobile retains the smallest working set; high-tier devices retain more reuse without allowing unlimited growth.
- Added five-second idle memory maintenance and a `memory [clear]` console command reporting allocated versus implicit chunks, derived cache sizes, fluid metadata, and protected authored edits.
- Kept generation and uploads frame-budgeted. Directional sectors still become authoritative only after all generation and tiled uploads complete, preserving atomic landscape commits.

## v0.0.2.0 architectural remix foundation

- Reframed Dremplay One as a portable Infinite Detail Voxel Engine for iPad, laptop, and modern smartphone browsers while retaining the restored mature renderer as the compatibility target.
- Added a first-class voxel-octave registry covering the current 5 cm, 10 cm, 20 cm, and 10 m representations. Each octave declares its physical pitch, distance domain, volume format, and purpose.
- Added a tagged volume-format registry based on allocation, tagging, and conversion rather than one universal world structure. Mathematical Resource fields, ecology seeds, editable matter, fine overlays, merged voxels, horizon data, water, and CSG edits now have explicit roles and conversion routes.
- Added a conservative device capability profile using portable browser signals. It reports mobile, balanced, or high tier; logical processors; available memory when exposed; touch capability; and a target budget for future streaming work.
- Added `octaves`, `detail <meters>`, `formats`, and `device` console diagnostics so the architecture is visible and testable in the live engine.
- Added `ARCHITECTURE.md`, defining the staged migration, performance invariants, mathematical Resource contract, screen-space refinement policy, predictive streaming model, and attribution boundaries.
- Kept gameplay and the known-compatible WebGL2 renderer unchanged. This release establishes interfaces and terminology before any new traversal or streaming path is allowed to replace stable behavior.

## v0.0.1.4 mature engine restoration

- Restored the complete v0.0.1.0.19.4 Fine Voxel Engine codebase after the experimental renderer replacement.
- Restored the established terrain, kilometer horizon, four-range voxel LOD, procedural ecology, Resources, materials, water, editors, console, loading monitor, touch controls and title interface as one known-compatible engine.
- Removed the later continuous-field lighting experiment, hierarchical-atlas replacement, and minimal adaptive-octree prototype from the active runtime. Their releases remain available in GitHub history, but none of that code runs in this build.
- Advanced the release manifest revision so hosted copies refresh to this restored runtime instead of retaining the experimental engine in cache.

## v0.0.1.0.19.4 smooth kilometer horizon

- Locked landscape view distance to 1.00 km in every graphics preset, Test Zone, Options, and the `view` console command. Performance settings may simplify expensive foreground effects but can no longer shorten the world horizon.
- Replaced the former 72-iteration far-heightfield loop with a hierarchical tracer. A nine-level max-reduction pyramid proves broad ray intervals empty, skips them in increasing strides, and descends to exact 10 m terrain samples only near possible relief.
- Kept the hierarchy to 85.3 KiB of R8 data derived from the existing far atlas. It adds no distant chunks, editable voxels, material regeneration, procedural Resources, or resident 3D-world uploads.
- Refreshes now build the height hierarchy from the completed offscreen atlas and commit both together. The existing 180 m recenter threshold retains at least 1.10 km of atlas coverage in every direction during movement.
- Added technical loading-monitor entries for hierarchy construction and GPU transfer, plus Options diagnostics showing the fixed kilometer contract and skip-pyramid memory cost.

## v0.0.1.0.19.3 four-range voxel LOD fix

- Added an exact distance ladder measured in feet: 5 cm microvoxels from 0–20 ft, authoritative 10 cm voxels from 20–50 ft, merged 20 cm voxels from 50–250 ft, and the compact kilometer terrain atlas from 250 ft onward.
- Added a dedicated 20 cm DDA traversal that consumes two stable opposite-corner samples per merged cell. It halves distant traversal iterations without allocating another 3D texture, regenerating material noise, or adding streaming uploads.
- Kept one authoritative 10 cm world beneath every level. Merged hits retain their source material coordinate, so official-palette materials, soft lighting, water shading, Resource identity, collision, and editing do not change at LOD boundaries.
- Gated the far-terrain intersection to 76.2 m / 250 ft so the atlas cannot replace nearby tree, plant, rock, or terrain silhouettes prematurely.
- Updated Options and the About panel to report the complete physical LOD ladder. Quality and Balanced use the requested 20/50/250 ft boundaries; Performance may disable only the 5 cm foreground pass.

## v0.0.1.0.19.2 natural microdetail fix

- Rebuilt generated grass Resources as continuous one-cell-wide 5 cm blades. Dense ground remains a stable carpet, while isolated meadow, slope and tall-grass parents resolve into individually readable blades with their existing wind lean and varied height.
- Replaced blocky leaf fragments with small, coherent horizontal or angled 5 cm leaf plates. Orientation varies by stable growth seed, fine palette shades preserve vein-like detail, and the coarse parent canopy remains available to the distant LOD.
- Rounded submerged stream pebbles and geological grains by removing a stable minority of their fine corner cells. Pebbles retain one simple coarse interaction target and Resource provenance even though their near silhouette is more natural.
- Replaced noisy bark corner erosion with deterministic supported-corner rounding. Thick trunks and branches receive even circular outlines at 5 cm; thin saplings stay complete and consistent instead of randomly losing cells.
- Matched the Resource Editor preview to the runtime rules for grass columns, leaf plates, flowers, grains and rounded wood, while retaining automatic fit for large trees.

## v0.0.1.0.19.1 microvoxel model bugfix

- Extended the 5 cm near-field lattice to every procedural Resource material. Leaves, needles, flowers and grass use fine porosity; exposed bark and wood trim their corner octants; rocks, soil props and placed models use the same correlated micro-surface system.
- Restored the exact parent-density normal, cavity, daylight and specular calculations used by the 10 cm renderer. Small and merged voxels now match in softness and brightness across the LOD boundary instead of switching to harsh cube-face shadows.
- Added 5 cm model-detail identity to Resource transfer payloads while remaining compatible with existing IDs. Procedural scale continues to describe physical model size, independently from render LOD.
- Updated the Resource preview to expose 5 cm model cells without expanding the authoritative world texture or retaining a second full-resolution copy.
- Fine Resources merge back into their existing 10 cm parent cells beyond the configurable near-detail radius, preserving the optimized distant raymarch and unchanged physical silhouettes.

## v0.0.1.0.19 fine voxel engine

- Made the near field visibly and geometrically 2× finer: 5 cm traversal, correlated 5 cm surface relief, and independent palette shading for every microvoxel in all three axes. The previous pass incorrectly shaded each group from its 10 cm parent coordinate, concealing the doubled resolution.
- Fine hits now retain crisp microvoxel face normals and bypass the expensive 12–24 sample coarse smoothing kernel. The detailed foreground is both sharper and cheaper to light.
- Replaced procedural tree-bound queries with conservative species-aware allometric envelopes. Directional prefetch no longer constructs complete seeded branch graphs merely to test height and chunk overlap.
- Converted branch-architecture and voxelized-Resource caches to compact 64-entry LRU working sets, preventing long walks from retaining hundreds of large tree crowns while preserving reuse across adjacent chunks.
- Split streaming uploads into 6.4 m square, approximately 1.7 MiB tiles instead of approximately 6.8 MiB slabs. Broad directional sectors still commit together, but individual frames perform much less CPU copying and GPU upload work.
- Kept the authoritative editable/collidable world sparse at 10 cm and the distant landscape coarse. Only the configurable near radius pays for 5 cm ray traversal, avoiding an eightfold world-memory increase.

## v0.0.1.0.18 living woodland

- Added species-specific procedural Resources for silver birch, highbush blueberry, American elderberry, apple, white oak, balsam fir, and blue spruce, including juvenile tree forms and separate foliage/fruit/needle provenance Resources.
- Replaced the shared generic tree silhouette with botanical growth profiles. Birch uses slender apically dominant branching; oak and apple use low decurrent scaffold crowns; fir and spruce use monopodial trunks with tiered whorls; blueberry and elderberry use clonal multi-stem shrub architecture.
- Crown wood now follows continuous pipe-model-inspired taper. Secondary and tertiary branchlets support layered leaf or needle sprays, making crowns substantially bushier while preserving small sky and light gaps.
- Natural recruitment now responds to elevation, moisture, slope, pool proximity, and broad low-frequency ecotones. Conifers occupy cool ridges, fir/birch favor moist sites, oak favors warmer mesic ground, rare apples occupy lowland gaps, and berry shrubs form habitat-conditioned patches.
- Added palette-native apples, blueberries, elderberries, pale birch bark, fir needles, and blue-spruce needles without introducing screen-space color quantization.
- Added a hybrid two-stage world renderer. The near field uses virtual 5 cm microvoxels over the authoritative sparse 10 cm world, while distant terrain remains 10 cm and the kilometer horizon retains its coarse atlas. The default high-detail radius is 6.1 m / 20 ft.
- Added Near Voxel Detail graphics settings: Off, 3 m, 20 ft, and 10 m. Performance mode disables the fine pass; quality extends it without increasing voxel texture memory or upload bandwidth.

## v0.0.1.0.17 live release refresh

- Added a small `version.json` release manifest and a cache-bypassed update check in the document head. Hosted copies check immediately when opened, whenever the tab regains focus or visibility, and once per minute while left open.
- A newer monotonic release revision replaces the current URL with version and refresh query parameters, forcing the browser and intermediary caches to request the new `index.html`. Matching or older manifests never reload the page.
- Added document-level no-cache metadata. Offline and direct `file://` play skip the network check and continue normally.

## v0.0.1.0.16 startup-order recovery

- Fixed the desktop startup exception that left the title screen permanently waiting. Automatic platform activation called `clearTouchState()` before `touchMoveKnob` and the other touch-control constants had been initialized, triggering a temporal-dead-zone `ReferenceError` before `initGL()` could begin loading.
- Platform activation now runs only after every touch-control element, pointer binding, and action button exists. Desktop initialization can safely clear touch state, while iPad auto-detection retains the same behavior.
- Added a complete startup-order regression harness with a stubbed WebGL2/DOM runtime. It executes synchronous page initialization and the first eight queued terrain batches; the repaired build reaches terrain generation and advances the loading monitor to 2.4% with subsequent work queued.

## v0.0.1.0.15 touch, flowing water, foliage, and kilometer horizons

- Added native iPad/touch controls using independent Pointer Events: a left movement pad, right-side look surface, and hold controls for carve, place, jump, and crawl. Platform selection supports automatic coarse-pointer/iPadOS detection or explicit Touch/Desktop overrides on the title screen and in Options.
- Added a 25 m–1 km view-distance control. The engine keeps the nearby 10 cm resident microvoxels editable, then continues the exact deterministic terrain model through a compact 256×256, 10 m/sample far-field atlas covering 2.56 km.
- The far atlas carries height, moisture, water, and ridge data. The fragment shader adaptively ray-intersects it in at most 72 coarse steps, reconstructs terrain normals, uses official-palette landscape colors, and applies distance-scaled atmosphere without allocating distant 3D chunks.
- Far terrain refreshes only after 180 m of travel, builds incrementally behind a strict frame budget, and swaps into the GPU atomically so the horizon cannot appear as strips or temporarily vanish.
- Replaced decorative water motion with a sparse eight-level cellular flow system. Gravity has priority, finite cells conserve volume, lateral cells equalize toward the lowest neighbor, and placed/natural springs can renew. Generated lakes remain dormant until nearby terrain is edited or water is explicitly awakened.
- Added three water-rendering levels: solid palette water, animated pixel-flow facets, and reflective voxel water. The highest setting adds stepped Fresnel sky reflection, quantized moving surface normals, depth tint, and palette-white sun glints while retaining a deliberately pixelated result.
- Added an F10 Server Options window for gravity, water simulation state/budget/spread, natural spring behavior, water activation, spring placement, spawn coordinates, respawn, spawn capture, and teleportation. Matching console commands add `spawn`, `waterwake`, `spring`, and `view` controls.
- Replaced filled tree-crown ellipsoids with compound phyllotactic foliage. Each cluster is a fine terminal twig with alternating, roughly one-voxel leaf blades and forked leaflets, leaving visible air and light between leaves.
- Added `ironbark_leaf_spray` as a standalone editable and transferable foliage Resource. Leaf voxels in natural and manually placed trees retain this foliage provenance separately from the parent tree’s trunk ID; new pebble/foliage definitions are appended so all earlier runtime Resource IDs keep their established numbers.
- Increased the grass emitter to a jittered 2×2-voxel lattice with denser moisture/slope-aware short and tall grass. Pool and stream beds receive dense, locally varied `stream_pebble` Resource carpets using gravel, native rock, and quartz.
- Added the title links for [jellocube.me](https://jellocube.me), [Myar](https://jellocube.me/myar), and [jellocube/dremplay-one](https://github.com/jellocube/dremplay-one).
- Renamed the persistent panel to **AI Loading Monitor** and expanded its immutable conveyor to 17 permanent categories and 136 technical packets. Labels expose the real statistical and predictive work: seeded distributions, multi-octave signal synthesis, landscape classification, Resource growth, cellular water state, tensor assembly, distribution audits, movement prediction, kilometer-field sampling, weather estimation, GPU encoding, and frame-anomaly observation.
- Added a live AI-observer readout driven by the monitor’s semantic phase classifier and an exponentially weighted progress-rate estimator. It reports the active inference family, exact completion estimate, and EWMA ETA without rebuilding, clearing, resizing, or restarting the conveyor.

## v0.0.1.0.14 orographic voxel weather

- Added an exact terrain-weather texture shared by the world and cloud renderer. Every resident X/Z voxel carries generated surface height and moisture, encoded as a compact RG16UI field that follows the same circular streaming ring as the landscape.
- Cloud condensation now responds to the actual local surface, exact soil/water moisture, and the change in terrain elevation along the prevailing wind. Windward slopes gain orographic lift; descending lee slopes develop a rain-shadow suppression.
- Rebuilt cloud shapes as coherent multi-scale banks and billows evaluated only at 3D voxel centers. Coarse and fine options change voxel size without changing the underlying cloud formation's scale or location.
- Added a continuous formation lifecycle. Humid air parcels advect with the wind, condense, mature, and evaporate over several minutes with spatially offset phases, producing new clouds without global pulsing or abrupt seed resets.
- Added a seamless deterministic terrain proxy outside the resident weather texture so distant cloud formations do not reveal the square streaming boundary.
- Lower cloud bases now track relief while retaining at least 10.5 m of terrain clearance. Cloud depth expands in moist uplift and remains physically three-dimensional with distinct top, side, and underside lighting.
- Clarified Options → Clouds as Off, coarse 2.4 m weather voxels, or fine 0.8 m weather voxels.
- Fixed the very dark reed-grass voxels. Reeds now use three adjacent official medium greens (`#78A858`, `#60984C`, `#4C843C`), gentler noise, and a thin-blade daylight-transmission floor rather than opaque-stone shadowing.
- Deterministic field sampling measured 47.6–70.8% cloud-column coverage across a six-minute weather interval, with 36–37% of sampled columns naturally forming or dissipating during each three-minute interval.

## v0.0.1.0.13 Resource transfer, volumetric clouds, and sector streaming

- Added versioned hexadecimal Resource identity/transfer IDs containing the complete procedural definition: name, role, growth stage, primitive, materials, generator, base seed, scale distribution, growth parameters, component references, and snapshots of both materials’ palette/noise aesthetics.
- Resource IDs include an FNV-1a checksum. The Resource Editor has Copy and Load controls, and the console adds `resource id <name>` and `resource load <hex>`.
- The official palette canvas is now the color chooser. Base/Light/Dark chooses the target channel, clicking a swatch selects it, and hovering reports its palette number, natural name, and hexadecimal color.
- Moved the live Resource preview to a large persistent left pane and auto-fitted it from the actual occupied voxel bounds.
- Replaced conservative tree bounds with bounds measured directly from the generated branch and foliage architecture; flowers receive generous unbounded working margins.
- Natural props are reconstructed into every neighboring chunk touched by their true bounds, removing the invisible chunk box that cut tree crowns and plants at horizontal borders.
- Every natural Resource already derives its instance seed from world coordinates; manual placement now derives a fresh seed from its coordinates, base genome, and placement serial. Added a New seed control and changed the ironbark base genome away from 1337.
- Replaced projected 2D cloud decks with slowly transforming 3D voxel volumes between 50 and 78 meters altitude. Cells have separate top/side/underside lighting.
- Cloud options now explicitly select Off, a coarse 2.4 m 3D grid with 12 volume samples, or a fine 0.8 m 3D grid with 36 volume samples. Terrain fog uses the atmosphere without retracing clouds.
- Replaced one-chunk strip relocation with direction-predicted 12.8 m × 12.8 m sectors. The predictor builds an eight-chunk-deep reserve in the current movement/camera direction and continues at a bounded budget while moving.
- The resident window advances four chunks at once. Incoming data is uploaded as broad square sectors and the world/ring mapping commits only when the entire directional section is ready.
- Cold full-field generation with cross-chunk Resources benchmarks at 4.43 seconds CPU plus the fixed 12-second loading timeline; Test zone generation benchmarks at 1.16 seconds.

## v0.0.1.0.12 physical-scale wilderness

- Raised the vertical resident volume to 416 true 10 cm voxels (41.6 m), with major mountain relief reaching at least 30.5 m / 100 ft above the valley datum.
- Added domain-warped watershed rivers with a nominal 4.8 m / 15.7 ft wet core (measured median 5.9 m in the terrain audit) while retaining small erosion pools up to 2 m deep, ordinary hills, and open fields.
- Adult ironbark Resources now have a 6.1 m / 20 ft minimum generated height. Field boulders are meter-scale, while existing gravel, stone shards, sand grains, and small pools remain.
- Added ironbark saplings as a separate procedural growth stage and stable Resource ID. Low-frequency recruitment fields cluster adults and saplings naturally in compatible moist, soil-covered habitat.
- Added Adult/Sapling selection to the Resource Editor; the same branching architecture and material system supports both stages without disguising saplings as undersized adults.
- Procedural Resources are voxelized once per deterministic instance and reused by every intersecting vertical chunk, avoiding repeated full-volume tree evaluation.
- Empty high chunks remain implicit using an exact per-column Resource ceiling, preventing both clipped tree crowns and throwaway voxel allocations.
- Terrain-plan samples are shared across chunk borders and persisted in a compact versioned browser cache for faster later launches; the 234 MiB runtime voxel volume is deliberately not duplicated in browser storage.
- Full-world cold boot now targets 12 seconds and Test zone 6 seconds, with no artificial one-minute wait. The resident field is loaded first and the predictive frontier remains an idle-time task.

## v0.0.1.0.11 loader recovery

- Fixed the startup exception in the default boulder's Resource Editor preview: radial faceting now uses a mutable radius accumulator.
- The previous exception occurred before the first terrain-loading frame, making the title loader appear permanently stalled.
- Verification now executes the page initialization path, Resource preview, and queued loading frames in addition to syntax and isolated generator tests.

## v0.0.1.0.10 natural Resource forms and stable monitor

- Test zone returns to near-full rendering resolution: 0.45 versus the full world's 0.50, while retaining its compact volume and simplified shader path.
- The Resource library remains exactly ten named definitions with the same stable registration order and provenance IDs.
- Ironbark trees now use tapered deterministic branch graphs growing toward golden-angle terminal attraction points, upward tropism, secondary twigs, and separate porous foliage clusters.
- Foxglove bells and leaves use golden-angle phyllotaxis; grasses curve along quadratic wind response with centered height distributions.
- Boulders and chips combine anisotropic superellipsoids, asymmetric cleavage planes, multi-scale roughness, partial burial, and exposed-face patina.
- Moss grows as overlapping cushion colonies instead of one perturbed ellipsoid.
- Natural instances use bounded lognormal-like scale variation plus small architectural parameter variation, eliminating cloned silhouettes without extreme outliers.
- Terrain relief now nests subordinate ridges within primary mountain masses, and ground-cover patches combine macro and meso ecological scales.
- The Resource editor exposes Natural size variation so the researched distribution remains editable.
- Resource previews are now depth-sorted isometric voxel renders rather than misleading single-plane slices; input-driven preview work is frame-coalesced.
- Loading Monitor now has a true minimize control. It collapses to its title bar without using `display:none`; the conveyor's animation clock continues uninterrupted while minimized.
- The idle close button minimizes instead of destroying the monitor, eliminating the remaining during-play conveyor reset path.
- Options now exposes Quality, Balanced, Performance, and Custom profiles plus fixed resolution, live view distance, fog start/density, lighting quality, material detail, cloud detail, water-cell budget, streaming milliseconds, and vegetation geometry detail.
- View distance and fog are shader uniforms, so they update live without rebuilding terrain. Water and streaming controls directly change their per-frame CPU budgets.
- Resolution and vegetation geometry are explicit reload-only settings carried in the local file URL; they never resize the framebuffer or regenerate Resources unexpectedly during play.
- The Options diagnostics show pending framebuffer size, relative fragment count, resident voxel/GPU memory, current renderer size, and measured FPS.

Research basis: Runions, Lane & Prusinkiewicz, *Modeling Trees with a Space Colonization Algorithm* (2007); Pałubicki et al., *Self-organizing Tree Models for Image Synthesis* (2009); Fowler, Prusinkiewicz & Battjes, *A Collision-based Model of Spiral Phyllotaxis* (1992); Sakurai & Miyata, *A Procedural Modeling of Various-Sized Rocks on the Ground* (2011).

## v0.0.1.0.9 continuous loading conveyor

- The conveyor now consists of two permanent, identical master tracks; phase changes never replace its entries, alter its width, or restart its animation.
- Every loading section has a technical category placard between its task packets: Initialize, Terrain synthesis, Resident assembly, Field audit, GPU transfer, Predictive cache, Frontier recovery, Frame scheduler, and Ready.
- The current category and its packets are highlighted using color-only class changes, preserving exact layout geometry and smooth compositor motion.
- Task complete and Ready to play remain on the conveyor instead of clearing it when loading finishes.
- Per-category packet spacing remains encoded in the permanent track, so serial and sparse tasks still read differently without causing a jump.

## v0.0.1.0.8 fixed 6× performance path

- Test zone now renders at a fixed 0.16 internal scale—16% of v0.0.1.0.7's pixel workload, a 6.25× fragment reduction by itself—with nearest-neighbor presentation for a deliberate microvoxel look.
- Its lightmode 1 spherical normal kernel uses 12 density reads instead of 30 while retaining axial and adjacent-diagonal smoothing.
- Its material shading uses one stable world-coordinate palette hash instead of evaluating trilinear 3D noise fields every frame.
- Its distant clouds use one stable coarse-cell hash instead of the full two-deck cloud field.
- Its ray traversal has a mathematically safe 640-step ceiling for the compact 384×224×384 resident volume.
- The performance path is fixed before play: no temporal checkerboarding, alternating frames, dynamic resolution changes, screen dimming, or flashing.
- Test-zone boot audit is capped at eight seconds after terrain generation completes.

## v0.0.1.0.7 full-speed Test zone

- Test zone now uses a genuinely compact 384×224×384 voxel texture: 31.5 MiB instead of the full world's 126 MiB.
- The raymarch exits at the Test zone boundary instead of traversing an invisible full-size volume.
- Test zone uses a fixed performance resolution selected before play; it never dynamically resizes or flashes during movement.
- Lightmode 1 keeps its adjacent diagonal smoothing with a compact sampling kernel, eliminating redundant wide and body-diagonal texture reads.
- Predictive generation, resident-window shifts, and material regeneration remain completely disabled inside Test zone.
- Render-only slow-frame diagnostics no longer rebuild the loading console or conveyor; actual loading work is still identified, while frame cost stays visible in the HUD.

## v0.0.1.0.6 selectable Test zone

- Added a title-menu `Test zone` button available while the full world is loading.
- Selecting it cancels the full boot job and generates a centered 12×12 horizontal test area—one quarter of the normal resident area.
- Test zone uses a 15-second progress target and disables predictive expansion so it remains small and quick.
- The normal full-world loading and Enter world flow remain unchanged.

## v0.0.1.0.5 walking performance and material stability

- Material noise is anchored to absolute world coordinates and no longer changes when the resident ring moves.
- Material shaders evaluate only the noise functions required by the active pattern.
- Predictive terrain generation yields completely while the player is moving and resumes during idle, title, and GUI time.
- Frontier queues use constant-time removal instead of repeatedly shifting large arrays.
- Material uniform arrays upload only after an editor or console change.

## v0.0.1.0.4 continuous loading progress

- Resident texture assembly is performed chunk-by-chunk during generation instead of blocking after 70%.
- Boot progress follows the slower of completed work and the one-minute loading timeline.
- The bar advances continuously through generation, indexing, verification, GPU upload, and readiness without a long 70–74% plateau.

## v0.0.1.0.3 boot and resident-ring repair

- Boot generates the complete 24×24 resident world; the wider predictive cache begins growing incrementally as soon as play starts.
- Empty sky and deep-bedrock chunks use fast generation paths.
- Streaming uploads copy contiguous chunk rows and atomically install the complete incoming edge before the next rendered frame.
- Resident and incoming terrain are protected from eviction, preventing visible chunk deletion at the moving window edge.

## v0.0.1.0.2 living surfaces patch

- Replaced even subsurface bands with vertically displaced, interleaved soil and stone lenses.
- Mountains retain mixed soil mantles on all but true cliff faces.
- Increased vegetation shade contrast while retaining official Myara palette colors.
- Added dense, slope-aware grass-blade patches plus sand grains, gravel chips, and stone shards as deterministic micro-Resources.
- Every generated blade and grain voxel retains its originating Resource ID in sparse chunk provenance.

## v0.0.1.0.1 streaming and controls patch

- Corrected menu selection/focus styling.
- Updated shortcuts: `/` Console, F1 Help, F2 About, F11 Mods, F12 Options, M Materials, R Resources.
- Resident terrain uploads are split into frame-budgeted GPU slices with detailed loading and frame-overrun diagnostics.
- Footer now describes Space as the sole cursor-control key and Esc as Go Back / Cancel.

## v0.0.1 initial version-reset release

- Command input and results now append to a persistent 500-entry console history with a visible scrollbar.
- The loading trace retains up to 300 detailed entries with a visible scrollbar and does not pull the view away when the user scrolls upward.
- Conveyor phases define their own packet spacing: dense mathematical passes travel closely, while discrete upload and recovery operations have wider serial separation.
- The ready/idle phase contains no packets, leaving the conveyor completely clear.
- Added a close button to the loading window. It is disabled while packet work is active and becomes available only after the belt clears.
- Starting any real loading task automatically reopens the status window; completion never closes it automatically.

## v0.9.5 task-aware conveyor packets

- Conveyor contents now track the loader's current phase without restarting its seamless animation.
- Terrain generation carries Ridged fBm, Alluvial mask, Curvature proxy, Strata lens and Resource seed packets.
- Assembly carries Chunk key, X-row copy, Circular ring, Local→physical and Sparse provenance packets.
- GPU transfer carries R8UI, texImage3D, UNPACK 1, UNSIGNED_BYTE and Palette texel packets.
- Predictive streaming carries Hysteresis box, Prefetch margin, Frontier deque, Ring modulo and Clean eviction packets.
- Cache recovery carries texSubImage3D, Slab upload, ringX/ringZ, Chunk encoder and Cache commit packets.
- Ready state carries active runtime systems including Amanatides–Woo, Voxlap kernel, Water queue, Resource IDs and Solar clock.

## v0.9.4 seamless loading conveyor

- The loading conveyor now occupies the complete usable width of the persistent status panel.
- Two identical packet tracks form a mathematically seamless loop; the animation advances by exactly one track width, eliminating the previous snap-back.
- The conveyor remains visible for every loader state: boot generation, cache audit, GPU upload, predictive preloading, frontier recovery, task completion and ready-to-play status.
- Reduced-motion system preferences slow the belt without introducing visibility changes.

## v0.9.3 persistent status and Resource provenance

- The bottom-right loading/status panel is permanently present. It never automatically toggles display, visibility, or opacity.
- Completed operations settle on “Task complete” and “Ready to play” messages.
- Restored procedural moss cushions and added individual short and tall grass-blade Resources.
- Trees, stones, flowers, moss and grass are all stamped from Resource Editor definitions.
- Each Resource-generated voxel retains a stable 16-bit Resource ID in a sparse per-chunk provenance sidecar alongside its material byte.
- Normal edits and water movement clear stale provenance automatically.
- `resource sample` reports the material and originating Resource under the crosshair.

## v0.9.2 interface and Resource systems

- Replaced phosphor-green interface text with chalk white; links and interactive references use pale manuscript blue.
- Rewrote the loader as a precise terrain-pipeline trace while retaining the moving packet/conveyor visualization.
- Added working single-key RPG window shortcuts: C, M, R, P, N, H and B.
- The compact Material Editor uses collapsible sections and combines its material selector with the preview atlas.
- Added all 259 official Myara source swatches to the curated palette, with generated naturalistic shade names.
- Palette colors now live in a GPU texture, removing fragment-uniform limits and allowing the complete palette.
- Material property IDs v3 support 16-bit palette indices.
- Expanded Resources with eight primitives, thirteen growth/fractal models, deterministic growth seeds, primary/secondary materials, composition, branch angle, iterations, tropism, influence radius and kill radius.
- Natural trees, boulders, flowers and grass tufts are instantiated from editable Resource definitions.

## v0.9.1 isotropic terrain correction

- Removed the 5:1 vertical terrain LOD that caused the world-wide step-pyramid effect.
- X, Y and Z voxels are all 0.1 m again, so slope contours have equal-sized steps in every direction.
- Rebalanced valley, mountain, snow and pool elevations for the isotropic vertical range.
- Pools retain depths up to 2 m and the underground range remains 6.4 m.

## v0.9.0 natural systems + Resource forge

- Space toggles cursor/game control; Shift jumps; Ctrl crawls.
- Earthlike default gravity is 10 m/s²; the player capsule is 1.5 m tall.
- Domain-warped fBm and ridged terrain replace sine-wave landforms and dithered patches.
- Tall-world vertical LOD provides a 112 m resident height range and roughly ten times the original mountain relief while keeping the horizon-scale horizontal window.
- Wide alluvial valleys retain pools up to 2 m deep; snow, soil, rock, moisture and flora use slope/elevation/curvature-aware distribution.
- 19 additional natural materials and seven material pattern generators.
- Image-based material/palette samplers and portable v2 material IDs.
- First Resource Generator: primitives, material, fractal modifier, subsurface carving, radial mirroring, preview, save and placement.

Release folders may use additional dot-separated build increments, such as `dremplay-one-v0.0.1.0.1`.

A standalone WebGL2 microvoxel prototype. No build step or external dependencies are required.

## v0.8.2 progressive terrain pipeline loader

- Redistributed loading progress across generation, packing, assembly, inspection, GPU upload, and sealing
- The one-minute inspection phase now advances smoothly from 74% to 94% instead of appearing stuck at 98–99%
- Percentage reporting uses tenths with sub-percent bar positioning
- Added a detailed scrolling loading console with timestamps, chunk coordinates, counts, dimensions, and cache status
- Added an animated packet conveyor representing terrain stages moving through the pipeline
- Runtime predictive-cache pulses reuse the machine console to explain upcoming frontier work

## v0.8.1 verdant valleys and predictive preload

- Replaced the valley-wide mud classification with saturated shoreline patches only
- Added grassy lowland coverage, dirt breaks, gravel outcrops, moss, and small hummocks around pools
- Expanded the prestream cache from 36×36 to 44×44 chunks
- Boot preparation is guaranteed to remain active for at least sixty seconds
- Cache replenishment receives up to 5 ms per frame so it stays ahead of walking and sprinting
- A brief bottom-right predictive-cache status appears approximately every twenty seconds
- Emergency visible generation remains available only if the deeper cache is actually outrun

## v0.8.0 Dremplay identity and landscape gradients

- Renamed the project from Dremplayor One to **Dremplay One**
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
