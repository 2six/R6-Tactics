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

// Zoom Control Variables
let currentScale = 1;
const MIN_SCALE = 0.2; // 최소 축소 배율
const MAX_SCALE = 4.0; // 최대 확대 배율

// --- Map Control Functions ---

function fitMapToContainer() {
    const areaWidth = mapArea.clientWidth;
    const areaHeight = mapArea.clientHeight;
    
    // CSS에 정의된 맵의 원본 크기
    const viewerBaseWidth = mapViewer.offsetWidth;
    const viewerBaseHeight = mapViewer.offsetHeight;

    if (viewerBaseWidth === 0 || viewerBaseHeight === 0) return;

    const scaleX = areaWidth / viewerBaseWidth;
    const scaleY = areaHeight / viewerBaseHeight;
    
    currentScale = Math.min(scaleX, scaleY) * 0.95; // 약간의 여백을 위해 95%
    mapViewer.style.transform = `scale(${currentScale})`;
}

function handleWheelZoom(event) {
    event.preventDefault(); // 페이지 전체 스크롤 방지
    
    const zoomIntensity = 0.1;
    const direction = event.deltaY < 0 ? 1 : -1; // 휠 업 = 확대, 휠 다운 = 축소
    
    currentScale += direction * zoomIntensity * currentScale; // 현재 배율에 비례하여 줌 속도 조절
    currentScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale)); // 최소/최대 배율 제한
    
    mapViewer.style.transform = `scale(${currentScale})`;
}

export function initMapControls() {
    fitMapToContainer();
    mapArea.addEventListener('wheel', handleWheelZoom, { passive: false });
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
}

export function displayStrategies(strategies, strategyTypes, activeFilters) {
    mapViewer.innerHTML = '';
    const typeMap = new Map(strategyTypes.map(t => [t.id, t]));

    strategies.forEach(strategy => {
        if (!activeFilters.includes(strategy.type)) {
            return;
        }

        const typeInfo = typeMap.get(strategy.type);
        if (!typeInfo) return;

        const icon = document.createElement('img');
        icon.className = 'strategy-icon';
        icon.src = typeInfo.icon;
        icon.style.left = strategy.pos.x;
        icon.style.top = strategy.pos.y;
        icon.addEventListener('click', () => showModal(strategy.modalContent));
        
        mapViewer.appendChild(icon);
    });
}


// --- Modal Functions ---

function showModal(content) {
    modalTitle.textContent = content.title;
    modalDescription.textContent = content.description;

    // 초기화
    modalImageWrapper.innerHTML = '';
    modalYoutubeWrapper.innerHTML = '';
    modalToggleContainer.classList.add('hidden');

    const hasImage = content.image;
    const hasYoutube = content.youtubeId;

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
        // 기본으로 이미지 표시
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

function hideModal() {
    modalContainer.classList.add('hidden');
    // 비디오 재생 중지를 위해 wrapper의 내용을 비움
    modalImageWrapper.innerHTML = '';
    modalYoutubeWrapper.innerHTML = '';
}

function handleMediaToggle(event) {
    const button = event.target.closest('button');
    if (!button) return;

    const mediaType = button.dataset.media;
    
    if (mediaType === 'image') {
        modalImageWrapper.classList.remove('hidden');
        modalYoutubeWrapper.classList.add('hidden');
        modalToggleContainer.querySelector('[data-media="image"]').classList.add('active');
        modalToggleContainer.querySelector('[data-media="youtube"]').classList.remove('active');
    } else if (mediaType === 'youtube') {
        modalImageWrapper.classList.add('hidden');
        modalYoutubeWrapper.classList.remove('hidden');
        modalToggleContainer.querySelector('[data-media="image"]').classList.remove('active');
        modalToggleContainer.querySelector('[data-media="youtube"]').classList.add('active');
    }
}

// Attach event listeners for closing the modal
modalContainer.querySelector('.modal-close-btn').addEventListener('click', hideModal);
modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) {
        hideModal();
    }
});
modalToggleContainer.addEventListener('click', handleMediaToggle);