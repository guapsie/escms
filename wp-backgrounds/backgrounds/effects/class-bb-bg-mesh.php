<?php
/**
 * Brutal Blocks: Background Family — Mesh
 *
 * Multi-radial mesh gradient effects. Always renders behind the block content
 * via a pseudo-element. The "mesh" is built from overlapping radial gradients
 * with blur applied to the composite — producing the organic blob-fusion look
 * associated with Apple's marketing materials and modern SaaS landing pages.
 *
 * Covers: meshDrift.
 *
 * meshDrift — three overlapping radial blobs that drift independently.
 *             CSS-only. No JS, no canvas, no SVG filters.
 *             The animated variant uses @keyframes on each blob's
 *             transform. The static variant freezes the blobs at their
 *             initial positions.
 *
 * Architecture note: unlike auraGlow and radialFocus (single ::before),
 * meshDrift uses ::before AND ::after plus a generated child element
 * (.bb-mesh-c) for the three blobs. PHP emits that child element via
 *  get_html_attrs() / get_mesh_inner_html(). render.php must call
 * BB_Backgrounds::get_mesh_inner_html( $block_attrs ) and inject the
 * returned markup as the first child of the block wrapper when the effect
 * is meshDrift.
 *
 * The child element approach avoids any z-index stacking issue with
 * ::before/::after on blocks that already use pseudo-elements for borders
 * or decorations (Brutal Header, Pricing Table highlight).
 *
 * @package BrutalBlocks
 * @since   2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Brutal_Blocks_Bg_Mesh {

    /**
     * Return the CSS for the given effect name, or empty string if unknown.
     *
     * @param string $name
     * @return string
     */
    public static function get_css( $name ) {
        switch ( $name ) {
            case 'meshDrift':
                return self::mesh_drift();
            default:
                return '';
        }
    }

    // -------------------------------------------------------------------------
    // meshDrift
    // -------------------------------------------------------------------------

    /**
     * Mesh Drift — three overlapping blobs that drift and fuse.
     *
     * The three blobs are siblings inside .bb-mesh-wrap (injected by PHP into
     * the block's DOM). They are absolutely positioned, overflow the wrap
     * container (which itself overflows hidden), and have a blur applied at
     * the wrap level so all three blur into each other — the classic
     * meshGradient technique.
     *
     * Consumes (all set inline by render.php via get_wrapper_args()):
     *   --bb-bg-color      → blob A colour (primary accent)
     *   --bb-bg-color-b    → blob B colour (secondary; defaults to a hue-rotated accent)
     *   --bb-bg-color-c    → blob C colour (tertiary; defaults to a further hue-rotated accent)
     *   --bb-bg-blur       → blur amount in px (default 48)
     *   --bb-bg-opacity    → wrap opacity 0–1 (default 0.8)
     *   --bb-bg-speed      → animation duration in s (default 14)
     *
     * Colours B and C fall back to hue-rotated variants of --bb-bg-color
     * using color-mix when not supplied. This makes the effect look great
     * out of the box with a single accent colour, while still letting the
     * admin set all three independently.
     *
     * @return string
     */
    private static function mesh_drift() {
        return /* Wrapper — clips the blobs to the block boundary. */
            '.bb-mesh-wrap{'
            . 'position:absolute;'
            . 'inset:0;'
            . 'z-index:-1;'
            . 'overflow:hidden;'
            . 'border-radius:inherit;'
            . 'pointer-events:none;'
            . 'opacity:var(--bb-bg-opacity,0.8);'
            . '}'
            /* Blobs — sized relative to the wrapper so they overflow it,
               giving the blur room to feather on all sides.              */
            . '.bb-mesh-wrap .bb-mesh-a,'
            . '.bb-mesh-wrap .bb-mesh-b,'
            . '.bb-mesh-wrap .bb-mesh-c{'
            . 'position:absolute;'
            . 'border-radius:50%;'
            . 'will-change:transform;'
            . 'filter:blur(var(--bb-bg-blur,48px));'
            . '}'
            . '.bb-mesh-wrap .bb-mesh-a{'
            . 'width:65%;height:65%;'
            . 'top:5%;left:5%;'
            . 'background:radial-gradient(circle,var(--bb-bg-color) 0%,transparent 70%);'
            . '}'
            . '.bb-mesh-wrap .bb-mesh-b{'
            . 'width:70%;height:70%;'
            . 'top:20%;left:28%;'
            /* Blob B: if --bb-bg-color-b is not set, use a 40° hue-rotated
               mix of the primary colour with a warm neutral so the result
               is always coherent. color-mix with hue rotation only works
               in oklch/oklab. We use oklch here for the fallback. */
            . 'background:radial-gradient(circle,'
            . 'var(--bb-bg-color-b,color-mix(in oklch,var(--bb-bg-color) 70%,oklch(0.7 0.15 calc(from var(--bb-bg-color) h + 40)))) 0%,'
            . 'transparent 70%);'
            . '}'
            . '.bb-mesh-wrap .bb-mesh-c{'
            . 'width:58%;height:58%;'
            . 'top:38%;left:12%;'
            . 'background:radial-gradient(circle,'
            . 'var(--bb-bg-color-c,color-mix(in oklch,var(--bb-bg-color) 60%,oklch(0.65 0.18 calc(from var(--bb-bg-color) h + 80)))) 0%,'
            . 'transparent 70%);'
            . '}'
            /* Static: block requires position:relative + isolation. */
            . '.bb-bg[data-bb-background="meshDrift"]{'
            . 'position:relative;'
            . 'isolation:isolate;'
            . '}'
            /* Animated variant. */
            . '@keyframes bb-mesh-a{'
            . '0%{transform:translate(0,0) scale(1);}'
            . '33%{transform:translate(14%,-9%) scale(1.08);}'
            . '66%{transform:translate(-7%,11%) scale(0.94);}'
            . '100%{transform:translate(0,0) scale(1);}'
            . '}'
            . '@keyframes bb-mesh-b{'
            . '0%{transform:translate(0,0) scale(1);}'
            . '33%{transform:translate(-11%,7%) scale(0.92);}'
            . '66%{transform:translate(9%,-13%) scale(1.12);}'
            . '100%{transform:translate(0,0) scale(1);}'
            . '}'
            . '@keyframes bb-mesh-c{'
            . '0%{transform:translate(0,0) scale(1);}'
            . '33%{transform:translate(7%,10%) scale(1.04);}'
            . '66%{transform:translate(-13%,-6%) scale(0.91);}'
            . '100%{transform:translate(0,0) scale(1);}'
            . '}'
            . '.bb-bg[data-bb-background="meshDrift"][data-bb-bg-motion="on"] .bb-mesh-a{'
            . 'animation:bb-mesh-a var(--bb-bg-speed,14s) ease-in-out infinite;'
            . '}'
            . '.bb-bg[data-bb-background="meshDrift"][data-bb-bg-motion="on"] .bb-mesh-b{'
            . 'animation:bb-mesh-b calc(var(--bb-bg-speed,14s) * 1.3) ease-in-out infinite;'
            . '}'
            . '.bb-bg[data-bb-background="meshDrift"][data-bb-bg-motion="on"] .bb-mesh-c{'
            . 'animation:bb-mesh-c calc(var(--bb-bg-speed,14s) * 0.8) ease-in-out infinite;'
            . '}'
            . '@media (prefers-reduced-motion:reduce){'
            . '.bb-bg[data-bb-background="meshDrift"][data-bb-bg-motion="on"] .bb-mesh-a,'
            . '.bb-bg[data-bb-background="meshDrift"][data-bb-bg-motion="on"] .bb-mesh-b,'
            . '.bb-bg[data-bb-background="meshDrift"][data-bb-bg-motion="on"] .bb-mesh-c{'
            . 'animation:none;'
            . '}'
            . '}';
    }
}