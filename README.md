# Dremplay One

**Fine Voxel Engine**

Current release: **v0.0.1.0.21.0**

## v0.0.1.0.21.0 continuous world rewrite

- Replaced the former CPU chunk engine, occupancy texture marcher, chunk cache, streaming frontier, and walking-time procedural rebuild system with a clean GPU-first continuous-field renderer.
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
