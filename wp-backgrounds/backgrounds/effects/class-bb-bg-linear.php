<?php
/**
 * Brutal Blocks: Background Family — Linear
 *
 * Linear-gradient-based background effects. Always renders behind the block
 * content via a pseudo-element so native Gutenberg padding/color controls
 * keep working as expected.
 *
 * Covers: linearBand.
 *
 * linearBand — a clean directional gradient from the accent colour to
 *              transparent. Direction, start stop and end stop are
 *              admin-controlled. No focal point, no radial curvature —
 *              uniform colour intensity along each parallel band.
 *
 * @package BrutalBlocks
 * @since   2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Brutal_Blocks_Bg_Linear {

    /**
     * Return the CSS for the given effect name, or empty string if unknown.
     *
     * @param string $name
     * @return string
     */
    public static function get_css( $name ) {
        switch ( $name ) {
            case 'linearBand':
                return self::linear_band();
            default:
                return '';
        }
    }

    // -------------------------------------------------------------------------
    // linearBand
    // -------------------------------------------------------------------------

    /**
     * Linear Band — directional gradient from accent colour to transparent.
     *
     * The direction is set by --bb-bg-linear-dir. The colour stop and
     * transparent stop are --bb-bg-linear-start / --bb-bg-linear-end.
     * This lets the admin tighten the band (start 0%, end 40%) or stretch it
     * across the full block (start 0%, end 100%).
     *
     * No animated variant: a drifting linear gradient offers no visual benefit
     * (the band just oscillates in opacity). The ToggleControl in the
     * BackgroundPanel is suppressed for this effect in panels.js.
     *
     * Consumes:
     *   --bb-bg-color           → band colour
     *   --bb-bg-intensity-pct   → 55 | 80 | 110  (subtle | medium | strong)
     *                             used to scale opacity via color-mix
     *   --bb-bg-linear-dir      → CSS gradient direction keyword or angle
     *                             e.g. "to top" | "to bottom right" | "135deg"
     *                             (default: to top)
     *   --bb-bg-linear-start    → colour stop % (default 0%)
     *   --bb-bg-linear-end      → transparent stop % (default 80%)
     *
     * @return string
     */
    private static function linear_band() {
        return '.bb-bg[data-bb-background="linearBand"]{'
            . 'position:relative;'
            . 'isolation:isolate;'
            . '}'
            . '.bb-bg[data-bb-background="linearBand"]::before{'
            . 'content:"";'
            . 'position:absolute;'
            . 'inset:0;'
            . 'z-index:-1;'
            . 'border-radius:inherit;'
            . 'pointer-events:none;'
            /*
             * CSS custom properties inside a gradient function string
             * cannot interpolate the direction keyword directly because
             * the browser does not allow a custom property to replace a
             * gradient keyword token. We work around this with a CSS trick:
             * we generate one rule per direction value using data attributes,
             * and the admin's choice sets data-bb-bg-linear-dir on the element.
             * This keeps the CSS static (no JS needed at runtime) while still
             * giving the admin full control from the Inspector.
             *
             * Directions supported — matches the SelectControl options in panels.js.
             */
            . 'background:linear-gradient('
            . 'to top,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,80) * 1%),transparent) var(--bb-bg-linear-start,0%),'
            . 'transparent var(--bb-bg-linear-end,80%)'
            . ');'
            . '}'
            /* Direction overrides via data attribute. */
            . '.bb-bg[data-bb-background="linearBand"][data-bb-bg-linear-dir="to bottom"]::before{'
            . 'background:linear-gradient('
            . 'to bottom,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,80) * 1%),transparent) var(--bb-bg-linear-start,0%),'
            . 'transparent var(--bb-bg-linear-end,80%)'
            . ');}'
            . '.bb-bg[data-bb-background="linearBand"][data-bb-bg-linear-dir="to right"]::before{'
            . 'background:linear-gradient('
            . 'to right,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,80) * 1%),transparent) var(--bb-bg-linear-start,0%),'
            . 'transparent var(--bb-bg-linear-end,80%)'
            . ');}'
            . '.bb-bg[data-bb-background="linearBand"][data-bb-bg-linear-dir="to left"]::before{'
            . 'background:linear-gradient('
            . 'to left,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,80) * 1%),transparent) var(--bb-bg-linear-start,0%),'
            . 'transparent var(--bb-bg-linear-end,80%)'
            . ');}'
            . '.bb-bg[data-bb-background="linearBand"][data-bb-bg-linear-dir="to top right"]::before{'
            . 'background:linear-gradient('
            . 'to top right,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,80) * 1%),transparent) var(--bb-bg-linear-start,0%),'
            . 'transparent var(--bb-bg-linear-end,80%)'
            . ');}'
            . '.bb-bg[data-bb-background="linearBand"][data-bb-bg-linear-dir="to bottom right"]::before{'
            . 'background:linear-gradient('
            . 'to bottom right,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,80) * 1%),transparent) var(--bb-bg-linear-start,0%),'
            . 'transparent var(--bb-bg-linear-end,80%)'
            . ');}'
            . '.bb-bg[data-bb-background="linearBand"][data-bb-bg-linear-dir="135deg"]::before{'
            . 'background:linear-gradient('
            . '135deg,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,80) * 1%),transparent) var(--bb-bg-linear-start,0%),'
            . 'transparent var(--bb-bg-linear-end,80%)'
            . ');}'
            . '.bb-bg[data-bb-background="linearBand"][data-bb-bg-linear-dir="45deg"]::before{'
            . 'background:linear-gradient('
            . '45deg,'
            . 'color-mix(in srgb,var(--bb-bg-color) calc(var(--bb-bg-intensity-pct,80) * 1%),transparent) var(--bb-bg-linear-start,0%),'
            . 'transparent var(--bb-bg-linear-end,80%)'
            . ');}';
    }
}