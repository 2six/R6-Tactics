import { loadStrategyData } from './modules/data.js';
import { createSiteSelector, createFilterCheckboxes, updateMapBackground, displayStrategies, initMapControls } from './modules/ui.js';

const dataPath = 'data.json';

let fullData = null;

function getActiveFilters() {
    const checked = document.querySelectorAll('#filter-checkboxes input:checked');
    return Array.from(checked).map(input => input.value);
}

function renderView(siteId) {
    if (!fullData) return;

    const siteData = fullData.sites[siteId];
    if (!siteData) {
        console.error(`Site '${siteId}' not found in data.json`);
        return;
    }
    
    updateMapBackground(siteData.mapImage);
    const activeFilters = getActiveFilters();
    displayStrategies(siteData.strategies, fullData.strategyTypes, activeFilters);

    const url = new URL(window.location);
    url.searchParams.set('site', siteId);
    window.history.pushState({}, '', url);
}

function handleFilterChange() {
    const params = new URLSearchParams(window.location.search);
    const currentSiteId = params.get('site');
    if (currentSiteId) {
        renderView(currentSiteId);
    }
}

async function init() {
    fullData = await loadStrategyData(dataPath);
    if (!fullData) {
        alert('전략 데이터를 불러오는 데 실패했습니다.');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    let currentSiteId = params.get('site');
    const siteIds = Object.keys(fullData.sites);
    
    if (!currentSiteId || !siteIds.includes(currentSiteId)) {
        currentSiteId = siteIds[0];
    }

    createSiteSelector(fullData.sites, currentSiteId, (newSiteId) => {
        renderView(newSiteId);
    });

    createFilterCheckboxes(fullData.strategyTypes, handleFilterChange);

    renderView(currentSiteId);
    
    // 맵 컨트롤(줌 등) 기능 초기화
    initMapControls();
}

window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const siteId = params.get('site') || Object.keys(fullData.sites)[0];
    renderView(siteId);
    document.getElementById('site-selector').value = siteId;
});

document.addEventListener('DOMContentLoaded', init);