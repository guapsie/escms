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
    'inspector.nav_styles': 'Nav Styles',
    'inspector.nav_align': 'Menu Align',
    'inspector.nav_hover_bg': 'Hover Color',
    'inspector.nav_sub_bg': 'Dropdown BG',
    'inspector.nav_sub_glow': 'Dropdown Glow',
    'inspector.nav_sub_border': 'Dropdown Border',
    'inspector.image_align': 'Image Align',
    'inspector.font_size': 'Font Size',
    'inspector.text_align': 'Text Align',
    'inspector.visibility': 'Visibility',
    'inspector.hidden_element': 'Hidden element',
    'inspector.styles': 'Styles',
    'inspector.text_color': 'Text Color',
    'inspector.solid_color': 'Solid Color',
    'inspector.linear_gradient': 'Linear Gradient',
    'inspector.margin': 'Margin',
    'inspector.padding': 'Padding',
    'inspector.border': 'Border',
    'inspector.opacity': 'Opacity',
    'inspector.attributes': 'Attributes',
    'inspector.background': 'Background',
    'inspector.layout': 'Layout & Spacing',
    'inspector.spacer_height': 'Spacer Height',
    'inspector.radius': 'Border Radius',
    "topbar.network_btn": "ESCMS P2P Network",
    "network.modal_title": "ESCMS Decentralized Network",
    "network.modal_desc": "Connect your blog with the ecosystem. When you publish, your title and link are securely whispered to other nodes. In return, you display organic recommendations from the network.",
    "network.modal_warning": "Absolute Privacy: No tracking, no cookies, no central server data retention. One for all, and all for one.",
    "network.toggle_label": "Join the Decentralized Network",
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
    "settings.webp_title": "Optimize Images (WebP)",
    "settings.webp_desc": "WebP format improves performance and SEO. Disabling this will conserve original images.",
    "settings.auto_zoom_title": "Auto-Zoom Canvas",
    "settings.auto_zoom_desc": "Automatically zooms into the element you click on.",
    "inspector.alt_text": "ALT Text",
    "inspector.width": "Width",
    "inspector.image_align": "Alignment",

    "inspector.nav_align": "Alignment",
    "editor.drop_atoms": "Drop atoms here",
    "editor.editing_component": "Editing Component:",
    "editor.back_to_page": "Back to Page",
    "inspector.columns_count": "Columns",
    "settings.tab_ide": "IDE",
    "settings.tab_layout": "Layout & Colors",
    "settings.tab_typography": "Typography",
    "settings.tab_seo": "Global SEO",
    "ai.panel_title": "AI Copilot",
    "settings.max_width": "Max Width",
    "settings.max_width_desc": "This limit only applies to Container atoms, allowing Sections and Headers to span 100% of the screen.",
    "settings.ai_title": "AI Copilot Setup",
    "settings.ai_loading": "Loading AI settings...",
    "settings.ai_error": "Error loading AI settings",
    "settings.ai_provider": "AI Provider",
    "settings.ai_apikey": "API Key",
    "settings.ai_apikey_placeholder_has": "•••••••••••••••• (Leave blank to keep existing)",
    "settings.ai_apikey_placeholder": "Paste your API key here...",
    "settings.ai_btn_load": "Load Models",
    "settings.ai_btn_loading": "Loading...",
    "settings.ai_model": "AI Model",
    "settings.ai_btn_save": "Save Configuration",
    "settings.ai_btn_saving": "Saving...",
    "settings.ai_btn_saved": "Saved!",
    "ai.panel_title": "Copilot",
    "ai.panel_unconfigured": "AI Copilot is not configured.",
    "ai.btn_open_settings": "Open Global Settings",
    "ai.chat_placeholder": "Ask Copilot...",
    "ai.inject_btn": "Inject to Selection",
    "ai.welcome": "Hi! I am your AI Copilot. Select a text element on the canvas and ask me to fill it with content, or just ask me anything.",
    "settings.ai_endpoint": "Endpoint URL (Custom only)",
    "settings.ai_endpoint_placeholder": "https://your-api.com/v1",
    "settings.ai_instructions": "System Instructions",
    "settings.ai_instructions_placeholder": "You are an expert web designer..."
});
class I18nEngine {
    constructor() {
        this.dictionary = { ...enFallback };
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
}