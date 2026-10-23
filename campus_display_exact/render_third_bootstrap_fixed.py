from pathlib import Path
import ast
import base64
import zlib

ROOT = Path(__file__).resolve().parent
bootstrap_source = (ROOT / "render_third_bootstrap.py").read_text(encoding="utf-8")
tree = ast.parse(bootstrap_source)
payload = None
for node in tree.body:
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id == "PAYLOAD":
                payload = ast.literal_eval(node.value)
                break
    if payload is not None:
        break
if not isinstance(payload, str):
    raise RuntimeError("PAYLOAD not found in render_third_bootstrap.py")

runtime_source = zlib.decompress(base64.b64decode(payload)).decode("utf-8")
runtime_source = runtime_source.replace(
    'Blender自动建模渲染脚本.py',
    'approved_base_scene.py',
)
if 'approved_base_scene.py' not in runtime_source:
    raise RuntimeError("Base-script path substitution failed")

# Ubuntu's packaged Blender 4.0 is built without OpenImageDenoiser.
# Disable only the unavailable post-render denoiser; geometry, materials,
# camera, lights and sampling remain exactly the approved master values.
needle = "scene = bpy.context.scene\nlink_only = ns[\"link_only\"]"
replacement = "scene = bpy.context.scene\nscene.cycles.use_denoising = False\nlink_only = ns[\"link_only\"]"
if needle not in runtime_source:
    raise RuntimeError("Denoising patch insertion point not found")
runtime_source = runtime_source.replace(needle, replacement, 1)

runtime = ROOT / "_render_third_exact_runtime_fixed.py"
runtime.write_text(runtime_source, encoding="utf-8")
namespace = {"__name__": "__main__", "__file__": str(runtime)}
exec(compile(runtime_source, str(runtime), "exec"), namespace)
