import { EscmsSlider, EscmsCollectionControl } from '../../controls/editor-controls.js';

export function createStructureSection(inspector) {
    const section = inspector.createSection('inspector.structure');
    section.style.display = 'none';

    inspector.controls.columnsCount = new EscmsSlider('inspector.columns_count', 1, 12, 1, 2, (val) => inspector.updateColumns(val), '');
    section.appendChild(inspector.controls.columnsCount.element);

    inspector.controls.gridItemWidth = new EscmsSlider('inspector.grid_item_width', 100, 1000, 10, 250, (val) => inspector.updateGridItemWidth(val), 'px');
    section.appendChild(inspector.controls.gridItemWidth.element);

    inspector.controls.imageCollection = new EscmsCollectionControl('inspector.image_collection', inspector.i18n, [], (val) => inspector.updateImageCollection(val));
    section.appendChild(inspector.controls.imageCollection.element);

    return section;
}
