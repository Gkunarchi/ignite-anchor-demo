from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "output_exact" / "campus_display_reading_exact.blend"
OUT = ROOT / "output_exact" / "03_reading_curation_alpha.png"

bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene = bpy.context.scene

# Render the already-modeled curation objects only. The approved architecture,
# display system, camera and lighting stay in the same Blender file; only their
# render visibility changes for this transparent pass.
for name in (
    "A_ARCHITECTURE_LOCKED",
    "A_LIGHT_FIXTURES_LOCKED",
    "B_DISPLAY_SYSTEM",
    "A_EXTERIOR_LOCKED",
):
    col = bpy.data.collections.get(name)
    if col:
        col.hide_render = True

curation = bpy.data.collections.get("C_CURATION_READING")
if not curation or not curation.objects:
    raise RuntimeError("C_CURATION_READING is missing or empty")
curation.hide_render = False

for name in ("LIGHTING_LOCKED", "CAMERA_LOCKED"):
    col = bpy.data.collections.get(name)
    if col:
        col.hide_render = False

try:
    scene.render.engine = "BLENDER_EEVEE_NEXT"
except Exception:
    scene.render.engine = "BLENDER_EEVEE"

scene.render.resolution_x = 1086
scene.render.resolution_y = 1448
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.render.filepath = str(OUT)
scene.render.use_file_extension = True
try:
    scene.view_settings.look = "AgX - Medium High Contrast"
except Exception:
    pass
scene.view_settings.exposure = -0.82
scene.view_settings.gamma = 1.0

# Keep the exact approved camera locked.
cam = bpy.data.objects.get("CAM_MASTER_3x4")
if cam is None:
    raise RuntimeError("CAM_MASTER_3x4 missing")
scene.camera = cam
expected = (-0.098, -3.90, 1.50)
if max(abs(cam.location[i] - expected[i]) for i in range(3)) > 1e-5:
    raise RuntimeError(f"Camera moved: {tuple(cam.location)}")

bpy.ops.render.render(write_still=True)
print(f"OUTPUT={OUT}")
