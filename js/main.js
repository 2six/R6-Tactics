import { loadStrategyData } from './modules/data.js';
import { 
    createFloorSelector, createSiteSelector, createFilterCheckboxes, 
    updateMapBackground, displayStrategies, displayLabels, 
    initMapControls, initCoordHelper 
} from './modules/ui.js';

const dataPath = 'data.json';
let fullData = null;

function getActiveFilters() {
    const checked = document.querySelectorAll('#filter-checkboxes input:checked');
    return Array.from(checked).map(input => input.value);
}

// [수정됨] 렌더링 함수가 floorId와 siteId를 모두 받도록 변경
function renderView(floorId, siteId) {
    if (!fullData) return;

    const floorData = fullData.floors[floorId];
    const siteData = fullData.sites[siteId];

    if (!floorData || !siteData) {
        console.error(`Data not found for floor '${floorId}' or site '${siteId}'`);
        return;
    }
    
    // 1. 맵 배경 변경
    updateMapBackground(floorData.mapImage);
    
    // 2. 전략 아이콘 표시 (현재 층 기준으로 필터링)
    const activeFilters = getActiveFilters();
    displayStrategies(siteData.strategies, fullData.strategyTypes, activeFilters, floorId);

    // 3. 라벨 표시
    displayLabels(floorData.labels);

    // 4. URL 업데이트
    const url = new URL(window.location);
    url.searchParams.set('floor', floorId);
    url.searchParams.set('site', siteId);
    window.history.pushState({}, '', url);
}

// [수정됨] 필터 변경 시에도 현재 층과 사이트를 모두 알아야 함
function handleFilterChange() {
    const params = new URLSearchParams(window.location.search);
    const floorId = params.get('floor');
    const siteId = params.get('site');
    if (floorId && siteId) {
        renderView(floorId, siteId);
    }
}

async function init() {
    fullData = await loadStrategyData(dataPath);
    if (!fullData) {
        alert('전략 데이터를 불러오는 데 실패했습니다.');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const floorIds = Object.keys(fullData.floors);
    const siteIds = Object.keys(fullData.sites);

    // [수정됨] floor와 site 파라미터 모두 처리
    let currentFloorId = params.get('floor') || floorIds[0];
    let currentSiteId = params.get('site') || siteIds[0];

    // URL 파라미터가 유효하지 않은 경우 첫 번째 값으로 설정
    if (!floorIds.includes(currentFloorId)) currentFloorId = floorIds[0];
    if (!siteIds.includes(currentSiteId)) currentSiteId = siteIds[0];

    // 테스트 모드 활성화
    if (params.get('test') === 'true') {
        initCoordHelper();
    }
    
    // UI 생성 및 이벤트 리스너 연결
    createFloorSelector(fullData.floors, currentFloorId, (newFloorId) => {
        currentFloorId = newFloorId;
        renderView(currentFloorId, currentSiteId);
    });

    createSiteSelector(fullData.sites, currentSiteId, (newSiteId) => {
        currentSiteId = newSiteId;
        renderView(currentFloorId, currentSiteId);
    });

    createFilterCheckboxes(fullData.strategyTypes, handleFilterChange);
    
    // 초기 렌더링
    renderView(currentFloorId, currentSiteId);
    
    initMapControls();
}

window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const floorId = params.get('floor') || Object.keys(fullData.floors)[0];
    const siteId = params.get('site') || Object.keys(fullData.sites)[0];
    
    // 드롭다운 선택도 동기화
    document.getElementById('floor-selector').value = floorId;
    document.getElementById('site-selector').value = siteId;

    renderView(floorId, siteId);
});

document.addEventListener('DOMContentLoaded', init);