# Portafolio — Juan Liporaci

Sitio de portafolio con estética **brutalista / lo-fi digital**: paleta monocromática, texturas halftone, tipografía bold y animaciones con GSAP + Lenis.

Contenido basado en el CV de Juan Liporaci (Ingeniero en sistemas, Full-Stack & Mobile).

## Inicio rápido

```bash
cd ~/Portafolio
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador.

## Personalización

1. **Enlaces**: los elementos con `data-link-placeholder` en `index.html` (proyectos, LinkedIn, GitHub, Instagram) esperan URLs reales.
2. **Assets**: coloca imágenes en `public/` y referéncialas desde el HTML o CSS.
3. **Colores**: variables CSS en `src/style.css` (`--bg`, `--fg`).
4. **Manos halftone**: edita los paths SVG en `index.html` o sustituye por tu imagen con filtro halftone.

## Scripts

| Comando        | Descripción              |
| -------------- | ------------------------ |
| `npm run dev`  | Servidor de desarrollo   |
| `npm run build`| Build de producción      |
| `npm run preview` | Vista previa del build |

## Stack

- [Vite](https://vitejs.dev/)
- [GSAP](https://gsap.com/) + ScrollTrigger
- [Lenis](https://lenis.darkroom.engineering/) (scroll suave)
