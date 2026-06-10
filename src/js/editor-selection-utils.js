window.escmsTextBlockTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'LABEL', 'BLOCKQUOTE', 'A'];

window.escmsResolveTarget = function (target) {
    const closestBlock = target.closest(window.escmsTextBlockTags.join(','));
    if (closestBlock && closestBlock.id !== 'document-root') target = closestBlock;
    const compParent = target.closest('escms-component');
    if (compParent) target = compParent;
    return target;
};