# Dremplay One

**Infinite Detail Engine**

Current release: **v0.0.1.3**

## v0.0.1.3 adaptive octree voxel prototype

This release deliberately removes the broader game/editor systems and proves the renderer first.

- Replaced ray marching and perfect-resolution per-pixel equations with ordinary instanced voxel cubes and a hardware depth buffer.
- Mathematical Resource definitions are input data. A tagged conversion stage traverses each definition as an octree and emits a compact interleaved GPU voxel format: position, size and palette color.
- Octree subdivision uses a bounded screen-space error and distance tiers. Walking closer requests a deeper conversion, revealing smaller voxels without a fixed model mesh or texture resolution.
- All expensive traversal and fractal evaluation runs in a Blob Web Worker. The main thread continues movement and rendering, then atomically uploads the completed voxel buffer.
- Terrain uses a distance-adaptive quadtree. Resource definitions use 3D octrees with screen-space error, empty-space rejection, interior-node rejection and strict per-resource work budgets.
- Included mathematical exemplars: deciduous and conifer trees with recursive branches, fractal foliage, a weathered ellipsoid stone, recursive fern, blueberry-like shrub, and strict five- and seven-sided crystals.
- Lighting is conventional cube-face lighting with wrapped sunlight, hemispheric fill and atmospheric fog. It cannot produce occupancy-normal black squares.
- This follows the useful division described by John Lin: mathematical definitions are one format; the visible GPU voxel buffer is another. Conversion connects them rather than forcing every engine system to share one data structure.
- Architectural references: [Euclideon patent US9842425B2](https://patents.google.com/patent/US9842425B2/en) and [John Lin, “The Perfect Voxel Engine”](https://voxely.net/blog/the-perfect-voxel-engine/).

## Controls

- WASD: walk
- Shift: jump
- Ctrl: crawl
- Space: switch cursor/look control
- Escape: return to title
