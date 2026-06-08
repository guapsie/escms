<?php
/**
 * Brutal Blocks: Background Family — Radial
 *
 * Radial-gradient-based background effects. Always renders behind the block
 * content via a pseudo-element so native Gutenberg padding/color controls
 * keep working as expected.
 *
 * Covers: auraGlow, radialFocus.
 *
 * auraGlow     — centre pushed outside the block (at 50% 120%). Perceived as
 *                a diffuse band of colour curving along the bottom edge.
 *
 * radialFocus  — centre configurable by the admin (X/Y %). Default is centred
 *                inside the block (50% 50%). Useful as a spotlight on a CTA,
 *                hero text, or featured pricing plan.
 *
 * @package BrutalBlocks
 * @since   2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Brutal_Blocks_Bg_Radial {

    /**
     * Return the CSS for the given effect name, or empty string if unknown.
     *
     * @param string $name
     * @return string
     */
    public static function get_css( $name ) {
        switch ( $name ) {
            case 'auraGlow':
                return self::aura_glow();
            case 'radialFocus':
                return self::radial_focus();
            default:
                return '';
        }
    }

    // -------------------------------------------------------------------------
    // auraGlow
    // -------------------------------------------------------------------------

    /**
     * Aura Glow — radial gradient with the centre pushed outside the block.
     *
     * The result is perceived as a diffuse band of colour curving along the
     * block edge (bottom-centre by default) that fades into the block's
     * own background.
     *
     * Intensity is driven by --bb-bg-intensity-pct (set inline by render.php
     * from the admin's intensity choice). At "strong" the radial also grows
     * larger so the colour bleeds further into the block.
     *
     * Consumes:
     *   --bb-bg-color          → base colour of the glow
     *   --bb-bg-intensity-pct  → 55 | 80 | 110  (subtle | medium | strong)
     *   --bb-bg-size-x         → ellipse width   (85% | 95% | 110%)
     *   --bb-bg-size-y         → ellipse height  (75% | 85% | 95%)
     *
     * @return string
     */
    private static function aura_glow() {
        return '.bb-bg[data-bb-background="auraGlow"]{'
            . 'position:relative;'
            . 'isolation:isolate;'
            . '}'
            . '.bb-bg[data-bb-background="auraGlow"]::before{'
            . 'content:"";'
            . 'position:absolute;'
            . 'inset:0;'
            . 'z-index:-1;'
            . 'border-radius:inherit;'
            . 'pointer-events:none;'
            . 'background:radial-gradient('
            . 'ellipse var(--bb-bg-size-x,85%) var(--bb-bg-size-y,75%) at 50% 120%,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,55) * 1%),transparent) 0%,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,55) * 0.5%),transparent) 40%,'
            . 'transparent 75%'
            . ');'
            . '}'
            . '@property --bb-aura-x{syntax:"<percentage>";inherits:false;initial-value:50%;}'
            . '@property --bb-aura-y{syntax:"<percentage>";inherits:false;initial-value:120%;}'
            . '@keyframes bb-aura-drift{'
            . '0%{--bb-aura-x:35%;--bb-aura-y:118%;}'
            . '25%{--bb-aura-x:60%;--bb-aura-y:125%;}'
            . '50%{--bb-aura-x:65%;--bb-aura-y:115%;}'
            . '75%{--bb-aura-x:40%;--bb-aura-y:128%;}'
            . '100%{--bb-aura-x:35%;--bb-aura-y:118%;}'
            . '}'
            . '.bb-bg[data-bb-background="auraGlow"][data-bb-bg-motion="on"]::before{'
            . 'background:radial-gradient('
            . 'ellipse var(--bb-bg-size-x,85%) var(--bb-bg-size-y,75%) at var(--bb-aura-x) var(--bb-aura-y),'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,55) * 1%),transparent) 0%,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,55) * 0.5%),transparent) 40%,'
            . 'transparent 75%'
            . ');'
            . 'animation:bb-aura-drift 9s ease-in-out infinite;'
            . '}'
            . '@media (prefers-reduced-motion:reduce){'
            . '.bb-bg[data-bb-background="auraGlow"][data-bb-bg-motion="on"]::before{'
            . 'animation:none;'
            . '}'
            . '}';
    }

    // -------------------------------------------------------------------------
    // radialFocus
    // -------------------------------------------------------------------------

    /**
     * Radial Focus — spotlight that emerges from a configurable focal point.
     *
     * Unlike auraGlow (centre outside, perceived as edge band), radialFocus
     * places the centre inside the block. Default: 50% 50% (dead centre).
     * The admin can shift the focus to any point — including outside the block
     * for a band-like effect — via data-bb-bg-focal-x / data-bb-bg-focal-y.
     *
     * Because the focal point is admin-controlled and must survive CSS-only
     * injection (no JS required), the X/Y values are delivered as CSS custom
     * properties set inline on the element by render.php, just like colour
     * and intensity.
     *
     * Consumes:
     *   --bb-bg-color          → spotlight colour
     *   --bb-bg-intensity-pct  → 55 | 80 | 110  (subtle | medium | strong)
     *   --bb-bg-size-x         → ellipse width   (85% | 95% | 110%)
     *   --bb-bg-size-y         → ellipse height  (75% | 85% | 95%)
     *   --bb-bg-focal-x        → horizontal focal % (default 50%)
     *   --bb-bg-focal-y        → vertical focal %   (default 50%)
     *   --bb-bg-spread         → transparent stop % (default 75%)
     *
     * Animated variant drifts the focal point in a slow elliptical path.
     *
     * @return string
     */
    private static function radial_focus() {
        return '.bb-bg[data-bb-background="radialFocus"]{'
            . 'position:relative;'
            . 'isolation:isolate;'
            . '}'
            . '.bb-bg[data-bb-background="radialFocus"]::before{'
            . 'content:"";'
            . 'position:absolute;'
            . 'inset:0;'
            . 'z-index:-1;'
            . 'border-radius:inherit;'
            . 'pointer-events:none;'
            . 'background:radial-gradient('
            . 'ellipse var(--bb-bg-size-x,95%) var(--bb-bg-size-y,85%) at var(--bb-bg-focal-x,50%) var(--bb-bg-focal-y,50%),'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,80) * 1%),transparent) 0%,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,80) * 0.4%),transparent) 45%,'
            . 'transparent var(--bb-bg-spread,75%)'
            . ');'
            . '}'
            . '@property --bb-focus-x{syntax:"<percentage>";inherits:false;initial-value:0%;}'
            . '@property --bb-focus-y{syntax:"<percentage>";inherits:false;initial-value:0%;}'
            . '@keyframes bb-focus-drift{'
            . '0%{--bb-focus-x:-5%;--bb-focus-y:-2%;}'
            . '30%{--bb-focus-x:5%;--bb-focus-y:2%;}'
            . '60%{--bb-focus-x:0%;--bb-focus-y:-5%;}'
            . '80%{--bb-focus-x:-2%;--bb-focus-y:5%;}'
            . '100%{--bb-focus-x:-5%;--bb-focus-y:-2%;}'
            . '}'
            . '.bb-bg[data-bb-background="radialFocus"][data-bb-bg-motion="on"]::before{'
            . 'background:radial-gradient('
            . 'ellipse var(--bb-bg-size-x,95%) var(--bb-bg-size-y,85%) at calc(var(--bb-bg-focal-x, 50%) + var(--bb-focus-x)) calc(var(--bb-bg-focal-y, 50%) + var(--bb-focus-y)),'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,80) * 1%),transparent) 0%,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,80) * 0.4%),transparent) 45%,'
            . 'transparent var(--bb-bg-spread,75%)'
            . ');'
            . 'animation:bb-focus-drift 12s ease-in-out infinite;'
            . '}'
            . '@media (prefers-reduced-motion:reduce){'
            . '.bb-bg[data-bb-background="radialFocus"][data-bb-bg-motion="on"]::before{'
            . 'animation:none;'
            . '}'
            . '}';
    }
}