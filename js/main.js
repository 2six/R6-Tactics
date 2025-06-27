import { loadStrategyData } from './modules/data.js';
import { createSiteSelector, createFilterCheckboxes, updateMapBackground, displayStrategies, displayLabels, initMapControls } from './modules/ui.js';

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
    // displayStrategies가 맵을 초기화하므로 먼저 호출
    displayStrategies(siteData.strategies, fullData.strategyTypes, activeFilters);
    // 그 다음 라벨을 추가
    displayLabels(siteData.labels);

    const url = new URL(window.location);
    url.searchParams.set('site', siteId);
    window.history.pushState({}, '', url);
}

function handleFilterChange() {
    const params = new URLSearchParams(window.location.search);
    const currentSiteId = params.get('site');
    if (currentSiteId) {
        const siteData = fullData.sites[currentSiteId];
        const activeFilters = getActiveFilters();
        // 필터 변경 시에는 맵 배경을 다시 로드할 필요 없이 아이콘만 다시 그림
        displayStrategies(siteData.strategies, fullData.strategyTypes, activeFilters);
        displayLabels(siteData.labels);
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
    
    // --- [수정됨] URL 파라미터를 확인하여 테스트 모드 활성화 ---
    const isTestMode = params.get('test') === 'true';
    if (isTestMode) {
        initCoordHelper();
    }
    
    createSiteSelector(fullData.sites, currentSiteId, (newSiteId) => {
        renderView(newSiteId);
    });

    createFilterCheckboxes(fullData.strategyTypes, handleFilterChange);
    
    renderView(currentSiteId);
    
    initMapControls();
}

window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const siteId = params.get('site') || Object.keys(fullData.sites)[0];
    renderView(siteId);
    document.getElementById('site-selector').value = siteId;
});

document.addEventListener('DOMContentLoaded', init);