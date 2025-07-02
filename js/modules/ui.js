const mapArea = document.querySelector('.map-area');
const mapContainer = document.getElementById('map-container');
const mapContent = document.getElementById('map-content');

// [수정됨] 맵 관련 UI 요소 추가
const mapSelectorContainer = document.getElementById('map-selector-container');
const mapTitle = document.getElementById('map-title');

// [수정됨] 제어 대상을 버튼 컨테이너로 변경
const floorButtonsContainer = document.getElementById('floor-buttons');
const siteButtonsContainer = document.getElementById('site-buttons');

const filterCheckboxesContainer = document.getElementById('filter-checkboxes');

// Modal Elements
const modalContainer = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalMediaSlider = document.getElementById('modal-media-slider');
const filmstrip = modalMediaSlider.querySelector('.slider-filmstrip');
const prevBtn = modalMediaSlider.querySelector('.slider-btn.prev');
const nextBtn = modalMediaSlider.querySelector('.slider-btn.next');
const counter = modalMediaSlider.querySelector('.slider-counter');

let currentSlideIndex = 0;
let totalSlides = 0;

// --- Map Control Variables ---
let currentScale = 1;
const MIN_SCALE = 0.5;
const MAX_SCALE = 8.0;
let currentTranslateX = 0, currentTranslateY = 0;
let isPanning = false;
let startX, startY, startTranslateX, startTranslateY;

// --- Map Control Functions ---

function applyTransform() {
    mapContainer.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
}

// [수정됨] "관심 영역" 기반으로 초기 뷰를 계산하는 함수
export function setInitialMapView(initialView) {
    const areaWidth = mapArea.clientWidth;
    const areaHeight = mapArea.clientHeight;
    const containerBaseWidth = mapContainer.offsetWidth;
    const containerBaseHeight = mapContainer.offsetHeight;
    if (containerBaseWidth === 0) return;

    if (initialView && initialView.aoi) {
        // 1. config.json에 정의된 '관심 영역' 뷰 사용
        const aoi = initialView.aoi;
        
        // 퍼센트 값을 소수점으로 변환
        const x1 = parseFloat(aoi.x1) / 100;
        const y1 = parseFloat(aoi.y1) / 100;
        const x2 = parseFloat(aoi.x2) / 100;
        const y2 = parseFloat(aoi.y2) / 100;

        // 관심 영역의 너비와 높이 (맵 원본 크기 기준 비율)
        const aoiWidthRatio = x2 - x1;
        const aoiHeightRatio = y2 - y1;

        // 관심 영역의 중심점 (맵 원본 크기 기준 비율)
        const aoiCenterXRatio = x1 + aoiWidthRatio / 2;
        const aoiCenterYRatio = y1 + aoiHeightRatio / 2;

        // a. 필요한 확대 배율 계산
        // 화면에 관심 영역을 꽉 채우기 위한 가로/세로 배율
        const scaleX = areaWidth / (aoiWidthRatio * containerBaseWidth);
        const scaleY = areaHeight / (aoiHeightRatio * containerBaseHeight);
        
        // 두 배율 중 더 작은 값을 선택해야 영역이 잘리지 않음
        currentScale = Math.min(scaleX, scaleY) * 0.95; // 5% 여백

        // b. 필요한 위치 이동량 계산
        // (화면 중심점) - (확대된 관심 영역의 중심점)
        currentTranslateX = (areaWidth / 2) - (aoiCenterXRatio * containerBaseWidth * currentScale);
        currentTranslateY = (areaHeight / 2) - (aoiCenterYRatio * containerBaseHeight * currentScale);

    } else {
        // 2. 초기 뷰가 없으면 기본 동작 (전체 맵을 가로 폭에 맞춰 중앙 정렬)
        currentScale = areaWidth / containerBaseWidth;
        currentTranslateX = 0;
        currentTranslateY = (areaHeight - containerBaseHeight * currentScale) / 2;
    }
    
    applyTransform();
}

function handleWheelZoom(event) {
    event.preventDefault();
    
    const zoomIntensity = 0.1;
    const direction = event.deltaY < 0 ? 1 : -1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale * (1 + direction * zoomIntensity)));
    
    const rect = mapArea.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const pointX = (mouseX - currentTranslateX) / currentScale;
    const pointY = (mouseY - currentTranslateY) / currentScale;

    currentTranslateX = mouseX - pointX * newScale;
    currentTranslateY = mouseY - pointY * newScale;
    
    currentScale = newScale;
    
    applyTransform();
}

function handleMouseDown(event) {
    event.preventDefault();
    isPanning = true;
    mapArea.classList.add('panning');
    mapContainer.classList.add('panning-optimization'); // <<< 제어 대상 변경
    startX = event.clientX;
    startY = event.clientY;
    startTranslateX = currentTranslateX;
    startTranslateY = currentTranslateY;
}

function handleMouseMove(event) {
    if (!isPanning) return;
    event.preventDefault();
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    currentTranslateX = startTranslateX + deltaX;
    currentTranslateY = startTranslateY + deltaY;
    applyTransform();
}

function handleMouseUpOrLeave() {
    isPanning = false;
    mapArea.classList.remove('panning');
    mapContainer.classList.remove('panning-optimization'); // <<< 제어 대상 변경
}

export function initMapControls(initialView) {
    // [수정됨] fitMapToContainer 대신 setInitialMapView 호출
    setInitialMapView(initialView);
    
    mapArea.addEventListener('wheel', handleWheelZoom, { passive: false });
    mapArea.addEventListener('mousedown', handleMouseDown);
    mapArea.addEventListener('mousemove', handleMouseMove);
    mapArea.addEventListener('mouseup', handleMouseUpOrLeave);
    mapArea.addEventListener('mouseleave', handleMouseUpOrLeave);
    
    // [수정됨] 창 크기 변경 시에는 항상 기본 뷰로 돌아가도록 설정 (또는 initialView를 다시 적용할 수도 있음)
    window.addEventListener('resize', () => setInitialMapView(initialView)); 
}

// --- UI Creation Functions ---

export function createMapSelector(maps, currentMapId) {
    const select = document.createElement('select');
    select.id = 'map-selector';

    maps.forEach(map => {
        const option = document.createElement('option');
        option.value = map.path;
        option.textContent = map.name;
        if (map.id === currentMapId) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        window.location.href = select.value; // 선택된 맵의 경로로 페이지 이동
    });

    mapSelectorContainer.appendChild(select);
}

// [추가됨] 맵 타이틀 설정 함수
export function setMapTitle(name) {
    mapTitle.textContent = name;
}

// [수정됨] 층 선택 버튼 그룹 생성 함수
export function createFloorSelector(floors, currentFloorId, onFloorChange) {
    floorButtonsContainer.innerHTML = '';
    for (const floorId in floors) {
        const button = document.createElement('button');
        button.className = 'control-button';
        button.textContent = floors[floorId].name;
        button.dataset.floorId = floorId; // 데이터 속성으로 ID 저장
        if (floorId === currentFloorId) {
            button.classList.add('selected');
        }
        floorButtonsContainer.appendChild(button);
    }

    floorButtonsContainer.addEventListener('click', (e) => {
        const targetButton = e.target.closest('.control-button');
        if (!targetButton) return;

        // 모든 버튼에서 'selected' 클래스 제거
        floorButtonsContainer.querySelectorAll('.control-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        // 클릭된 버튼에만 'selected' 클래스 추가
        targetButton.classList.add('selected');
        
        onFloorChange(targetButton.dataset.floorId);
    });
}

// [수정됨] 방어 지역 선택 버튼 그룹 생성 함수
export function createSiteSelector(sites, currentSiteId, onSiteChange) {
    siteButtonsContainer.innerHTML = '';
    for (const siteId in sites) {
        const button = document.createElement('button');
        button.className = 'control-button';
        button.textContent = sites[siteId].name;
        button.dataset.siteId = siteId; // 데이터 속성으로 ID 저장
        if (siteId === currentSiteId) {
            button.classList.add('selected');
        }
        siteButtonsContainer.appendChild(button);
    }
    
    siteButtonsContainer.addEventListener('click', (e) => {
        const targetButton = e.target.closest('.control-button');
        if (!targetButton) return;

        siteButtonsContainer.querySelectorAll('.control-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        targetButton.classList.add('selected');

        onSiteChange(targetButton.dataset.siteId);
    });
}

export function createFilterCheckboxes(strategyTypes, onFilterChange) {
    filterCheckboxesContainer.innerHTML = '';

    // [수정됨] "층 라벨" 토글 체크박스 추가
    const labelToggleDiv = document.createElement('div');
    labelToggleDiv.className = 'filter-checkbox-item';

    const labelToggleInput = document.createElement('input');
    labelToggleInput.type = 'checkbox';
    labelToggleInput.id = 'toggle-labels'; // 고유 ID
    labelToggleInput.value = 'labels';
    labelToggleInput.checked = true;

    const labelToggleLabel = document.createElement('label');
    labelToggleLabel.htmlFor = 'toggle-labels';
    labelToggleLabel.textContent = '지명';

    labelToggleDiv.appendChild(labelToggleLabel);
    labelToggleDiv.appendChild(labelToggleInput);
    filterCheckboxesContainer.appendChild(labelToggleDiv);
    
    // [수정됨] 전략 필터 체크박스 생성
    strategyTypes.forEach(type => {
        const div = document.createElement('div');
        div.className = 'filter-checkbox-item'; // 새로운 클래스 이름 적용

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `filter-${type.id}`;
        input.value = type.id;
        input.checked = true;

        const label = document.createElement('label');
        label.htmlFor = `filter-${type.id}`;
        label.textContent = type.label;
        
        // [수정됨] 라벨을 먼저 추가
        div.appendChild(label);
        div.appendChild(input);
        filterCheckboxesContainer.appendChild(div);
    });

    filterCheckboxesContainer.addEventListener('change', onFilterChange);
}

export function updateMapBackground(imageUrl) {
    // [수정됨] 안쪽 컨테이너에 배경 이미지 적용
    mapContent.style.backgroundImage = `url(${imageUrl})`;
}

export function displayStrategies(strategies = [], strategyTypes, activeFilters, currentFloorId) {
    mapContent.innerHTML = '';
    const typeMap = new Map(strategyTypes.map(t => [t.id, t]));

    strategies.forEach(strategy => {
        if (strategy.floorId !== currentFloorId) return;
        if (!activeFilters.includes(strategy.type)) return;

        const typeInfo = typeMap.get(strategy.type);
        if (!typeInfo) return;

        const icon = document.createElement('img');
        icon.className = 'strategy-icon';
        icon.src = typeInfo.icon;

        // 크기 적용 (개별 전략 값 우선)
        icon.style.width = strategy.width || typeInfo.width;
        icon.style.height = strategy.height || typeInfo.height;

        // 위치 적용
        icon.style.left = strategy.pos.x;
        icon.style.top = strategy.pos.y;

        // Transform 적용 (중앙 정렬 + 개별 회전)
        let transformValue = 'translate(-50%, -50%)';
        if (strategy.rotation) {
            transformValue += ` rotate(${strategy.rotation}deg)`;
        }
        icon.style.transform = transformValue;
        
        // --- [수정됨] z-index 적용 로직 ---
        if (strategy.zIndex) {
            icon.style.zIndex = strategy.zIndex;
        }

        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            showModal(strategy.modalContent);
        });
        mapContent.appendChild(icon);
    });
}

export function displayLabels(labels = []) {
    labels.forEach(label => {
        const labelEl = document.createElement('div');
        labelEl.className = 'map-label';
        labelEl.textContent = label.text;
        labelEl.style.left = label.pos.x;
        labelEl.style.top = label.pos.y;
        if (label.fontSize) {
            labelEl.style.fontSize = label.fontSize;
        }
        let transformValue = 'translate(-50%, -50%)';
        if (label.rotation) {
            transformValue += ` rotate(${label.rotation}deg)`;
        }
        labelEl.style.transform = transformValue;
        mapContent.appendChild(labelEl);
    });
}

// --- [수정됨] Coordinate Helper Functions ---

export function initCoordHelper() {
    const coordDisplay = document.createElement('div');
    coordDisplay.className = 'coord-helper-display';
    document.body.appendChild(coordDisplay);

    mapArea.addEventListener('mousemove', (event) => {
        // --- 여기부터 완전히 새로운 계산 로직 ---

        // 1. 줌/패닝이 적용된 맵 뷰어의 화면상 실제 크기와 위치를 가져옴
        const mapRect = mapContent.getBoundingClientRect(); // <<< 기준점을 안쪽 컨테이너로 변경

        // 2. 마우스 커서의 현재 화면상 위치
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // 3. 마우스가 맵 뷰어의 영역 안에 있는지 확인
        if (
            mouseX >= mapRect.left &&
            mouseX <= mapRect.right &&
            mouseY >= mapRect.top &&
            mouseY <= mapRect.bottom
        ) {
            // 4. 맵 뷰어 내에서의 상대적인 마우스 위치 (픽셀 단위)
            const mouseXOnScaledMap = mouseX - mapRect.left;
            const mouseYOnScaledMap = mouseY - mapRect.top;

            // 5. 줌 배율을 고려하여 원본 맵 이미지 기준의 픽셀 좌표 계산
            const mouseXOnOriginalMap = mouseXOnScaledMap / currentScale;
            const mouseYOnOriginalMap = mouseYOnScaledMap / currentScale;

            // 6. 원본 맵 이미지의 너비/높이 가져오기
            const originalMapWidth = mapContent.offsetWidth; // <<< 기준점을 안쪽 컨테이너로 변경
            const originalMapHeight = mapContent.offsetHeight; // <<< 기준점을 안쪽 컨테이너로 변경

            // 7. 픽셀 좌표를 퍼센트(%)로 변환
            const percentX = (mouseXOnOriginalMap / originalMapWidth) * 100;
            const percentY = (mouseYOnOriginalMap / originalMapHeight) * 100;
            
            coordDisplay.style.display = 'block';
            coordDisplay.textContent = `X: ${percentX.toFixed(1)}%, Y: ${percentY.toFixed(1)}%`;
            coordDisplay.style.left = `${mouseX + 15}px`;
            coordDisplay.style.top = `${mouseY}px`;

        } else {
            // 마우스가 맵 영역 밖에 있으면 숨김
            coordDisplay.style.display = 'none';
        }
    });

    mapArea.addEventListener('mouseleave', () => {
        coordDisplay.style.display = 'none';
    });
}

// --- Modal Functions ---

function updateSlider() {
    filmstrip.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    counter.textContent = `${currentSlideIndex + 1} / ${totalSlides}`;
    prevBtn.style.display = currentSlideIndex === 0 ? 'none' : 'block';
    nextBtn.style.display = currentSlideIndex === totalSlides - 1 ? 'none' : 'block';
}

function stopAllVideos() {
    filmstrip.querySelectorAll('iframe').forEach(iframe => {
        // iframe의 src를 비워서 재생을 멈춤
        iframe.src = iframe.src; 
    });
}

function showModal(content) {
    modalTitle.textContent = content.title;
    modalDescription.textContent = content.description;
    
    // 슬라이더 초기화
    filmstrip.innerHTML = '';
    currentSlideIndex = 0;
    
    const media = content.media || [];
    totalSlides = media.length;

    if (totalSlides > 0) {
        media.forEach(item => {
            const slide = document.createElement('div');
            slide.className = 'slider-item';

            if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = item.src;
                slide.appendChild(img);
            } else if (item.type === 'youtube') {
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube.com/embed/${item.src}`;
                iframe.title = "YouTube video player";
                iframe.frameBorder = "0";
                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                iframe.allowFullscreen = true;
                slide.appendChild(iframe);
            }
            filmstrip.appendChild(slide);
        });
        
        counter.style.display = totalSlides > 1 ? 'block' : 'none';
        modalMediaSlider.classList.remove('hidden');
        updateSlider();
    } else {
        modalMediaSlider.classList.add('hidden');
    }

    modalContainer.classList.remove('hidden');
}

function hideModal() {
    stopAllVideos();
    modalContainer.classList.add('hidden');
}

// 슬라이더 버튼 이벤트 리스너
prevBtn.addEventListener('click', () => {
    if (currentSlideIndex > 0) {
        stopAllVideos();
        currentSlideIndex--;
        updateSlider();
    }
});
nextBtn.addEventListener('click', () => {
    if (currentSlideIndex < totalSlides - 1) {
        stopAllVideos();
        currentSlideIndex++;
        updateSlider();
    }
});

// 모달 닫기 이벤트 리스너
modalContainer.querySelector('.modal-close-btn').addEventListener('click', hideModal);
modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) {
        hideModal();
    }
});