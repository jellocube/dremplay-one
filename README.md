# Dremplay One

**Infinite Detail Engine**

Current release: **v0.0.1.2**

## v0.0.1.2 hierarchical voxel conversion

- Replaced per-ray perfect-resolution terrain mathematics with a persistent 2048² GPU voxel atlas covering 4.096 km at 2 m source spacing. World equations run once during the explicit bake; walking samples the resident cache and cannot regenerate terrain or material noise.
- Built seven mipmapped hierarchy levels and select them from projected size and range. This adapts the useful concepts in Euclideon's octree patent—hierarchical portions, screen-size stopping and front-to-back visibility—to a WebGL-safe voxel cache.
- Added a true sparse 3D octree for editable CSG voxel balls and established separate tagged formats for mathematical sources, terrain rendering, Resource voxels, edits, water state and ecology seeds.
- Adopted John Lin's allocation/tagging/conversion principle: each system uses the volume format suited to its work instead of forcing rendering, physics, ecology, networking and editing through one brittle structure.
- Resource equations now quantize into 10 cm, 20 cm, 50 cm and 2 m voxel representations according to the established distance bands. Definitions and Resource IDs remain resolution-independent.
- Restored crosshair editing: left mouse carves a voxel ball and right mouse adds one. Edits are indexed by the sparse octree, retain CSG operation data, render immediately, and support `undo` and `edits clear` console commands.
- Expanded procedural ecology with adult trees, shrubs, recursive seven-frond ferns, grass blades, rounded stones and strict five/seven-sided crystals. Resource growth remains deterministic by seed.
- Water now advects its pixel-scale waves along the cached terrain gradient while retaining Fresnel reflection and depression-only placement.
- Added a volume-format registry and `formats` console command exposing allocation, attributes and conversion routes for future mods and editing GUIs.
- References: [Euclideon patent US9842425B2](https://patents.google.com/patent/US9842425B2/en) and [John Lin, “The Perfect Voxel Engine”](https://voxely.net/blog/the-perfect-voxel-engine/).

## v0.0.1.1 continuous voxel world rewrite

- Replaced the former CPU chunk engine, occupancy texture marcher, chunk cache, streaming frontier, and walking-time procedural rebuild system with a clean GPU-first infinite-detail voxel renderer.
- Fixed the initial rewrite's renderer compilation failure: the pentagonal/septagonal crystal field now passes its side count to the polygon function, and a reserved GLSL identifier has been removed. Both complete shaders pass independent Khronos glslang compilation.
- The landscape and every visible Resource are deterministic mathematical fields evaluated directly at the requested position. Walking changes only the camera; it cannot enqueue terrain generation or material-noise work.
- Implemented screen-error-driven detail sampling over continuous geometry. The presentation retains the established 0–20 ft, 20–50 ft, 50–250 ft, and 250 ft+ bands, but close detail can refine below the nominal 5 cm pitch because the underlying definition has no cell-size limit.
- Replaced occupancy-derived normals with central gradients of the same continuous field used for intersections. Wrapped sunlight, hemispheric fill, a strict nonblack illumination floor, palette-bound materials, and smooth atmospheric blending eliminate isolated black voxel facets.
- Added continuous mathematical terrain with domain warping, ridged mountain massifs, broad valleys, erosion channels, snow, soil, rock, grass, water, and a fixed 1 km tracing horizon.
- Added analytic trees, branching crowns, rounded stones, individual grass blades, and strictly five- or seven-sided crystal fields without allocating voxel models or meshes.
- Added a stable GPU water surface with continuous wave gradients and Fresnel sky reflection.
- Rebuilt the application shell, title flow, loading monitor, movement, pointer handling, console, Options, Resource inspector, Materials palette, Server menu, Help, and About windows around the new renderer.
- Separated raster scale from mathematical detail and world distance. Graphics presets change only the stable render target and field-step budget; they never shorten the 1 km horizon or change Resource geometry. There is no chunk deletion, loading strip, or procedural regeneration path in this engine.

## Run

Open `index.html` in a WebGL2-capable browser. No build step or server is required.

## Controls

- WASD: move
- Shift: jump
- Ctrl: crawl
- Space: switch cursor/look control
- `/`: console
- F1/F2/F10/F11/F12: Help/About/Server/Mods/Options
