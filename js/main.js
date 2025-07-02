import { loadStrategyData } from './modules/data.js';
import { 
    createMapSelector, setMapTitle, // [수정됨] 새로운 함수 import
    createFloorSelector, createSiteSelector, createFilterCheckboxes, 
    updateMapBackground, displayStrategies, displayLabels, 
    initMapControls, initCoordHelper 
} from './modules/ui.js';

// [수정됨] 현재 맵의 ID를 경로에서 추출
const pathParts = window.location.pathname.split('/').filter(p => p);
const currentMapId = pathParts[pathParts.length - 1];

const configPath = '/config.json'; // 최상위 설정 파일 경로
const dataPath = `data.json`; // 현재 맵의 데이터 파일 경로

let fullData = null;
let currentFloorId, currentSiteId; // 현재 상태를 전역에서 관리

function getActiveFilters() {
    const checked = document.querySelectorAll('#filter-checkboxes input[id^="filter-"]:checked');
    return Array.from(checked).map(input => input.value);
}

// [수정됨] 렌더링 함수가 floorId와 siteId를 모두 받도록 변경
function renderView() { // [수정됨] 인자 없이 전역 상태를 사용
    if (!fullData || !currentFloorId || !currentSiteId) return;

    const floorData = fullData.floors[currentFloorId];
    const siteData = fullData.sites[currentSiteId];

    if (!floorData || !siteData) {
        console.error(`Data not found for floor '${currentFloorId}' or site '${currentSiteId}'`);
        return;
    }
    
    updateMapBackground(floorData.mapImage);
    
    const activeFilters = getActiveFilters();
    displayStrategies(siteData.strategies, fullData.strategyTypes, activeFilters, currentFloorId);

    // [수정됨] '층 라벨' 체크박스 상태에 따라 라벨 표시 여부 결정
    const labelsCheckbox = document.getElementById('toggle-labels');
    if (labelsCheckbox && labelsCheckbox.checked) {
        displayLabels(floorData.labels);
    }

    const url = new URL(window.location);
    url.searchParams.set('floor', currentFloorId);
    url.searchParams.set('site', currentSiteId);
    window.history.pushState({}, '', url);
}

function handleFilterChange() {
    // [수정됨] 필터가 변경되면 단순히 현재 상태로 뷰를 다시 그림
    renderView();
}

async function init() {
    const config = await loadStrategyData(configPath);
    if (!config || !config.maps) {
        alert('맵 설정 파일을 불러오는 데 실패했습니다.');
        return;
    }
    createMapSelector(config.maps, currentMapId);
    
    fullData = await loadStrategyData(dataPath);
    if (!fullData) {
        alert('전략 데이터를 불러오는 데 실패했습니다.');
        return;
    }

    const currentMapInfo = config.maps.find(map => map.id === currentMapId);
    if (currentMapInfo) {
        setMapTitle(currentMapInfo.name);
    }

    const params = new URLSearchParams(window.location.search);
    const floorIds = Object.keys(fullData.floors);
    const siteIds = Object.keys(fullData.sites);

    currentFloorId = params.get('floor') || floorIds[0];
    currentSiteId = params.get('site') || siteIds[0];

    if (!floorIds.includes(currentFloorId)) currentFloorId = floorIds[0];
    if (!siteIds.includes(currentSiteId)) currentSiteId = siteIds[0];

    if (params.get('test') === 'true') {
        initCoordHelper();
    }
    
    createFloorSelector(fullData.floors, currentFloorId, (newFloorId) => {
        currentFloorId = newFloorId;
        renderView();
    });

    createSiteSelector(fullData.sites, currentSiteId, (newSiteId) => {
        currentSiteId = newSiteId;
        renderView();
    });

    createFilterCheckboxes(fullData.strategyTypes, handleFilterChange);
    
    renderView();
    
    setTimeout(() => {
        // [수정됨] 현재 맵의 initialView 정보를 initMapControls에 전달
        const initialView = currentMapInfo ? currentMapInfo.initialView : null;
        initMapControls(initialView);
    }, 0);
}

document.addEventListener('DOMContentLoaded', init);