import { el } from './escms-dom.js';

const enFallback = Object.freeze({
    'topbar.draft': 'Draft',
    'topbar.saving': 'Saving...',
    'topbar.saved': 'Saved',
    'topbar.published': 'Published',
    'topbar.seo': 'SEO Settings',
    'topbar.fullscreen': 'Fullscreen',
    'inspector.structure': 'Structure',
    'inspector.columns_count': 'Number of Columns',
    'inspector.typography': 'Typography',
    'inspector.html_tag': 'HTML Tag',
    'inspector.font_family': 'Font Family',
    'inspector.font_weight': 'Font Weight',
    'inspector.letter_spacing': 'Letter Spacing',
    'inspector.nav_styles': 'Nav Styles',
    'inspector.nav_align': 'Horizontal Alignment',
    'inspector.content_valign': 'Vertical Alignment',
    'inspector.nav_hover_bg': 'Hover Color',
    'inspector.nav_sub_bg': 'Dropdown BG',
    'inspector.nav_sub_glow': 'Dropdown Glow',
    'inspector.nav_sub_border': 'Dropdown Border',
    'inspector.image_align': 'Align',
    'inspector.item_align': 'Item Align',
    'inspector.font_size': 'Font Size',
    'inspector.text_align': 'Text Align',
    'inspector.text_style': 'Text Style',
    'inspector.visibility': 'Visibility',
    'inspector.hidden_element': 'Hidden element',
    'inspector.styles': 'Styles',
    'inspector.text_color': 'Text Color',
    'inspector.gradient_type': 'Type',
    'inspector.position': 'Position',
    'inspector.pos_x': 'Position X',
    'inspector.pos_y': 'Position Y',
    'inspector.angle': 'Angle',
    'inspector.gradient_stop': 'Spread',
    'inspector.gradient_blur': 'Blur',
    'inspector.color_1': 'Color 1',
    'inspector.color_2': 'Color 2',
    'inspector.color_3': 'Color 3',
    'inspector.solid_color': 'Solid Color',
    'inspector.linear_gradient': 'Gradient',
    'inspector.gradient_none': 'None',
    'inspector.animate': 'Animate Gradient',
    'inspector.margin': 'Margin',
    'inspector.padding': 'Padding',
    'inspector.border': 'Border',
    'inspector.opacity': 'Opacity',
    'inspector.attributes': 'Attributes',
    'inspector.background': 'Background',
    'inspector.layout': 'Layout & Spacing',
    'inspector.spacer_height': 'Spacer Height',
    'inspector.radius': 'Radius',
    'inspector.border_style': 'Style',
    "topbar.network_btn": "ESCMS Network",
    "network.modal_title": "ESCMS Network",
    "network.modal_desc": "Boost your SEO and organic traffic instantly. By joining the network, your posts will be automatically distributed across hundreds of ESCMS websites, generating high-quality backlinks and free traffic. In return, your site will display a small, elegant feed of articles from other network members.",
    "network.modal_warning": "Absolute Privacy: No tracking, no cookies, no central server data retention. We don't steal or keep personal data. One for all, and all for one.",
    "network.toggle_label": "Join the Decentralized Network",
    "network.position_label": "Feed Placement",
    "network.pos_footer": "Above Footer",
    "network.pos_content": "End of Content",
    "leftpanel.cat_layout": "Layout",
    "leftpanel.cat_text": "Typography",
    "leftpanel.cat_content": "Content",
    "leftpanel.cat_embeds": "Embeds",
    "leftpanel.cat_downloaded": "Downloaded",
    "leftpanel.custom_components": "Custom",
    "medialibrary.title": "Media manager",
    "medialibrary.search": "Search media...",
    "medialibrary.upload": "Upload Files",
    "medialibrary.select_delete": "Select to Delete",
    "medialibrary.cancel_delete": "Cancel Delete",
    "medialibrary.confirm_delete": "Delete",
    "leftpanel.default_heading": "New Heading",
    "leftpanel.default_paragraph": "Type something here...",
    "leftpanel.default_cite": "This is a blockquote.",
    "leftpanel.default_list_item": "List item",
    "leftpanel.default_code": "console.log('Hello World');",
    "leftpanel.default_button": "Click Me",
    "settings.max_width": "Max Width (px)",
    "settings.page_bg_color": "Page Background Color",
    "settings.text_color": "Text Color",
    "settings.accent_color": "Accent Color",
    "settings.link_color": "Link Color (Normal State)",
    "settings.link_hover_color": "Link Color (On Hover)",
    "settings.google_fonts": "Google Fonts URLs",
    "settings.body_font": "Body Font Family",
    "settings.site_title": "Site Title",
    "settings.meta_desc": "Global Meta Description",
    "set_home": "Set as Homepage",
    "set_blog": "Set as Blog",
    "duplicate_page": "Duplicate Page",
    "rename_page": "Rename Page",
    "delete_page": "Delete Page",
    "pages": "Pages",
    "inspector.src_url": "Source / File URL",
    "inspector.href_url": "Link URL",
    "inspector.effects": "CSS Effects (Filters)",
    "inspector.aria_label": "Aria Label",
    "inspector.display": "Display Mode",
    "inspector.flex_direction": "Flex Direction",
    "inspector.flex_wrap": "Flex Wrap",
    "inspector.justify_content": "Horizontal Align",
    "inspector.align_items": "Vertical Align",
    "inspector.grid_columns": "Grid Columns",
    "inspector.grid_rows": "Grid Rows",
    "inspector.gap": "Gap Spacing",
    "settings.sounds_title": "Play Sounds",
    "settings.sounds_desc": "Play feedback sounds when performing actions in the editor.",
    "settings.webp_title": "Optimize Images (WebP)",
    "settings.webp_desc": "Convert all uploaded images to WebP format automatically to save bandwidth and improve SEO.",
    "settings.autosave_title": "Auto Save to Server",
    "settings.autosave_desc": "Save to server every 60s. If disabled, it will only save locally and requires CTRL+S to upload to the server.",
    "settings.language_title": "Editor Language",
    "settings.logo_title": "Site Logo",
    "settings.favicon_title": "Site Favicon",
    "settings.identity_desc": "Set the logo and favicon for SEO and global meta tags. To display the logo visually on the page header, drag and drop the 'SiteLogo' Atom into the Canvas.",
    "settings.tab_ide": "General",
    "settings.tab_identity": "Identity",
    "settings.tab_layout": "Layout & Colors",
    "settings.tab_backup": "Backup",
    "settings.backup_desc": "Export or Import your entire site configuration, database, and media.",
    "settings.btn_export": "Export Site (.zip)",
    "settings.btn_import": "Import Site (.zip)",
    "settings.zip_missing": "Your server does not have the PHP ZipArchive extension installed. Backup is disabled.",
    "settings.import_warn": "Are you sure? This will permanently overwrite your current site database and files. This action cannot be undone.",
    "settings.import_size_warn": "The ZIP file exceeds your server upload limits. The import will fail.",
    "settings.p2p_title": "ESCMS Network",
    "settings.tab_addons": "Addons",
    "settings.addons_desc": "Expand the capabilities of ESCMS with community addons. Browse and install new components, palettes, and integrations.",
    "settings.addons_loading": "Loading addons...",
    "settings.addons_empty": "No addons found.",
    "settings.addons_btn_install": "Install Addon",
    "settings.addons_btn_update": "Update Addon",
    "settings.addons_btn_delete": "Remove Addon",

    "inspector.alt_text": "ALT Text",
    "inspector.html_tag": "HTML Tag",
    "inspector.item_align": "Alignment",
    "inspector.nav_align": "Horizontal Alignment",
    "inspector.content_valign": "Vertical Alignment",
    "inspector.nav_hover_bg": "Hover Background",
    "editor.drop_atoms": "Drop atoms here",
    "editor.editing_component": "Editing Component:",
    "editor.back_to_page": "Back to Page",
    "inspector.columns_count": "Columns",
    "inspector.border_width": "Width",
    "inspector.border_style": "Style",
    "inspector.border_color": "Color",
    "inspector.effects_section": "Effects",
    "inspector.filters": "Filters",
    "inspector.animation": "Animations",
    "inspector.sticky": "Sticky Header",
    "settings.tab_ide": "IDE",
    "settings.tab_identity": "Identity",
    "settings.tab_layout": "Layout & Colors",
    "settings.tab_typography": "Typography",
    "settings.tab_seo": "Global SEO",
    "settings.max_width": "Max Width",
    "settings.max_width_desc": "This limit only applies to Container atoms, allowing Sections and Headers to span 100% of the screen.",
    "select_parent": "Select Parent",
    "clone": "Clone",
    "delete": "Delete",
    "save_atom": "Save as Atom",
    "add_page": "Add Page",
    "add_link": "Add Link",
    "copy_styles": "Copy Styles",
    "paste_styles": "Paste Styles",
    "add_post": "Add Post",
    "inspector.open_media_manager": "Open Media Manager",
    "controls.reset": "Reset to default",
    "controls.auto": "Auto",
    "controls.clear_color": "Clear color",
    "controls.alpha": "Alpha",
    "controls.size": "Size",
    "controls.thumb": "Thumb",
    "controls.full": "Full",
    "controls.no_image": "No Image",
    "controls.upload_bg": "Upload Background Image",
    "controls.clear_image": "Clear Image",
    "controls.cover": "Cover (Fill)",
    "controls.contain": "Contain (Fit)",
    "controls.pattern": "Pattern (Repeat)",
    "leftpanel.tab_elements": "Elements",
    "leftpanel.tab_layers": "Layers",
    "leftpanel.tab_pages": "Pages",
    "leftpanel.empty_atoms": "No atoms downloaded yet.",
    "leftpanel.empty_components": "No components found.",
    "leftpanel.edit_component": "Edit Component",
    "leftpanel.add_to_canvas": "Add to Canvas",
    "leftpanel.duplicate": "Duplicate",
    "leftpanel.delete": "Delete",
    "leftpanel.empty_canvas": "Canvas is empty",
    "medialibrary.confirm_deletion": "Confirm Deletion",
    "medialibrary.drop_files": "Drop files to upload",
    "medialibrary.confirm_delete_msg": "Are you sure you want to delete {count} items?",
    "medialibrary.uploading": "Uploading",
    "seo.title": "Page SEO Settings",
    "seo.slug": "URL Slug",
    "seo.page_title": "Page Title",
    "seo.description": "Meta Description",
    "seo.keywords": "Keywords",
    "seo.language": "Language Code",
    "settings.add": "Add"
});
export class I18nEngine {
    constructor() {
        this.dictionary = { ...enFallback };
    }

    async loadLanguage(lang, force = false) {
        if (lang === 'en') {
            this.dictionary = { ...enFallback };
            return;
        }
        try {
            const url = `/api/settings?action=download_locale&lang=${lang}` + (force ? '&force=1' : '');
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'success' && data.data) {
                    this.dictionary = { ...enFallback, ...data.data };
                } else {
                    console.warn(`Failed to parse ${lang} locale from server, using fallback`);
                    this.dictionary = { ...enFallback };
                }
            } else {
                console.warn(`Failed to load ${lang} locale, using fallback`);
                this.dictionary = { ...enFallback };
            }
        } catch (e) {
            console.warn(`Error loading ${lang} locale from github, using fallback`, e);
            this.dictionary = { ...enFallback };
        }
    }

    translateDOM(rootElement = document) {
        rootElement.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.dictionary[key]) {
                el.textContent = this.dictionary[key];
            }
        });

        rootElement.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (this.dictionary[key]) {
                el.title = this.dictionary[key];
            }
        });

        rootElement.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (this.dictionary[key]) {
                el.placeholder = this.dictionary[key];
            }
        });
    }

    addTranslations(translationsObject) {
        if (translationsObject && typeof translationsObject === 'object') {
            this.dictionary = { ...this.dictionary, ...translationsObject };
            this.translateDOM(); // Re-translate DOM just in case UI is already rendered
        }
    }

    t(key) {
        return this.dictionary[key] || key;
    }
}