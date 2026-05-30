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
    "leftpanel.cat_content": "Content",
    "leftpanel.cat_embeds": "Embeds",
    "leftpanel.cat_downloaded": "Downloaded",
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
    "pages": "Pages"
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
    }
}