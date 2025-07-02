// 데이터를 불러오는 범용 함수
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

// 맵 카드를 생성하고 화면에 표시하는 함수
function createMapCards(maps) {
    const gridContainer = document.getElementById('map-grid-container');
    if (!gridContainer) return;

    gridContainer.innerHTML = ''; // 컨테이너 비우기

    maps.forEach(map => {
        // 카드 링크 생성
        const cardLink = document.createElement('a');
        cardLink.href = map.path;
        cardLink.className = 'map-card';

        // 썸네일 이미지 생성
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = map.thumbnail;
        thumbnailImg.alt = map.name;
        thumbnailImg.className = 'map-card-thumbnail';

        // 맵 이름 오버레이 생성
        const mapName = document.createElement('div');
        mapName.className = 'map-card-name';
        mapName.textContent = map.name;

        // 요소들을 카드 링크에 추가
        cardLink.appendChild(thumbnailImg);
        cardLink.appendChild(mapName);
        
        // 완성된 카드를 그리드 컨테이너에 추가
        gridContainer.appendChild(cardLink);
    });
}

// 페이지가 로드되면 실행되는 메인 함수
async function init() {
    const config = await fetchData('/config.json');
    if (config && config.maps) {
        createMapCards(config.maps);
    } else {
        const gridContainer = document.getElementById('map-grid-container');
        if(gridContainer) {
            gridContainer.innerHTML = '<p>맵 목록을 불러오는 데 실패했습니다. config.json 파일을 확인해주세요.</p>';
        }
    }
}

// DOM이 완전히 로드된 후 init 함수 실행
document.addEventListener('DOMContentLoaded', init);