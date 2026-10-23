"""Blender 4.x: fixed original campus corridor + modular display system.
Uses the already approved original-space geometry and camera match.
Outputs two locked-camera renders from one scene.
"""
from __future__ import annotations

import bpy
import math
import json
import os
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / "object_manifest.json"
OUT = ROOT / "output_final"
OUT.mkdir(parents=True, exist_ok=True)

# -----------------------------------------------------------------------------
# Reset / render settings
# -----------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.unit_settings.length_unit = "METERS"
scene.unit_settings.scale_length = 1.0
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 2
scene.cycles.transmission_bounces = 2
scene.render.resolution_x = 1086
scene.render.resolution_y = 1448
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.film_transparent = False
scene.render.pixel_aspect_x = 1
scene.render.pixel_aspect_y = 1
try:
    scene.view_settings.look = "AgX - Medium High Contrast"
except Exception:
    pass
scene.view_settings.exposure = -0.82
scene.view_settings.gamma = 1.0
try:
    scene.eevee.taa_render_samples = 72
    scene.eevee.use_gtao = True
    scene.eevee.gtao_distance = 3
    scene.eevee.gtao_factor = 1.25
    scene.eevee.use_soft_shadows = True
except Exception:
    pass

# -----------------------------------------------------------------------------
# Collections
# -----------------------------------------------------------------------------
def collection(name: str):
    c = bpy.data.collections.new(name)
    scene.collection.children.link(c)
    return c

ARCH = collection("A_ARCHITECTURE_LOCKED")
FIXTURES = collection("A_LIGHT_FIXTURES_LOCKED")
DISPLAY = collection("B_DISPLAY_SYSTEM")
LIGHTING = collection("LIGHTING_LOCKED")
CAMERA = collection("CAMERA_LOCKED")
EXTERIOR = collection("A_EXTERIOR_LOCKED")


def link_only(obj, col):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)

# -----------------------------------------------------------------------------
# Materials
# -----------------------------------------------------------------------------
def principled_mat(name, color, metallic=0.0, rough=0.6, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.diffuse_color = (*color, alpha)
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*color, 1.0)
    bs.inputs["Metallic"].default_value = metallic
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Alpha"].default_value = alpha
    if alpha < 1.0:
        try:
            m.surface_render_method = "DITHERED"
        except Exception:
            m.blend_method = "HASHED"
        if hasattr(m, "use_transparency_overlap"):
            m.use_transparency_overlap = False
    return m


def terrazzo_mat():
    m = bpy.data.materials.new("MAT_Floor_Terrazzo")
    m.use_nodes = True
    n = m.node_tree.nodes
    l = m.node_tree.links
    bs = n.get("Principled BSDF")
    bs.inputs["Roughness"].default_value = 0.34
    noise = n.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 105.0
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.75
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.27
    ramp.color_ramp.elements[0].color = (0.34, 0.36, 0.37, 1)
    ramp.color_ramp.elements[1].position = 0.72
    ramp.color_ramp.elements[1].color = (0.72, 0.70, 0.65, 1)
    mid = ramp.color_ramp.elements.new(0.50)
    mid.color = (0.50, 0.50, 0.48, 1)
    l.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    l.new(ramp.outputs["Color"], bs.inputs["Base Color"])
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.16
    bump.inputs["Distance"].default_value = 0.015
    l.new(noise.outputs["Fac"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], bs.inputs["Normal"])
    return m


def wood_mat():
    m = bpy.data.materials.new("MAT_Wood_Light")
    m.use_nodes = True
    n = m.node_tree.nodes
    l = m.node_tree.links
    bs = n.get("Principled BSDF")
    bs.inputs["Roughness"].default_value = 0.43
    tex = n.new("ShaderNodeTexNoise")
    tex.noise_dimensions = "3D"
    tex.inputs["Scale"].default_value = 5.2
    tex.inputs["Detail"].default_value = 3.0
    tex.inputs["Roughness"].default_value = 0.72
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.34, 0.17, 0.060, 1)
    ramp.color_ramp.elements[1].color = (0.78, 0.53, 0.27, 1)
    l.new(tex.outputs["Fac"], ramp.inputs["Fac"])
    l.new(ramp.outputs["Color"], bs.inputs["Base Color"])
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.10
    bump.inputs["Distance"].default_value = 0.01
    l.new(tex.outputs["Fac"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], bs.inputs["Normal"])
    return m

MAT = {
    "wall": principled_mat("MAT_Wall_WarmWhite", (0.955, 0.945, 0.915), rough=0.82),
    "wainscot": principled_mat("MAT_Wainscot", (0.67, 0.68, 0.68), rough=0.74),
    "base": principled_mat("MAT_Base", (0.17, 0.23, 0.27), metallic=0.12, rough=0.45),
    "floor": terrazzo_mat(),
    "ceiling": principled_mat("MAT_Ceiling", (0.82, 0.82, 0.80), rough=0.82),
    "seam": principled_mat("MAT_Seam", (0.055, 0.065, 0.07), rough=0.75),
    "frame": principled_mat("MAT_Frame", (0.035, 0.075, 0.095), metallic=0.50, rough=0.31),
    "glass": principled_mat("MAT_Glass", (0.36, 0.60, 0.70), rough=0.12, alpha=0.18),
    "door": principled_mat("MAT_Door_Wood", (0.48, 0.25, 0.105), rough=0.43),
    "door_light": principled_mat("MAT_DoorFrame_Wood", (0.62, 0.36, 0.15), rough=0.42),
    "metal": principled_mat("MAT_Metal_Gunmetal", (0.08, 0.11, 0.14), metallic=0.78, rough=0.31),
    "metal_light": principled_mat("MAT_Metal_Light", (0.48, 0.50, 0.50), metallic=0.82, rough=0.24),
    "wood": wood_mat(),
    "blue": principled_mat("MAT_BlueGrey", (0.07, 0.13, 0.18), metallic=0.08, rough=0.44),
    "felt": principled_mat("MAT_Felt", (0.77, 0.74, 0.68), rough=0.93),
    "felt_light": principled_mat("MAT_Felt_Light", (0.88, 0.86, 0.81), rough=0.92),
    "acrylic": principled_mat("MAT_Acrylic", (0.84, 0.86, 0.84), rough=0.22, alpha=0.72),
    "dark": principled_mat("MAT_Dark", (0.05, 0.055, 0.055), rough=0.58),
    "green": principled_mat("MAT_Exterior_Green", (0.08, 0.30, 0.06), rough=0.85),
    "building": principled_mat("MAT_Exterior_Building", (0.58, 0.22, 0.16), rough=0.82),
    "sky": principled_mat("MAT_Exterior_Sky", (0.44, 0.70, 0.90), rough=1.0),
}

# Emissive material
M_LIGHT = bpy.data.materials.new("MAT_Light_Emission")
M_LIGHT.use_nodes = True
bs = M_LIGHT.node_tree.nodes.get("Principled BSDF")
bs.inputs["Base Color"].default_value = (1.0, 0.70, 0.34, 1)
try:
    bs.inputs["Emission Color"].default_value = (1.0, 0.62, 0.25, 1)
    bs.inputs["Emission Strength"].default_value = 4.0
except Exception:
    bs.inputs["Emission"].default_value = (1.0, 0.62, 0.25, 1)
    bs.inputs["Emission Strength"].default_value = 4.0
MAT["light"] = M_LIGHT

# -----------------------------------------------------------------------------
# Geometry helpers
# -----------------------------------------------------------------------------
def add_box(name, center, size, material, col, bevel=0.0, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center, rotation=rotation)
    o = bpy.context.object
    o.name = name
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        o.data.materials.append(material)
    if bevel > 0:
        mod = o.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "ANGLE"
    link_only(o, col)
    return o


def add_cylinder(name, center, radius, depth, material, col, axis="z", vertices=48, bevel=0.0):
    rot = (0, 0, 0)
    if axis == "x":
        rot = (0, math.radians(90), 0)
    elif axis == "y":
        rot = (math.radians(90), 0, 0)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=center, rotation=rot)
    o = bpy.context.object
    o.name = name
    if material:
        o.data.materials.append(material)
    if bevel > 0:
        mod = o.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 2
    link_only(o, col)
    return o


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def choose_arch_mat(name):
    if "Wainscot" in name:
        return MAT["wainscot"]
    if "Base" in name:
        return MAT["base"]
    if "Floor" in name:
        return MAT["seam"] if "Joint" in name else MAT["floor"]
    if "Ceiling" in name or "Downstand" in name:
        return MAT["seam"] if "Joint" in name else MAT["ceiling"]
    if "Frame" in name or "Railing" in name:
        return MAT["frame"]
    if "Glass" in name:
        return MAT["glass"]
    if "DoorLeaf" in name:
        return MAT["door"]
    if "DoorFrame" in name:
        return MAT["door_light"]
    if "Handle" in name:
        return MAT["metal_light"]
    if name.startswith("LIGHT_"):
        return MAT["light"]
    return MAT["wall"]

# -----------------------------------------------------------------------------
# Approved original architecture — exact manifest, no re-guessing
# -----------------------------------------------------------------------------
records = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
for rec in records:
    if rec["name"].startswith("EXT_"):
        continue
    col = FIXTURES if rec["name"].startswith("LIGHT_") else ARCH
    mat = choose_arch_mat(rec["name"])
    if rec["type"] == "box":
        add_box(rec["name"], tuple(rec["center"]), tuple(rec["size"]), mat, col, bevel=0.0025)
    else:
        add_cylinder(rec["name"], tuple(rec["center"]), rec["radius"], rec["height"], mat, col, axis=rec.get("axis", "z"), vertices=36, bevel=0.002)

# Simple modeled exterior, fixed in both renders
add_box("EXT_Sky_Backdrop", (-2.45, -0.88, 1.85), (0.08, 2.8, 3.2), MAT["sky"], EXTERIOR)
add_box("EXT_Building", (-2.37, -0.72, 1.15), (0.09, 1.2, 1.35), MAT["building"], EXTERIOR, bevel=0.01)
for i, (y, z, r) in enumerate([(-0.55, 0.8, 0.42), (-0.82, 1.25, 0.48), (-1.10, 0.95, 0.38), (-0.38, 1.55, 0.35)]):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r, location=(-2.28, y, z))
    o = bpy.context.object
    o.name = f"EXT_Tree_{i+1}"
    o.scale = (0.55, 1.0, 1.2)
    o.data.materials.append(MAT["green"])
    link_only(o, EXTERIOR)

# Additional fixed foliage visible through the left glazing.
for _i, (_y, _z, _r) in enumerate(((-0.50, 0.85, 0.60), (-0.82, 1.25, 0.60), (-1.12, 0.78, 0.55)), 1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=_r, location=(-2.00, _y, _z))
    _o = bpy.context.object
    _o.name = f"EXT_CloseFoliage_{_i}"
    _o.scale = (0.42, 1.0, 1.18)
    _o.data.materials.append(MAT["green"])
    try: _o.visible_shadow = False
    except Exception: pass
    link_only(_o, EXTERIOR)

# -----------------------------------------------------------------------------
# Display system — independent collection placed on approved wall
# Wall front is around Y=0; camera is at negative Y.
# -----------------------------------------------------------------------------
SYS_W = 3.00
FRONT_Y = -0.23
CAB_D = 0.38
CAB_H = 0.57

# Base cabinet + top + plinth
add_box("DS_Cabinet_Case", (0, -0.19, CAB_H / 2), (SYS_W, CAB_D, CAB_H), MAT["wood"], DISPLAY, bevel=0.012)
add_box("DS_Cabinet_Top", (0, -0.205, CAB_H + 0.022), (SYS_W + 0.02, CAB_D + 0.03, 0.044), MAT["wood"], DISPLAY, bevel=0.009)
add_box("DS_Cabinet_Plinth", (0, -0.17, 0.045), (SYS_W, CAB_D - 0.03, 0.09), MAT["metal"], DISPLAY, bevel=0.006)
# Door faces
for i in range(8):
    w = (SYS_W - 0.07) / 8
    x = -SYS_W / 2 + 0.035 + w / 2 + i * w
    add_box(f"DS_Cabinet_Door_{i+1:02d}", (x, -0.386, 0.335), (w - 0.012, 0.022, 0.46), MAT["wood"], DISPLAY, bevel=0.004)

# Main blue backing behind modules
add_box("DS_Main_Back", (0, -0.075, 1.45), (SYS_W, 0.12, 1.72), MAT["blue"], DISPLAY, bevel=0.02)

# Header / canopy
add_box("DS_Top_Canopy", (0, -0.15, 2.835), (SYS_W, 0.28, 0.15), MAT["wood"], DISPLAY, bevel=0.018)
add_box("DS_Top_LED", (0, -0.302, 2.805), (SYS_W - 0.08, 0.025, 0.028), MAT["light"], DISPLAY, bevel=0.008)
add_box("DS_Header_Back", (0, -0.13, 2.525), (SYS_W - 0.05, 0.15, 0.48), MAT["blue"], DISPLAY, bevel=0.035)
add_box("DS_Header_WoodFrame", (0, -0.075, 2.525), (SYS_W, 0.09, 0.57), MAT["wood"], DISPLAY, bevel=0.02)
# Put blue header back slightly in front of wood frame (re-add for visible inset)
add_box("DS_Header_Inset", (0, -0.16, 2.525), (SYS_W - 0.10, 0.07, 0.43), MAT["blue"], DISPLAY, bevel=0.028)
# Long title insert and icon
add_box("DS_Header_Title_Panel", (0.18, -0.215, 2.525), (2.30, 0.045, 0.285), MAT["felt_light"], DISPLAY, bevel=0.072)
add_box("DS_Header_Title_Trim", (0.18, -0.242, 2.525), (2.34, 0.012, 0.315), MAT["metal_light"], DISPLAY, bevel=0.078)
# title panel again in front of trim
add_box("DS_Header_Title_Face", (0.18, -0.252, 2.525), (2.25, 0.015, 0.255), MAT["felt_light"], DISPLAY, bevel=0.062)
add_cylinder("DS_Header_Icon", (-1.27, -0.248, 2.525), 0.17, 0.04, MAT["blue"], DISPLAY, axis="y", bevel=0.008)
# corner bolts on title panel
for x in (-0.92, 1.28):
    for z in (2.405, 2.645):
        add_cylinder(f"DS_Header_Bolt_{x}_{z}", (x, -0.269, z), 0.018, 0.014, MAT["metal_light"], DISPLAY, axis="y", vertices=32, bevel=0.003)

# Four modules
module_gap = 0.035
side_margin = 0.035
module_w = (SYS_W - side_margin * 2 - module_gap * 3) / 4
module_bottom = 0.64
module_top = 2.27
module_h = module_top - module_bottom
centers = []
for i in range(4):
    x = -SYS_W / 2 + side_margin + module_w / 2 + i * (module_w + module_gap)
    centers.append(x)
    # blue backing and front board
    add_box(f"DS_M{i+1}_Back", (x, -0.15, module_bottom + module_h / 2), (module_w, 0.11, module_h), MAT["blue"], DISPLAY, bevel=0.035)
    face_mat = MAT["wood"] if i == 1 else MAT["felt_light"]
    add_box(f"DS_M{i+1}_Face", (x, -0.225, module_bottom + module_h / 2 + 0.01), (module_w - 0.07, 0.055, module_h - 0.10), face_mat, DISPLAY, bevel=0.052)
    # top-left blue patch
    add_box(f"DS_M{i+1}_Patch", (x - module_w * 0.25, -0.260, module_top - 0.18), (module_w * 0.43, 0.025, 0.31), MAT["blue"], DISPLAY, bevel=0.07)
    # vertical gunmetal edge at left of each module
    add_box(f"DS_M{i+1}_Rail_L", (x - module_w / 2 - 0.015, -0.145, module_bottom + module_h / 2), (0.035, 0.10, module_h + 0.06), MAT["metal"], DISPLAY, bevel=0.006)
    if i == 3:
        add_box("DS_M4_Rail_R", (x + module_w / 2 + 0.015, -0.145, module_bottom + module_h / 2), (0.035, 0.10, module_h + 0.06), MAT["metal"], DISPLAY, bevel=0.006)

# Card helper
def card(name, x, z, w, h, material=MAT["felt"]):
    add_box(name, (x, -0.300, z), (w, 0.025, h), material, DISPLAY, bevel=0.026)
    for sx in (-1, 1):
        for sz in (-1, 1):
            add_cylinder(f"{name}_Bolt_{sx}_{sz}", (x + sx*(w/2-0.035), -0.317, z + sz*(h/2-0.035)), 0.012, 0.010, MAT["metal_light"], DISPLAY, axis="y", vertices=24, bevel=0.002)

# Module 1
x = centers[0]
card("DS_M1_LargeCard", x, 1.57, module_w - 0.18, 0.57)
card("DS_M1_SmallA", x - 0.17, 0.91, 0.29, 0.37)
card("DS_M1_SmallB", x + 0.17, 0.91, 0.29, 0.37)
# Module 2 pegboard dark holes + cards + shelf
x = centers[1]
for row in range(10):
    for col in range(7):
        hx = x - module_w*0.34 + col*(module_w*0.68/6)
        hz = 0.76 + row*(1.20/9)
        add_cylinder(f"DS_M2_Hole_{row}_{col}", (hx, -0.312, hz), 0.009, 0.009, MAT["dark"], DISPLAY, axis="y", vertices=20)
card("DS_M2_CardTop", x + 0.16, 1.63, 0.28, 0.34)
card("DS_M2_CardBottomA", x - 0.17, 0.91, 0.28, 0.37)
card("DS_M2_CardBottomB", x + 0.17, 0.91, 0.28, 0.37)
add_box("DS_M2_MidShelf", (x + 0.08, -0.39, 1.28), (0.46, 0.19, 0.04), MAT["wood"], DISPLAY, bevel=0.01)
for sx in (-0.15, 0.15):
    add_box(f"DS_M2_MidShelfBracket_{sx}", (x + 0.08 + sx, -0.33, 1.20), (0.04, 0.13, 0.14), MAT["metal"], DISPLAY, bevel=0.006)
# Modules 3 and 4
for idx in (2, 3):
    x = centers[idx]
    card(f"DS_M{idx+1}_LargeCard", x, 1.57, module_w - 0.18, 0.57)
    card(f"DS_M{idx+1}_SmallA", x - 0.17, 0.91, 0.29, 0.37)
    card(f"DS_M{idx+1}_SmallB", x + 0.17, 0.91, 0.29, 0.37)

# Bottom shelves for all modules
for i, x in enumerate(centers, 1):
    add_box(f"DS_M{i}_BottomShelf", (x, -0.39, 0.69), (module_w - 0.15, 0.20, 0.04), MAT["wood"], DISPLAY, bevel=0.01)
    for sx in (-0.22, 0.22):
        add_box(f"DS_M{i}_BottomBracket_{sx}", (x + sx, -0.33, 0.62), (0.045, 0.14, 0.13), MAT["metal"], DISPLAY, bevel=0.006)

# Visible downlight discs under canopy + actual lights
for i, x in enumerate(centers, 1):
    add_cylinder(f"DS_Downlight_Disc_{i}", (x, -0.304, 2.29), 0.037, 0.020, MAT["light"], DISPLAY, axis="z", vertices=32)
    bpy.ops.object.light_add(type="AREA", location=(x, -0.52, 2.36))
    L = bpy.context.object
    L.name = f"LIGHT_Display_{i}"
    L.data.energy = 32
    L.data.shape = "DISK"
    L.data.size = 0.28
    L.data.color = (1.0, 0.73, 0.42)
    look_at(L, (x, -0.17, 1.45))
    link_only(L, LIGHTING)

# Side bench along the window, identical to reference composition
add_box("DS_Bench_Seat", (-1.48, -1.25, 0.43), (0.32, 1.22, 0.085), MAT["wood"], DISPLAY, bevel=0.018)
for y in (-1.72, -0.80):
    add_box(f"DS_Bench_Leg_{y}", (-1.48, y, 0.22), (0.18, 0.07, 0.42), MAT["metal"], DISPLAY, bevel=0.006)

# Floor guide: line, dots, and turn toward camera
add_box("DS_FloorGuide_H", (0.43, -0.68, 0.010), (1.35, 0.055, 0.014), MAT["blue"], DISPLAY, bevel=0.025)
for i, x in enumerate((1.18, 1.38, 1.58), 1):
    add_cylinder(f"DS_FloorGuide_Dot_{i}", (x, -0.68, 0.012), 0.055, 0.016, MAT["blue"], DISPLAY, axis="z", vertices=36)
add_box("DS_FloorGuide_Turn", (1.69, -1.00, 0.010), (0.06, 0.66, 0.014), MAT["blue"], DISPLAY, bevel=0.025)

# -----------------------------------------------------------------------------
# Locked lighting shared by both frames
# -----------------------------------------------------------------------------
world = scene.world or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value = (0.67, 0.76, 0.84, 1)
bg.inputs["Strength"].default_value = 0.30

bpy.ops.object.light_add(type="SUN", location=(-4, -3, 6))
sun = bpy.context.object
sun.name = "SUN_LeftWindow"
sun.data.energy = 1.5
sun.data.angle = math.radians(7.0)
sun.rotation_euler = (math.radians(46), math.radians(-18), math.radians(-42))
link_only(sun, LIGHTING)

# cool window source
bpy.ops.object.light_add(type="AREA", location=(-2.15, -1.15, 2.15))
win = bpy.context.object
win.name = "AREA_WindowFill"
win.data.energy = 230
win.data.shape = "RECTANGLE"
win.data.size = 3.2
win.data.size_y = 2.6
win.data.color = (0.72, 0.87, 1.0)
look_at(win, (0.2, -1.0, 1.15))
link_only(win, LIGHTING)

# soft warm camera-side fill
bpy.ops.object.light_add(type="AREA", location=(0.0, -3.1, 2.4))
fill = bpy.context.object
fill.name = "AREA_CameraFill"
fill.data.energy = 75
fill.data.shape = "RECTANGLE"
fill.data.size = 3.6
fill.data.size_y = 2.4
fill.data.color = (1.0, 0.87, 0.72)
look_at(fill, (0.0, -0.05, 1.45))
link_only(fill, LIGHTING)

# three warm wall spots matching the original approved image
for i, x in enumerate((-1.06, 0.04, 1.15), 1):
    bpy.ops.object.light_add(type="AREA", location=(x, -0.34, 2.91))
    L = bpy.context.object
    L.name = f"POINT_Spot_{i}"
    L.data.energy = 22
    L.data.shape = "DISK"
    L.data.size = 0.21
    L.data.color = (1.0, 0.75, 0.46)
    look_at(L, (x, -0.02, 2.05))
    link_only(L, LIGHTING)

# -----------------------------------------------------------------------------
# Approved camera: exact match; lock all transforms
# -----------------------------------------------------------------------------
bpy.ops.object.camera_add(location=(-0.098, -3.90, 1.50))
cam = bpy.context.object
cam.name = "CAM_MASTER_3x4"
target = Vector((-0.098, 0.0, 1.50))
cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.lens = 35.0
cam.data.sensor_width = 36.0
cam.data.sensor_fit = "HORIZONTAL"
cam.data.shift_x = -0.0244
cam.data.shift_y = -0.1133
cam.data.clip_start = 0.05
cam.data.clip_end = 100
scene.camera = cam
link_only(cam, CAMERA)
cam.lock_location = (True, True, True)
cam.lock_rotation = (True, True, True)
cam.lock_scale = (True, True, True)

# Lock original architecture transforms so the display system is the only editable layer
for col in (ARCH, FIXTURES, EXTERIOR, CAMERA):
    for o in col.objects:
        o.lock_location = (True, True, True)
        o.lock_rotation = (True, True, True)
        o.lock_scale = (True, True, True)

# -----------------------------------------------------------------------------
# Render two frames from one scene
# -----------------------------------------------------------------------------
def set_display(enabled: bool):
    DISPLAY.hide_render = not enabled
    DISPLAY.hide_viewport = not enabled
    # display-specific lights still live in LIGHTING; toggle by name
    for o in LIGHTING.objects:
        if o.name.startswith("LIGHT_Display_"):
            o.hide_render = not enabled
            o.hide_viewport = not enabled

blend_path = OUT / "campus_display_corrected_master.blend"

set_display(False)
scene.render.filepath = str(OUT / "01_original_space.png")
bpy.ops.render.render(write_still=True)

set_display(True)
scene.render.filepath = str(OUT / "02_empty_display_system.png")
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
print("DONE", OUT)
