# Little Chicken Quest: 3D assets guide

18 low-poly `.glb` models, all generated in code (no textures, no downloads, original designs).
Total: 61,374 triangles, about 3.6 MB. Verified: every file passes the official Khronos glTF validator with zero errors
and loads in three.js `GLTFLoader`.

## Conventions
- **Y is up, +Z is the front** of every model, **units are metres**.
- Colours are flat PBR materials with stable names (for example `chicken_cream`). No textures, no UVs.
- Models with moving parts are split into **named nodes** whose origin is the joint, so you can rotate them in code.
- Folder layout: `assets/models/*.glb`, `assets/previews/*.png`, `generator/` (Python that rebuilt every file), `manifest.json`.

## Models
| File | What it is | Size (W x H x D, m) | Triangles | Notes and nodes |
|---|---|---|---|---|
| `banana_plant.glb` | Banana plant | 4.61 x 1.57 x 3.51 | 880 | Scatter near huts. |
| `chicken.glb` | Hero: tiny round chicken with teal shoulder bag | 0.49 x 0.61 x 0.66 | 6,498 | Animate nodes: wing_L, wing_R (flap: rotation.z), leg_L, leg_R (walk: rotation.x), head (bob: rotation.x), tail, body. Faces +Z. |
| `cloud.glb` | Soft cloud | 6.7 x 2.41 x 3.38 | 3,520 | Scale 2 to 6 and scatter for the sky ride. |
| `eagle_flying.glb` | Living eagle for the rescue swoop (about 8 m wingspan) | 8.1 x 2.85 x 6.1 | 7,586 | Flap wing_L / wing_R with rotation.z (pivots are at the shoulders). tail and talons are separate nodes. |
| `eagle_statue.glb` | The giant stone eagle statue on its hilltop (the big reveal) | 43.96 x 14.15 x 44.92 | 15,726 | Nodes: base, body, head, wing_L, wing_R, claw. Origin on the ground. Face +Z. Chicken is about 70 times smaller: scale the statue down ~0.4 or the chicken up for framing. |
| `feather_gold.glb` | Collectible glowing golden feather | 0.33 x 0.6 x 0.33 | 480 | Node glow = soft halo (hide it with glow.visible=false). Spin it with rotation.y and bob it up and down. |
| `ground_red_earth.glb` | Red-earth ground tile 8 x 8 m | 8.0 x 0.87 x 8.0 | 1,804 | Top surface at y=0. Tile it in a grid for the village path. |
| `hibiscus.glb` | Hibiscus bush with red flowers | 0.67 x 0.77 x 0.69 | 1,862 | Scatter along path edges. Scale 1.5 for a bolder bush. |
| `hut_village.glb` | Kerala-style village house with tiled roof and veranda | 7.7 x 5.14 x 7.83 | 1,896 | Front (veranda, door) faces +Z. One lit brass lamp. Origin = centre of footprint on the ground. |
| `lotus_chariot.glb` | Golden lotus flying chariot, no wheels | 3.26 x 6.1 x 5.76 | 5,718 | Origin = centre of the seat cushion (place the chicken at 0,0,0). Nodes: base, seat, posts, canopy, cloth, lanterns. For the storm break-up, push each node apart. Suggested game scale 0.5. |
| `paddy_field.glb` | Green paddy tile 8 x 8 m with rice rows | 8.27 x 0.47 x 8.21 | 4,028 | Top near y=-0.05. Tile to the side of the path. |
| `palm_tree.glb` | Coconut palm | 6.84 x 6.56 x 6.89 | 7,056 | Nodes: trunk, crown. Sway the crown with a tiny rotation.z for wind. |
| `puddle.glb` | Shiny puddle | 1.33 x 0.01 x 0.91 | 280 | Obstacle for the village run. Sits on the ground at y=0. |
| `rock_a.glb` | Small mossy rock | 1.93 x 1.08 x 2.15 | 320 | Scatter as obstacles or decoration. Reuse with random scale and rotation. |
| `rock_b.glb` | Large mossy rock | 3.27 x 2.04 x 3.62 | 320 | Scale 3 to 8 to build the broken cliff edge. |
| `stone_steps.glb` | Mossy stone steps climbing toward -Z | 2.8 x 2.58 x 7.53 | 180 | Nine steps, 0.28 m rise each. Origin at the bottom front step. |
| `temple.glb` | Small temple with tiered tower and glowing doorway | 15.0 x 12.55 x 17.2 | 2,404 | Front faces +Z. Use it far in the background (scale 1 to 3). |
| `vine.glb` | Hanging forest vine | 0.43 x 3.21 x 0.27 | 816 | Hangs down from its origin. Reuse many times. |

Full list of nodes (with pivots) and every material (with hex colour) is in `manifest.json`.

## Load in three.js
```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const load = async (name) => (await loader.loadAsync(`/assets/models/${name}.glb`)).scene;

const chicken = await load('chicken');
chicken.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
scene.add(chicken);

// animate by node name (call every frame, t = seconds)
const wingL = chicken.getObjectByName('wing_L'), wingR = chicken.getObjectByName('wing_R');
const legL = chicken.getObjectByName('leg_L'), legR = chicken.getObjectByName('leg_R');
function waddle(t, speed) {
  legL.rotation.x =  Math.sin(t * 10) * 0.6 * speed;
  legR.rotation.x = -Math.sin(t * 10) * 0.6 * speed;
  chicken.rotation.z = Math.sin(t * 10) * 0.06 * speed;
}
function flap(t) { wingL.rotation.z = -0.3 - Math.abs(Math.sin(t * 18)) * 0.9; wingR.rotation.z = 0.3 + Math.abs(Math.sin(t * 18)) * 0.9; }
```

**Recolour by material name** (palette is also in `generator/palette.py`):
```js
model.traverse(o => { if (o.isMesh && o.material.name === 'chicken_cream') o.material.color.set('#F6E3B0'); });
```
Materials are shared inside one loaded model. Use `material.clone()` if you want two variants.

**Lighting that suits these models:** one warm directional light low in the sky (golden dawn, colour `#FFC98A`, intensity 2.5), a soft hemisphere light (sky `#F3C7D8`, ground `#6E8A3A`, intensity 0.9), shadows on, fog colour `#C9B8C8` so far objects fade into mist. Tone mapping ACESFilmic. Glowing parts (feather, lanterns, temple door) already carry an emissive colour.

## Performance
- Whole pack is about 61k triangles, so a scene using 10 palms, 8 rocks, 2 huts, 1 temple and the chicken stays well under 150k triangles.
- Reuse with `model.clone()`. For rocks, vines and grass use `THREE.InstancedMesh` on the mesh inside the model.
- `eagle_statue.glb` is the heaviest (15,726 triangles). Only load it for the summit scene.

## Using your painted images as a backdrop
The 7 painted images are flat, so they work as a **sky and distant-hills backdrop**, with the 3D models in front.
```js
const tex = new THREE.TextureLoader().load('/backdrops/05_statue.png'); // the painting
tex.colorSpace = THREE.SRGBColorSpace;
const bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, fog: false, depthWrite: false }));
bg.renderOrder = -1000; scene.add(bg);
const fwd = new THREE.Vector3();
function updateBackdrop() {            // call every frame, after moving the camera
  const dist = camera.far * 0.9;
  camera.getWorldDirection(fwd);
  bg.position.copy(camera.position).addScaledVector(fwd, dist);
  bg.quaternion.copy(camera.quaternion);
  const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist * 1.1;
  bg.scale.set(h * camera.aspect, h, 1);
}
```
Limits: it cannot be walked into, and it does not change when the player turns. Keep the camera mostly facing the painting
(limit yaw to about 35 degrees) or shift `tex.offset.x` slightly with yaw for a parallax feel. Make the foreground ground colour match the painting.

## Scene recipes (what to place in each of the 7 screens)
1. **Dawn village:** 3 x 2 `ground_red_earth` tiles as the path, 2 `hut_village` on the left, 6 `palm_tree`, `hibiscus` and `banana_plant` along the edges, `paddy_field` tiles on the right, `temple` far away (scale 2) in mist, 2 `puddle`, chicken at the start.
2. **Stone path:** `stone_steps` x 2 end to end climbing away, `rock_a` and `hibiscus` on the sides, 3 `feather_gold` floating 0.6 m above the steps, a few palms below the hill.
3. **Broken cliff:** two big `rock_b` (scale 6) with a 6 m gap, `lotus_chariot` (scale 0.5) drifting in toward the gap, chicken at the edge.
4. **Chariot ride:** `lotus_chariot` with the chicken at its origin, 10 to 15 `cloud` (scale 3 to 6) moving past, nothing else.
5. **Summit reveal:** `eagle_statue` (scale 0.4), `lotus_chariot` parked on the left, chicken in front, `rock_b` scattered around.
6. **Ending:** chicken in front of the statue's claw, `feather_gold` x 3 laid at its feet, then the golden sky burst and the text "For my little one."
7. **Close-up:** camera very close to the chicken's face, same scene.
**Storm and rescue (between 4 and 5):** darken the lights, then `eagle_flying` swoops in from the side (scale 1), flapping, and carries the chicken to the summit.

## Regenerate or tweak
```
cd generator
python3 -m pip install trimesh numpy pillow
python3 build_all.py            # rebuilds every model
python3 build_all.py chicken    # rebuilds one model
python3 make_manifest.py
```
Change a hex in `generator/palette.py` and rebuild to recolour a whole family of models.
Previews in `assets/previews/` come from a simple software renderer: the real look in three.js (with lights and shadows) will be richer.

## Respect
The eagle statue is an original tribute design. Keep the tone respectful, and keep it free of jokes, ads and game-over screens.
