# Logo WZS 3D: prompts para o Meshy AI

Antes de usar o Meshy: a página `logo-3d.html` já gera a logo 3D exata no navegador
(linhas de contorno numa esfera, fluindo em tempo real) e o botão **baixar .glb** exporta
a esfera em relevo na pose atual (~6 MB, boa entrada para Blender ou impressão 3D).
Para o site, esse caminho é melhor: geometria fiel ao SVG, leve, animada em tempo real.
Use o Meshy para variações artísticas (renders, posts, versões esculpidas).

Imagem de entrada: `assets/logo.png` (ou exporte o SVG em PNG 2048px, fundo #0F1A2B).

## 1. Image to 3D (fiel à logo)
**Prompt:**
Minimal abstract sphere logo made of 10 thin glossy tubular arcs, crescent moon-phase rings
nested inside a circle, arcs converge at top and bottom, clean smooth geometry, uniform tube
thickness, ice white glossy ceramic material, no base, no text, centered, symmetrical, hard surface.

**Negative prompt:** noise, sculpted texture, broken arcs, extra objects, pedestal, text, letters, fur, organic bumps

Configurações: Symmetry **on** · Topology **quad** · Target polycount **30k** · Texture **PBR**

## 2. Text to 3D: "Camadas" (versão multi-camadas)
10 floating concentric crescent arcs stacked in depth like layered slices, each arc a thin
glossy white tube with a soft blue (#3B82F6) gradient toward the back layers, gaps between layers,
together forming a sphere silhouette when seen from the front, premium tech brand object,
studio lighting, dark navy background.

## 3. Text to 3D: "Esfera" (globo de arcos, estilo houmahani)
Wireframe-like globe made of smooth meridian ribbons, ice white front ribbons and translucent
blue back ribbons, ribbons gently twisted in a wave, elegant minimal tech sculpture, glossy
clearcoat, no base.

## Depois de gerar
1. No Meshy: Download → **GLB**.
2. Coloque em `assets/3d/` e me avise: eu troco a geometria procedural pelo GLB
   (ou uso os dois: GLB no hero, procedural na página da logo).
3. Mantenha o arquivo abaixo de ~3 MB (Meshy → Remesh → 20–30k polígonos).
