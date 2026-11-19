# Portafolio — Juan Liporaci (Null Pointers)

Sitio estático con Vite + TypeScript, sin librerías de animación. Live: https://juanliporaci.vercel.app

## Inicio rápido

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
```

## Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| Contenido (trabajos, servicios, experiencia) | `index.html` |
| Estilos y tokens de color | `src/style.css` (`:root`) |
| Interacciones (intro, filtros, reveals, video) | `src/main.ts` |
| Capturas de los proyectos (WebP 1200 y 640 px) | `public/work/` |
| Manos, mariposa, póster del cielo, favicon, OG | `public/img/` |
| Cielo animado (Higgsfield, loop de 7 s, sin audio) | `public/media/sky-1280.mp4`, `sky-720.mp4` |

## Añadir un trabajo

1. Captura de la web a 1440×900 → `public/work/<nombre>-1200.webp` y `-640.webp`.
2. Copia un `<article class="card">` en `index.html`, cambia link, textos y `data-cat` (`saas`, `app`, `web`, `lab`).
3. Actualiza el número del filtro "All".

## Rendimiento

- El video del cielo solo carga después del primer pintado, se reproduce mientras el hero está en pantalla y no carga con "ahorro de datos" ni con movimiento reducido (queda el póster).
- Animaciones solo con `transform`/`opacity`; acordeón con `<details name>` + `interpolate-size`; filtro con View Transitions.
