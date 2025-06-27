const mapViewer = document.getElementById('map-viewer');
const siteSelector = document.getElementById('site-selector');
const filterCheckboxesContainer = document.getElementById('filter-checkboxes');
const modalContainer = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalMediaContent = document.getElementById('modal-media-content');

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

function showModal(content) {
    modalTitle.textContent = content.title;
    modalDescription.textContent = content.description;
    modalMediaContent.innerHTML = '';

    if (content.image) {
        const img = document.createElement('img');
        img.src = content.image;
        modalMediaContent.appendChild(img);
    } else if (content.youtubeId) {
        const iframe = document.createElement('iframe');
        iframe.width = "560";
        iframe.height = "315";
        iframe.src = `https://www.youtube.com/embed/${content.youtubeId}`;
        iframe.title = "YouTube video player";
        iframe.frameBorder = "0";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        modalMediaContent.appendChild(iframe);
    }

    modalContainer.classList.remove('hidden');
}

function hideModal() {
    modalContainer.classList.add('hidden');
    modalMediaContent.innerHTML = ''; // Stop video playback
}

// Attach event listeners for closing the modal
modalContainer.querySelector('.modal-close-btn').addEventListener('click', hideModal);
modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) {
        hideModal();
    }
});