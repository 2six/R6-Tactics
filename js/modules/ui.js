const mapArea = document.querySelector('.map-area');
const mapViewer = document.getElementById('map-viewer');
const siteSelector = document.getElementById('site-selector');
const filterCheckboxesContainer = document.getElementById('filter-checkboxes');

// Modal Elements
const modalContainer = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalToggleContainer = document.getElementById('modal-toggle-container');
const modalImageWrapper = document.getElementById('modal-image-wrapper');
const modalYoutubeWrapper = document.getElementById('modal-youtube-wrapper');

// --- Map Control Variables ---
let currentScale = 1;
const MIN_SCALE = 0.5; // 최소 축소 배율
const MAX_SCALE = 8.0; // 최대 확대 배율
let currentTranslateX = 0, currentTranslateY = 0;
let isPanning = false;
let startX, startY, startTranslateX, startTranslateY;

// --- Map Control Functions ---

function applyTransform() {
    // 줌과 패닝을 한 번에 적용
    mapViewer.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
}

function fitMapToContainer() {
    const areaWidth = mapArea.clientWidth;
    const areaHeight = mapArea.clientHeight;
    
    const viewerBaseWidth = mapViewer.offsetWidth;
    const viewerBaseHeight = mapViewer.offsetHeight;

    if (viewerBaseWidth === 0 || viewerBaseHeight === 0) return;

    const scaleX = areaWidth / viewerBaseWidth;
    const scaleY = areaHeight / viewerBaseHeight;
    
    currentScale = Math.min(scaleX, scaleY) * 0.95; // 95%로 약간의 여백
    
    // 맵을 중앙에 위치시키기 위한 초기 translate 값 계산
    currentTranslateX = (areaWidth - viewerBaseWidth * currentScale) / 2;
    currentTranslateY = (areaHeight - viewerBaseHeight * currentScale) / 2;

    applyTransform();
}

function handleWheelZoom(event) {
    event.preventDefault();
    
    const zoomIntensity = 0.1;
    const direction = event.deltaY < 0 ? 1 : -1;
    
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale * (1 + direction * zoomIntensity)));
    
    // 마우스 포인터 위치를 기준으로 줌
    const rect = mapArea.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 현재 마우스 포인터가 맵의 어느 지점을 가리키는지 계산
    const pointX = (mouseX - currentTranslateX) / currentScale;
    const pointY = (mouseY - currentTranslateY) / currentScale;

    // 새로운 translate 값 계산
    currentTranslateX = mouseX - pointX * newScale;
    currentTranslateY = mouseY - pointY * newScale;
    currentScale = newScale;
    
    applyTransform();
}

function handleMouseDown(event) {
    event.preventDefault();
    isPanning = true;
    mapArea.classList.add('panning');
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

export function createSiteSelector(sites, currentSiteId, onSiteChange) {
    // (기존 코드와 동일)
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
    // (기존 코드와 동일)
    filterCheckboxesContainer.innerHTML = '';
    strategyTypes.forEach(type => {
        const div = document.createElement('div');
        div.className = 'filter-checkbox';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `filter-${type.id}`;
        input.value = type.id;
        input.checked = true;
        const label = document.createElement('label');
        label.htmlFor = `filter-${type.id}`;
        label.textContent = type.label;
        div.appendChild(input);
        div.appendChild(label);
        filterCheckboxesContainer.appendChild(div);
    });
    filterCheckboxesContainer.addEventListener('change', onFilterChange);
}

export function updateMapBackground(imageUrl) {
    mapViewer.style.backgroundImage = `url(${imageUrl})`;
    // 맵이 바뀔 때마다 줌/패닝 리셋 및 피팅
    fitMapToContainer();
}

export function displayStrategies(strategies, strategyTypes, activeFilters) {
    mapViewer.innerHTML = ''; // 기존 아이콘과 라벨 모두 초기화
    const typeMap = new Map(strategyTypes.map(t => [t.id, t]));

    strategies.forEach(strategy => {
        if (!activeFilters.includes(strategy.type)) return;

        const typeInfo = typeMap.get(strategy.type);
        if (!typeInfo) return;

        const icon = document.createElement('img');
        icon.className = 'strategy-icon';
        icon.src = typeInfo.icon;
        icon.style.left = strategy.pos.x;
        icon.style.top = strategy.pos.y;
        icon.addEventListener('click', (e) => {
            e.stopPropagation(); // 아이콘 클릭이 맵 패닝으로 이어지지 않도록 함
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
        mapViewer.appendChild(labelEl);
    });
}


// --- Modal Functions --- (기존 코드와 대부분 동일)
function showModal(content) {
    modalTitle.textContent = content.title;
    modalDescription.textContent = content.description;
    modalImageWrapper.innerHTML = '';
    modalYoutubeWrapper.innerHTML = '';
    modalToggleContainer.classList.add('hidden');
    const hasImage = content.image, hasYoutube = content.youtubeId;

    if (hasImage) {
        const img = document.createElement('img');
        img.src = content.image;
        modalImageWrapper.appendChild(img);
    }
    if (hasYoutube) {
        const iframe = document.createElement('iframe');
        iframe.width = "560";
        iframe.height = "315";
        iframe.src = `https://www.youtube.com/embed/${content.youtubeId}`;
        iframe.title = "YouTube video player";
        iframe.frameBorder = "0";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        modalYoutubeWrapper.appendChild(iframe);
    }
    if (hasImage && hasYoutube) {
        modalToggleContainer.classList.remove('hidden');
        modalImageWrapper.classList.remove('hidden');
        modalYoutubeWrapper.classList.add('hidden');
        modalToggleContainer.querySelector('[data-media="image"]').classList.add('active');
        modalToggleContainer.querySelector('[data-media="youtube"]').classList.remove('active');
    } else if (hasImage) {
        modalImageWrapper.classList.remove('hidden');
        modalYoutubeWrapper.classList.add('hidden');
    } else if (hasYoutube) {
        modalImageWrapper.classList.add('hidden');
        modalYoutubeWrapper.classList.remove('hidden');
    }
    modalContainer.classList.remove('hidden');
}

function hideModal() { /* (기존 코드와 동일) */ }
function handleMediaToggle(event) { /* (기존 코드와 동일) */ }

modalContainer.querySelector('.modal-close-btn').addEventListener('click', hideModal);
modalContainer.addEventListener('click', (e) => { if (e.target === modalContainer) hideModal(); });
modalToggleContainer.addEventListener('click', handleMediaToggle);