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
    if (viewerBaseWidth === 0 || viewerBaseHeight === 0) return;
    const scaleX = areaWidth / viewerBaseWidth;
    const scaleY = areaHeight / viewerBaseHeight;
    currentScale = Math.min(scaleX, scaleY) * 0.95;
    currentTranslateX = (areaWidth - viewerBaseWidth * currentScale) / 2;
    currentTranslateY = (areaHeight - viewerBaseHeight * currentScale) / 2;
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
    fitMapToContainer();
}

export function displayStrategies(strategies, strategyTypes, activeFilters) {
    mapViewer.innerHTML = '';
    const typeMap = new Map(strategyTypes.map(t => [t.id, t]));
    strategies.forEach(strategy => {
        if (!activeFilters.includes(strategy.type)) return;
        const typeInfo = typeMap.get(strategy.type);
        if (!typeInfo) return;
        const icon = document.createElement('img');
        icon.className = 'strategy-icon';
        icon.src = typeInfo.icon;
        
        // --- [수정됨] 아이콘 크기 적용 ---
        if (typeInfo.width) {
            icon.style.width = typeInfo.width;
        }
        if (typeInfo.height) {
            icon.style.height = typeInfo.height;
        }

        icon.style.left = strategy.pos.x;
        icon.style.top = strategy.pos.y;
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

        // --- [수정됨] 라벨 폰트 크기 및 회전 적용 ---
        if (label.fontSize) {
            labelEl.style.fontSize = label.fontSize;
        }
        
        // 기본 위치 조정과 회전을 함께 적용
        let transformValue = 'translate(-50%, -50%)';
        if (label.rotation) {
            transformValue += ` rotate(${label.rotation}deg)`;
        }
        labelEl.style.transform = transformValue;

        mapViewer.appendChild(labelEl);
    });
}

// --- Modal Functions ---

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
        const imgBtn = modalToggleContainer.querySelector('[data-media="image"]');
        const ytBtn = modalToggleContainer.querySelector('[data-media="youtube"]');
        imgBtn.classList.add('active');
        ytBtn.classList.remove('active');
        modalImageWrapper.classList.remove('hidden');
        modalYoutubeWrapper.classList.add('hidden');
    } else if (hasImage) {
        modalImageWrapper.classList.remove('hidden');
        modalYoutubeWrapper.classList.add('hidden');
    } else if (hasYoutube) {
        modalImageWrapper.classList.add('hidden');
        modalYoutubeWrapper.classList.remove('hidden');
    }
    modalContainer.classList.remove('hidden');
}

function hideModal() {
    modalContainer.classList.add('hidden');
    modalImageWrapper.innerHTML = '';
    modalYoutubeWrapper.innerHTML = '';
}

function handleMediaToggle(event) {
    const button = event.target.closest('button');
    if (!button) return;
    const mediaType = button.dataset.media;
    modalToggleContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    if (mediaType === 'image') {
        modalImageWrapper.classList.remove('hidden');
        modalYoutubeWrapper.classList.add('hidden');
    } else if (mediaType === 'youtube') {
        modalImageWrapper.classList.add('hidden');
        modalYoutubeWrapper.classList.remove('hidden');
    }
}

modalContainer.querySelector('.modal-close-btn').addEventListener('click', hideModal);
modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) {
        hideModal();
    }
});
modalToggleContainer.addEventListener('click', handleMediaToggle);