<?php
/**
 * Brutal Blocks: Backgrounds Library — On-Demand CSS Injection
 *
 * Permanent decorative background effects for blocks. Separate concern from
 * Brutal_Blocks_Animations (which handles entrance/interaction transitions). These
 * effects stay on the block forever; the user only configures them.
 *
 * Effect families:
 *   Radial  → class-bb-bg-radial.php  (auraGlow, radialFocus)
 *   Linear  → class-bb-bg-linear.php  (linearBand)
 *   Mesh    → class-bb-bg-mesh.php    (meshDrift)
 *
 * @package BrutalBlocks
 * @since   2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Family classes.
require_once dirname( __FILE__ ) . '/effects/class-bb-bg-radial.php';
require_once dirname( __FILE__ ) . '/effects/class-bb-bg-linear.php';
require_once dirname( __FILE__ ) . '/effects/class-bb-bg-mesh.php';

class Brutal_Blocks_Backgrounds {

    /**
     * Effects used in the current request.
     *
     * @var array<string,bool>
     */
    private static $used = array();

    /**
     * Whether at least one effect has been enqueued.
     *
     * @var bool
     */
    private static $base_queued = false;

    /**
     * Whitelist of valid effect names, grouped by family for readability.
     * This is the single source of truth — add new effects here first.
     */
    const ALLOWED_EFFECTS = array(
        // Radial family.
        'auraGlow',
        'radialFocus',
        // Linear family.
        'linearBand',
        // Mesh family.
        'meshDrift',
    );

    /**
     * Effects that require an extra DOM child (.bb-mesh-wrap + blobs).
     * render.php must call get_mesh_inner_html() for these.
     */
    const MESH_EFFECTS = array(
        'meshDrift',
    );

    /**
     * Effects for which the "Animate" toggle has no effect and should be
     * hidden in the Inspector. Declared here so panels.js can read it
     * from window.brutalBlocksData.noMotionEffects if needed.
     */
    const NO_MOTION_EFFECTS = array(
        'linearBand',
    );

    // -------------------------------------------------------------------------
    // Bootstrap
    // -------------------------------------------------------------------------

    /**
     * Register hooks.
     *
     * @return void
     */
    public static function init() {
        add_action( 'wp',      array( __CLASS__, 'prescan_queried_post' ) );
        add_action( 'wp_head', array( __CLASS__, 'flush_inline_css' ), 99 );
    }

    // -------------------------------------------------------------------------
    // Pre-scan
    // -------------------------------------------------------------------------

    /**
     * Pre-scan the current post's block tree and register every background
     * effect it uses so flush_inline_css() can emit exactly the CSS needed.
     *
     * @return void
     */
    public static function prescan_queried_post() {
        if ( is_admin() ) {
            return;
        }
        if ( ! is_singular() ) {
            return;
        }

        $post = get_queried_object();
        if ( ! $post || ! isset( $post->post_content ) ) {
            return;
        }

        if ( false === strpos( $post->post_content, '<!-- wp:brutal-blocks/' ) ) {
            return;
        }

        $blocks = parse_blocks( $post->post_content );
        self::scan_blocks_recursive( $blocks );
    }

    /**
     * Walk a parsed block tree and enqueue any bbBackground it finds.
     *
     * @param array $blocks
     * @return void
     */
    private static function scan_blocks_recursive( $blocks ) {
        if ( ! is_array( $blocks ) ) {
            return;
        }
        foreach ( $blocks as $block ) {
            if ( isset( $block['attrs']['bbBackground'] ) ) {
                $effect = $block['attrs']['bbBackground'];
                if ( is_string( $effect ) && '' !== $effect && 'none' !== $effect ) {
                    self::enqueue( $effect );
                }
            }
            // Hardcode fallback para scroll-mask ya que su valor por defecto es meshDrift y WP no guarda defaults en post_content
            elseif ( isset($block['blockName']) && 'brutal-blocks/scroll-mask' === $block['blockName'] ) {
                self::enqueue( 'meshDrift' );
            }
            if ( ! empty( $block['innerBlocks'] ) ) {
                self::scan_blocks_recursive( $block['innerBlocks'] );
            }
        }
    }

    // -------------------------------------------------------------------------
    // Enqueue
    // -------------------------------------------------------------------------

    /**
     * Mark an effect as needed on the current page.
     *
     * @param string $name Effect name.
     * @return void
     */
    public static function enqueue( $name ) {
        if ( ! is_string( $name ) ) {
            return;
        }
        if ( ! in_array( $name, self::ALLOWED_EFFECTS, true ) ) {
            return;
        }
        self::$used[ $name ] = true;
        self::$base_queued   = true;
    }

    // -------------------------------------------------------------------------
    // render.php helpers
    // -------------------------------------------------------------------------

    /**
     * Build the data-* HTML attributes string for the block wrapper.
     *
     * Emits data-bb-background, data-bb-bg-motion, and (for linearBand)
     * data-bb-bg-linear-dir. Colour and numeric custom properties come from
     * get_wrapper_args() so they land in the style= attribute.
     *
     * @param array $block_attrs Block attributes array.
     * @return string Empty string or space-prefixed attribute string.
     */
    public static function get_html_attrs( $block_attrs ) {
        $resolved = self::resolve( $block_attrs );
        if ( null === $resolved ) {
            return '';
        }

        self::enqueue( $resolved['effect'] );

        $attrs = ' data-bb-background="' . esc_attr( $resolved['effect'] ) . '"';

        if ( $resolved['motion'] && ! in_array( $resolved['effect'], self::NO_MOTION_EFFECTS, true ) ) {
            $attrs .= ' data-bb-bg-motion="on"';
        }

        // linearBand direction — drives CSS selector override.
        if ( 'linearBand' === $resolved['effect'] && '' !== $resolved['linear_dir'] ) {
            $attrs .= ' data-bb-bg-linear-dir="' . esc_attr( $resolved['linear_dir'] ) . '"';
        }

        return $attrs;
    }

    /**
     * Build arguments for get_block_wrapper_attributes() — merges class and
     * inline CSS custom properties with whatever the block already supplies.
     *
     * @param array $block_attrs Block attributes.
     * @param array $base_args   Optional extra args (class, style…) to merge.
     * @return array
     */
    public static function get_wrapper_args( $block_attrs, $base_args = array() ) {
        $args = is_array( $base_args ) ? $base_args : array();

        $resolved = self::resolve( $block_attrs );
        if ( null === $resolved ) {
            return $args;
        }

        // class.
        $existing_class = isset( $args['class'] ) ? trim( $args['class'] ) : '';
        $args['class']  = '' === $existing_class ? 'bb-bg' : $existing_class . ' bb-bg';

        // style — append our custom properties.
        $existing_style = isset( $args['style'] ) ? trim( $args['style'] ) : '';
        if ( '' !== $existing_style && ';' !== substr( $existing_style, -1 ) ) {
            $existing_style .= ';';
        }

        $extra  = '--bb-bg-color:'         . $resolved['color']         . ';';
        $extra .= '--bb-bg-intensity-pct:' . $resolved['intensity_pct'] . ';';
        $extra .= '--bb-bg-size-x:'        . $resolved['size_x']        . ';';
        $extra .= '--bb-bg-size-y:'        . $resolved['size_y']        . ';';

        // radialFocus extras.
        if ( 'radialFocus' === $resolved['effect'] ) {
            $extra .= '--bb-bg-focal-x:' . $resolved['focal_x'] . ';';
            $extra .= '--bb-bg-focal-y:' . $resolved['focal_y'] . ';';
            $extra .= '--bb-bg-spread:'  . $resolved['spread']  . ';';
        }

        // linearBand extras.
        if ( 'linearBand' === $resolved['effect'] ) {
            $extra .= '--bb-bg-linear-start:' . $resolved['linear_start'] . ';';
            $extra .= '--bb-bg-linear-end:'   . $resolved['linear_end']   . ';';
        }

        // meshDrift extras.
        if ( 'meshDrift' === $resolved['effect'] ) {
            $extra .= '--bb-bg-blur:'    . $resolved['mesh_blur']    . ';';
            $extra .= '--bb-bg-opacity:' . $resolved['mesh_opacity'] . ';';
            $extra .= '--bb-bg-speed:'   . $resolved['mesh_speed']   . ';';
            if ( '' !== $resolved['mesh_color_b'] ) {
                $extra .= '--bb-bg-color-b:' . $resolved['mesh_color_b'] . ';';
            }
            if ( '' !== $resolved['mesh_color_c'] ) {
                $extra .= '--bb-bg-color-c:' . $resolved['mesh_color_c'] . ';';
            }
        }

        $args['style'] = $existing_style . $extra;

        return $args;
    }

    /**
     * Return the inner HTML markup required by meshDrift (three blob divs
     * inside a .bb-mesh-wrap container). Call this from render.php and inject
     * the result as the first child of the block wrapper, e.g.:
     *
     *   $mesh_html = BB_Backgrounds::get_mesh_inner_html( $attributes );
 *   $mesh_html = Brutal_Blocks_Backgrounds::get_mesh_inner_html( $attributes );
     *   echo '<div ' . get_block_wrapper_attributes( $wrapper_args ) . '>'
     *       . $mesh_html
     *       . $content
     *       . '</div>';
     *
     * Returns empty string for any effect other than meshDrift.
     *
     * @param array $block_attrs Block attributes.
     * @return string
     */
    public static function get_mesh_inner_html( $block_attrs ) {
        $resolved = self::resolve( $block_attrs );
        if ( null === $resolved || 'meshDrift' !== $resolved['effect'] ) {
            return '';
        }
        return '<div class="bb-mesh-wrap" aria-hidden="true">'
            . '<div class="bb-mesh-a"></div>'
            . '<div class="bb-mesh-b"></div>'
            . '<div class="bb-mesh-c"></div>'
            . '</div>';
    }

    // -------------------------------------------------------------------------
    // CSS emission
    // -------------------------------------------------------------------------

    /**
     * Emit the collected CSS inside <style> in wp_head.
     *
     * @return void
     */
    public static function flush_inline_css() {
        if ( ! self::$base_queued || empty( self::$used ) ) {
            return;
        }

        $css = '';
        foreach ( array_keys( self::$used ) as $effect ) {
            $css .= self::get_effect_css( $effect );
        }

        // CSS is built entirely from hardcoded string constants in family
        // classes — no user input reaches this output. User-supplied values
        // travel through inline custom properties (get_wrapper_args) which
        // are already escaped.
        echo "\n<style id=\"bb-backgrounds-inline\">" . self::minify( $css ) . "</style>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }

    /**
     * Route a CSS request to the correct family class.
     *
     * @param string $name
     * @return string
     */
    private static function get_effect_css( $name ) {
        switch ( $name ) {
            // Radial family.
            case 'auraGlow':
            case 'radialFocus':
                return Brutal_Blocks_Bg_Radial::get_css( $name );
            // Linear family.
            case 'linearBand':
                return Brutal_Blocks_Bg_Linear::get_css( $name );
            // Mesh family.
            case 'meshDrift':
                return Brutal_Blocks_Bg_Mesh::get_css( $name );
            default:
                return '';
        }
    }

    // -------------------------------------------------------------------------
    // Resolve
    // -------------------------------------------------------------------------

    /**
     * Resolve all effect parameters from a block's attributes.
     * Returns null when there is nothing to render.
     *
     * Effect-specific keys are always present in the returned array — they are
     * empty strings / zeros for effects that do not use them. This keeps
     * callers free of isset() checks per-effect.
     *
     * @param mixed $block_attrs
     * @return array|null
     */
    private static function resolve( $block_attrs ) {
        if ( ! is_array( $block_attrs ) ) {
            return null;
        }

        $effect = isset( $block_attrs['bbBackground'] ) ? $block_attrs['bbBackground'] : '';
        $effect = is_string( $effect ) ? trim( $effect ) : '';

        if ( '' === $effect || 'none' === $effect ) {
            return null;
        }
        if ( ! in_array( $effect, self::ALLOWED_EFFECTS, true ) ) {
            return null;
        }

        // ---- Colour ---------------------------------------------------------
        $raw_color = isset( $block_attrs['bbBgColor'] ) ? trim( (string) $block_attrs['bbBgColor'] ) : '';
        $color     = self::resolve_color( $raw_color );

        // ---- Intensity & size -----------------------------------------------
        $intensity_label = isset( $block_attrs['bbBgIntensity'] ) ? $block_attrs['bbBgIntensity'] : 'medium';
        list( $intensity_pct, $size_x, $size_y ) = self::resolve_intensity( $intensity_label );

        // ---- Motion ---------------------------------------------------------
        $motion = isset( $block_attrs['bbBgMotion'] ) ? (bool) $block_attrs['bbBgMotion'] : false;

        // ---- Effect-specific params -----------------------------------------

        // radialFocus.
        $focal_x = '';
        $focal_y = '';
        $spread  = '';
        if ( 'radialFocus' === $effect ) {
            $raw_fx  = isset( $block_attrs['bbBgFocalX'] ) ? intval( $block_attrs['bbBgFocalX'] ) : 50;
            $raw_fy  = isset( $block_attrs['bbBgFocalY'] ) ? intval( $block_attrs['bbBgFocalY'] ) : 50;
            $raw_spr = isset( $block_attrs['bbBgSpread'] ) ? intval( $block_attrs['bbBgSpread'] ) : 75;
            $focal_x = brutal_blocks_clamp_int( $raw_fx,  0, 130 ) . '%';
            $focal_y = brutal_blocks_clamp_int( $raw_fy,  0, 130 ) . '%';
            $spread  = brutal_blocks_clamp_int( $raw_spr, 20, 100 ) . '%';
        }

        // linearBand.
        $linear_dir   = '';
        $linear_start = '';
        $linear_end   = '';
        if ( 'linearBand' === $effect ) {
            $allowed_dirs = array(
                'to top', 'to bottom', 'to right', 'to left',
                'to top right', 'to bottom right', '135deg', '45deg',
            );
            $raw_dir = isset( $block_attrs['bbBgLinearDir'] ) ? trim( (string) $block_attrs['bbBgLinearDir'] ) : 'to top';
            $linear_dir = in_array( $raw_dir, $allowed_dirs, true ) ? $raw_dir : 'to top';

            $raw_start    = isset( $block_attrs['bbBgLinearStart'] ) ? intval( $block_attrs['bbBgLinearStart'] ) : 0;
            $raw_end      = isset( $block_attrs['bbBgLinearEnd'] )   ? intval( $block_attrs['bbBgLinearEnd'] )   : 80;
            $linear_start = brutal_blocks_clamp_int( $raw_start, 0,  60  ) . '%';
            $linear_end   = brutal_blocks_clamp_int( $raw_end,   30, 100 ) . '%';
        }

        // meshDrift.
        $mesh_blur    = '';
        $mesh_opacity = '';
        $mesh_speed   = '';
        $mesh_color_b = '';
        $mesh_color_c = '';
        if ( 'meshDrift' === $effect ) {
            $raw_blur    = isset( $block_attrs['bbBgMeshBlur'] )    ? intval( $block_attrs['bbBgMeshBlur'] )    : 48;
            $raw_opacity = isset( $block_attrs['bbBgMeshOpacity'] ) ? floatval( $block_attrs['bbBgMeshOpacity'] ) : 0.8;
            $raw_speed   = isset( $block_attrs['bbBgMeshSpeed'] )   ? intval( $block_attrs['bbBgMeshSpeed'] )   : 14;

            $mesh_blur    = brutal_blocks_clamp_int( $raw_blur, 10, 120 ) . 'px';
            $mesh_opacity = number_format( max( 0.2, min( 1.0, $raw_opacity ) ), 2 );
            $mesh_speed   = brutal_blocks_clamp_int( $raw_speed, 4, 40 ) . 's';

            $raw_cb = isset( $block_attrs['bbBgMeshColorB'] ) ? trim( (string) $block_attrs['bbBgMeshColorB'] ) : '';
            $raw_cc = isset( $block_attrs['bbBgMeshColorC'] ) ? trim( (string) $block_attrs['bbBgMeshColorC'] ) : '';
            if ( '' !== $raw_cb ) {
                $mesh_color_b = self::sanitize_css_color( $raw_cb ) ?? '';
            }
            if ( '' !== $raw_cc ) {
                $mesh_color_c = self::sanitize_css_color( $raw_cc ) ?? '';
            }
        }

        return array(
            'effect'        => $effect,
            'color'         => $color,
            'intensity_pct' => $intensity_pct,
            'size_x'        => $size_x,
            'size_y'        => $size_y,
            'motion'        => $motion,
            // radialFocus.
            'focal_x'       => $focal_x,
            'focal_y'       => $focal_y,
            'spread'        => $spread,
            // linearBand.
            'linear_dir'    => $linear_dir,
            'linear_start'  => $linear_start,
            'linear_end'    => $linear_end,
            // meshDrift.
            'mesh_blur'     => $mesh_blur,
            'mesh_opacity'  => $mesh_opacity,
            'mesh_speed'    => $mesh_speed,
            'mesh_color_b'  => $mesh_color_b,
            'mesh_color_c'  => $mesh_color_c,
        );
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Validate and return a safe CSS colour, or the Theme Agnostic fallback.
     *
     * @param string $raw
     * @return string
     */
    private static function resolve_color( $raw ) {
        if ( '' === $raw ) {
            return 'var(--wp--preset--color--accent,var(--wp--preset--color--primary,#6366f1))';
        }
        $sanitized = self::sanitize_css_color( $raw );
        return null !== $sanitized
            ? $sanitized
            : 'var(--wp--preset--color--accent,var(--wp--preset--color--primary,#6366f1))';
    }

    /**
     * Map an intensity label to [ intensity_pct, size_x, size_y ].
     *
     * @param string $label
     * @return array
     */
    private static function resolve_intensity( $label ) {
        switch ( $label ) {
            case 'subtle':
                return array( '55', '85%', '75%' );
            case 'strong':
                return array( '110', '110%', '95%' );
            case 'medium':
            default:
                return array( '80', '95%', '85%' );
        }
    }

    /**
     * Validate a user-supplied CSS colour value.
     * Allows hex, rgb(), rgba(), hsl(), hsla(), oklch(), and named colours.
     *
     * @param string $value
     * @return string|null
     */
    private static function sanitize_css_color( $value ) {
        $value = trim( $value );
        if ( '' === $value ) {
            return null;
        }
        // Hex.
        if ( preg_match( '/^#([0-9a-fA-F]{3,8})$/', $value ) ) {
            return $value;
        }
        // Functional colour — rgb/rgba/hsl/hsla/oklch/oklab/color-mix.
        if ( preg_match( '/^(rgba?|hsla?|oklch|oklab|color-mix)\s*\(/i', $value ) ) {
            // Rough but safe: allow the characters used in modern colour functions.
            if ( preg_match( '/^[\w\s\-().,\/%]+$/', $value ) ) {
                return $value;
            }
            return null;
        }
        // CSS named colour (letters only).
        if ( preg_match( '/^[a-zA-Z]+$/', $value ) ) {
            return $value;
        }
        return null;
    }

    /**
     * Cheap CSS minifier — collapses whitespace around punctuation.
     *
     * @param string $css
     * @return string
     */
    private static function minify( $css ) {
        $css = preg_replace( '/\s+/', ' ', $css );
        $css = preg_replace( '/\s*([{};:,])\s*/', '$1', $css );
        return trim( $css );
    }
}

// -------------------------------------------------------------------------
// Module-level helper — avoids repeating min/max/intval chains everywhere.
// Not a method so it stays out of the class namespace and readable inline.
// -------------------------------------------------------------------------

if ( ! function_exists( 'brutal_blocks_clamp_int' ) ) {
    /**
     * Clamp an integer between min and max (inclusive).
     *
     * @param int $value
     * @param int $min
     * @param int $max
     * @return int
     */
    function brutal_blocks_clamp_int( $value, $min, $max ) {
        return max( $min, min( $max, (int) $value ) );
    }
}