const mapArea = document.querySelector('.map-area');
const mapViewer = document.getElementById('map-viewer');
const floorSelector = document.getElementById('floor-selector');
const siteSelector = document.getElementById('site-selector');
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
    mapViewer.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
}

function fitMapToContainer() {
    const areaWidth = mapArea.clientWidth;
    const areaHeight = mapArea.clientHeight;
    const viewerBaseWidth = mapViewer.offsetWidth;
    const viewerBaseHeight = mapViewer.offsetHeight;
    if (viewerBaseWidth === 0) return;

    // --- [수정됨] JS가 직접 중앙 정렬을 계산하는 로직 복원 ---
    // 1. 크기 계산: 맵 뷰어의 가로 너비에 맞춤
    currentScale = areaWidth / viewerBaseWidth;

    // 2. 위치 계산: JS가 직접 중앙 위치를 계산하여 적용
    currentTranslateX = (areaWidth - viewerBaseWidth * currentScale) / 2;
    currentTranslateY = (areaHeight - viewerBaseHeight * currentScale) / 2;
    
    applyTransform();
}

// --- [수정됨] 계산의 기준점을 mapViewer로 변경하여 문제를 해결합니다. ---
function handleWheelZoom(event) {
    event.preventDefault();
    
    const zoomIntensity = 0.1;
    const direction = event.deltaY < 0 ? 1 : -1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale * (1 + direction * zoomIntensity)));
    
    // 2. 마우스 커서의 현재 위치 (맵 이미지 기준)
    const rect = mapViewer.getBoundingClientRect(); // <<< mapArea에서 mapViewer로 변경
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 3. 줌 하기 전, 마우스 커서 아래에 있는 원본 맵의 지점(앵커 포인트) 계산
    // (줌/패닝이 적용된 맵 위에서의 상대 마우스 위치) / 현재 줌 배율
    const pointX = (mouseX - currentTranslateX) / currentScale;
    const pointY = (mouseY - currentTranslateY) / currentScale;

    // 4. 새로운 맵 이동량 계산
    // (이전 코드에서 이 부분은 더 복잡하게 계산했지만, 기준점을 mapViewer로 바꾸면 계산이 훨씬 간단하고 정확해집니다)
    // 현재 이동량 + (앵커 포인트 * (이전 줌 배율 - 새로운 줌 배율))
    currentTranslateX = mouseX - pointX * newScale;
    currentTranslateY = mouseY - pointY * newScale;
    
    // 5. 줌 배율 업데이트
    currentScale = newScale;
    
    // 6. 계산된 새로운 위치와 배율을 동시에 적용
    applyTransform();
}
function handleMouseDown(event) {
    event.preventDefault();
    isPanning = true;
    mapArea.classList.add('panning');
    mapViewer.classList.add('panning-optimization'); // <<< [수정됨] 패닝 시작 시 최적화 클래스 추가
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
    mapViewer.classList.remove('panning-optimization'); // <<< [수정됨] 패닝 종료 시 최적화 클래스 제거
}

export function initMapControls() {
    fitMapToContainer();
    mapArea.addEventListener('wheel', handleWheelZoom, { passive: false });
    mapArea.addEventListener('mousedown', handleMouseDown);
    mapArea.addEventListener('mousemove', handleMouseMove);
    mapArea.addEventListener('mouseup', handleMouseUpOrLeave);
    mapArea.addEventListener('mouseleave', handleMouseUpOrLeave);
    window.addEventListener('resize', fitMapToContainer);
}

// --- UI Creation Functions ---

export function createFloorSelector(floors, currentFloorId, onFloorChange) {
    floorSelector.innerHTML = '';
    for (const floorId in floors) {
        const option = document.createElement('option');
        option.value = floorId;
        option.textContent = floors[floorId].name;
        if (floorId === currentFloorId) {
            option.selected = true;
        }
        floorSelector.appendChild(option);
    }
    floorSelector.addEventListener('change', () => onFloorChange(floorSelector.value));
}

export function createSiteSelector(sites, currentSiteId, onSiteChange) {
    siteSelector.innerHTML = '';
    for (const siteId in sites) {
        const option = document.createElement('option');
        option.value = siteId;
        option.textContent = sites[siteId].name;
        if (siteId === currentSiteId) {
            option.selected = true;
        }
        siteSelector.appendChild(option);
    }
    siteSelector.addEventListener('change', () => onSiteChange(siteSelector.value));
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
    mapViewer.style.backgroundImage = `url(${imageUrl})`;
    // fitMapToContainer(); // <<< [수정됨] 이 줄을 제거하여 뷰가 리셋되지 않도록 합니다.
}

export function displayStrategies(strategies = [], strategyTypes, activeFilters, currentFloorId) {
    mapViewer.innerHTML = '';
    const typeMap = new Map(strategyTypes.map(t => [t.id, t]));

    strategies.forEach(strategy => {
        if (strategy.floorId !== currentFloorId) return;
        if (!activeFilters.includes(strategy.type)) return;

        const typeInfo = typeMap.get(strategy.type);
        if (!typeInfo) return;

        const icon = document.createElement('img');
        icon.className = 'strategy-icon';
        icon.src = typeInfo.icon;

        // --- [수정됨] 크기와 회전 적용 로직 ---

        // 1. 크기 적용 (개별 전략 값 우선)
        icon.style.width = strategy.width || typeInfo.width;
        icon.style.height = strategy.height || typeInfo.height;

        // 2. 위치 적용
        icon.style.left = strategy.pos.x;
        icon.style.top = strategy.pos.y;

        // 3. Transform 적용 (중앙 정렬 + 개별 회전)
        let transformValue = 'translate(-50%, -50%)'; // 항상 중앙 정렬
        if (strategy.rotation) {
            transformValue += ` rotate(${strategy.rotation}deg)`;
        }
        icon.style.transform = transformValue;

        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            showModal(strategy.modalContent);
        });
        mapViewer.appendChild(icon);
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
        mapViewer.appendChild(labelEl);
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
        const mapRect = mapViewer.getBoundingClientRect();

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
            const originalMapWidth = mapViewer.offsetWidth;
            const originalMapHeight = mapViewer.offsetHeight;

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