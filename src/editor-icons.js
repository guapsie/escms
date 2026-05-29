const icons = {
    globe: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="96"></circle><ellipse cx="128" cy="128" rx="40" ry="96"></ellipse><line x1="36.5" y1="96" x2="219.5" y2="96"></line><line x1="36.5" y1="160" x2="219.5" y2="160"></line></svg>`,
    
    pencil: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M92.7,216H48a8,8,0,0,1-8-8V163.3a7.9,7.9,0,0,1,2.3-5.6l120-120a8,8,0,0,1,11.4,0l44.6,44.6a8,8,0,0,1,0,11.4l-120,120A7.9,7.9,0,0,1,92.7,216Z"></path><line x1="136" y1="64" x2="192" y2="120"></line></svg>`,
    
    magnifyingGlass: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><circle cx="112" cy="112" r="80"></circle><line x1="168.6" y1="168.6" x2="224" y2="224"></line></svg>`,
    
    cornersOut: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><polyline points="160 48 208 48 208 96"></polyline><line x1="152" y1="104" x2="208" y2="48"></line><polyline points="96 208 48 208 48 160"></polyline><line x1="104" y1="152" x2="48" y2="208"></line><polyline points="208 160 208 208 160 208"></polyline><line x1="208" y1="208" x2="152" y2="152"></line><polyline points="48 96 48 48 96 48"></polyline><line x1="48" y1="48" x2="104" y2="104"></line></svg>`,

    cornersIn: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><polyline points="208 96 160 96 160 48"></polyline><line x1="208" y1="48" x2="160" y2="96"></line><polyline points="48 160 96 160 96 208"></polyline><line x1="48" y1="208" x2="96" y2="160"></line><polyline points="160 208 160 160 208 160"></polyline><line x1="208" y1="208" x2="160" y2="160"></line><polyline points="96 48 96 96 48 96"></polyline><line x1="48" y1="48" x2="96" y2="96"></line></svg>`,

    monitor: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><rect x="32" y="48" width="192" height="144" rx="16"></rect><line x1="160" y1="224" x2="96" y2="224"></line><line x1="128" y1="192" x2="128" y2="224"></line></svg>`,

    tablet: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><rect x="48" y="32" width="160" height="192" rx="16"></rect><line x1="112" y1="192" x2="144" y2="192"></line></svg>`,

    deviceMobile: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><rect x="64" y="24" width="128" height="208" rx="16"></rect><line x1="112" y1="192" x2="144" y2="192"></line></svg>`,

    shareNetwork: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><circle cx="64" cy="128" r="32"></circle><circle cx="176" cy="200" r="32"></circle><circle cx="176" cy="56" r="32"></circle><line x1="149.1" y1="73.3" x2="90.9" y2="110.7"></line><line x1="90.9" y1="145.3" x2="149.1" y2="182.7"></line></svg>`,

    textT: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><line x1="128" y1="56" x2="128" y2="200"></line><line x1="48" y1="56" x2="208" y2="56"></line><line x1="48" y1="56" x2="48" y2="88"></line><line x1="208" y1="56" x2="208" y2="88"></line></svg>`,

    image: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><rect x="32" y="48" width="192" height="160" rx="16"></rect><circle cx="96" cy="104" r="20"></circle><polyline points="32 168 88 112 224 248"></polyline><polyline points="152 144 176 120 224 168"></polyline></svg>`,

    square: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><rect x="40" y="40" width="176" height="176" rx="16"></rect></svg>`,

    rows: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><rect x="40" y="40" width="176" height="176" rx="16"></rect><line x1="40" y1="128" x2="216" y2="128"></line></svg>`,

    heading: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><polyline points="208 56 208 128 48 128 48 56"></polyline><line x1="208" y1="200" x2="208" y2="128"></line><line x1="48" y1="200" x2="48" y2="128"></line></svg>`,

    copy: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><rect x="88" y="88" width="128" height="128" rx="8"></rect><path d="M168,88V40a8,8,0,0,0-8-8H40a8,8,0,0,0-8,8V168a8,8,0,0,0,8,8H88"></path></svg>`,

    trash: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><line x1="216" y1="56" x2="40" y2="56"></line><line x1="104" y1="104" x2="104" y2="168"></line><line x1="152" y1="104" x2="152" y2="168"></line><path d="M200,56V208a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V56"></path><path d="M168,56V40a16,16,0,0,0-16-16H104A16,16,0,0,0,88,40V56"></path></svg>`,

    atom: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="32"></circle><ellipse cx="128" cy="128" rx="104" ry="40" transform="translate(-53.03 128) rotate(-45)"></ellipse><ellipse cx="128" cy="128" rx="40" ry="104" transform="translate(-53.03 128) rotate(-45)"></ellipse></svg>`,

    stack: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><polygon points="128 24 16 72 128 120 240 72 128 24"></polygon><polyline points="16 120 128 168 240 120"></polyline><polyline points="16 168 128 216 240 168"></polyline></svg>`,

    gearFine: `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M232,120H215.63a87.27,87.27,0,0,0-7.74-28.88l14.18-8.19a8,8,0,0,0-8-13.86l-14.2,8.2a88.78,88.78,0,0,0-21.14-21.14l8.2-14.2a8,8,0,0,0-13.86-8l-8.19,14.18A87.27,87.27,0,0,0,136,40.37V24a8,8,0,0,0-16,0V40.37a87.27,87.27,0,0,0-28.88,7.74L82.93,33.93a8,8,0,0,0-13.86,8l8.2,14.2A88.78,88.78,0,0,0,56.13,77.27l-14.2-8.2a8,8,0,0,0-8,13.86l14.18,8.19A87.27,87.27,0,0,0,40.37,120H24a8,8,0,0,0,0,16H40.37a87.27,87.27,0,0,0,7.74,28.88l-14.18,8.19a8,8,0,0,0,4,14.93,7.92,7.92,0,0,0,4-1.07l14.2-8.2a88.78,88.78,0,0,0,21.14,21.14l-8.2,14.2a8,8,0,0,0,13.86,8l8.19-14.18A87.27,87.27,0,0,0,120,215.63V232a8,8,0,0,0,16,0V215.63a87.27,87.27,0,0,0,28.88-7.74l8.19,14.18a8,8,0,0,0,13.86-8l-8.2-14.2a88.78,88.78,0,0,0,21.14-21.14l14.2,8.2A8,8,0,0,0,225,184a8,8,0,0,0-2.92-10.93l-14.18-8.19A87.27,87.27,0,0,0,215.63,136H232a8,8,0,0,0,0-16ZM128,56a72.08,72.08,0,0,1,71.54,64H132.62L99.16,62.05A71.58,71.58,0,0,1,128,56ZM56,128A72,72,0,0,1,85.31,70.06L118.76,128,85.31,185.94A72,72,0,0,1,56,128Zm72,72A71.58,71.58,0,0,1,99.16,194L132.62,136h66.92A72.08,72.08,0,0,1,128,200Z"></path></svg>`,

    close: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><line x1="200" y1="56" x2="56" y2="200"></line><line x1="200" y1="200" x2="56" y2="56"></line></svg>`,

    dotsThreeVertical: `<svg viewBox="0 0 256 256" fill="currentColor"><circle cx="128" cy="128" r="12"></circle><circle cx="128" cy="64" r="12"></circle><circle cx="128" cy="192" r="12"></circle></svg>`,

    house: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M152,208V160a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v48Z"></path><polygon points="32 112 128 32 224 112"></polygon><polyline points="32 112 32 208 104 208"></polyline><polyline points="224 112 224 208 152 208"></polyline></svg>`,

    scroll: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M208,64V224a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V56a16,16,0,0,1,16-16H184"></path><circle cx="184" cy="64" r="24"></circle><line x1="88" y1="112" x2="152" y2="112"></line><line x1="88" y1="160" x2="168" y2="160"></line></svg>`,

    file: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M200,224H56a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h96l56,56V216A8,8,0,0,1,200,224Z"></path><polyline points="152 32 152 88 208 88"></polyline></svg>`,

    eye: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M128,56C48,56,16,128,16,128s32,72,112,72,112-72,112-72S208,56,128,56Z"></path><circle cx="128" cy="128" r="40"></circle></svg>`
};