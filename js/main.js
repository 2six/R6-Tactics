import { loadStrategyData } from './modules/data.js';
import { createSiteSelector, createFilterCheckboxes, updateMapBackground, displayStrategies } from './modules/ui.js';

// 현재 페이지의 맵 이름을 경로에서 추출 (예: 'coastline')
const pathParts = window.location.pathname.split('/').filter(p => p);
const currentMapName = pathParts[pathParts.length - 1];
const dataPath = `/maps/${currentMapName}/data.json`;

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

    // URL 업데이트
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
        currentSiteId = siteIds[0]; // URL에 사이트 정보가 없으면 첫번째 사이트로
    }

    createSiteSelector(fullData.sites, currentSiteId, (newSiteId) => {
        renderView(newSiteId);
    });

    createFilterCheckboxes(fullData.strategyTypes, handleFilterChange);

    renderView(currentSiteId);
}

// 브라우저 뒤로가기/앞으로가기 버튼 처리
window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const siteId = params.get('site') || Object.keys(fullData.sites)[0];
    renderView(siteId);
    // 드롭다운 선택도 동기화
    document.getElementById('site-selector').value = siteId;
});

// DOM이 로드되면 앱 시작
document.addEventListener('DOMContentLoaded', init);