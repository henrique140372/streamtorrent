// Função para gerar links de stream a partir do Magnet Link
function generateStream() {
    const magnetLink = document.getElementById("magnet-link").value;
    if (!magnetLink) {
        alert("Por favor, insira um Magnet Link válido.");
        return;
    }

    // Exibir spinner de carregamento
    document.getElementById('loading-spinner').style.display = 'block';

    // Requisição fetch para o servidor backend
    fetch(`/api/generate-stream?magnet=${encodeURIComponent(magnetLink)}`)
        .then(response => response.json())
        .then(data => {
            // Ocultar spinner de carregamento
            document.getElementById('loading-spinner').style.display = 'none';
            if (data.status === 'success') {
                if (data.episodes && data.episodes.length > 0) {
                    displayEpisodes(data.episodes, "Episódios");
                }
                if (data.movies && data.movies.length > 0) {
                    displayEpisodes(data.movies, "Filmes");
                }
            } else {
                document.getElementById('error-message').style.display = 'block';
            }
        })
        .catch(error => {
            // Exibir erro e esconder o spinner
            document.getElementById('loading-spinner').style.display = 'none';
            document.getElementById('error-message').style.display = 'block';
            console.error('Erro ao gerar o stream:', error);
        });
}

// Função para exibir episódios ou filmes
function displayEpisodes(items, type) {
    const episodeList = document.getElementById("episode-list");
    episodeList.innerHTML = '';

    items.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('episode-item');
        
        let displayText = item.movieName || item.episodeName;
        if (item.season && item.episodeIndex) {
            displayText = `Temporada ${item.season}, Episódio ${item.episodeIndex}: ${item.episodeName}`;
        }

        li.textContent = displayText;

        // Links para iframe e embed
        const iframeLink = `<iframe src="${item.streamUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
        const embedLink = `<embed src="${item.streamUrl}" width="640" height="360" type="video/mp4">`;

        const iframeButton = document.createElement('button');
        iframeButton.classList.add('copy-button');
        iframeButton.textContent = 'Copiar Link iframe';
        iframeButton.onclick = () => copyToClipboard(iframeLink);

        const embedButton = document.createElement('button');
        embedButton.classList.add('copy-button');
        embedButton.textContent = 'Copiar Link embed';
        embedButton.onclick = () => copyToClipboard(embedLink);

        const copyButtonContainer = document.createElement('div');
        copyButtonContainer.classList.add('copy-button-container');
        copyButtonContainer.appendChild(iframeButton);
        copyButtonContainer.appendChild(embedButton);

        li.appendChild(copyButtonContainer);

        const watchButton = document.createElement('button');
        watchButton.classList.add('copy-button');
        watchButton.textContent = 'Assistir';
        watchButton.onclick = () => openModal(item.streamUrl);
        li.appendChild(watchButton);

        episodeList.appendChild(li);
    });
}

// Função para abrir o modal de vídeo
function openModal(streamUrl) {
    const modal = document.getElementById("video-modal");
    const videoPlayer = document.getElementById("video-player");
    videoPlayer.src = streamUrl;
    modal.style.display = 'flex';
}

// Função para fechar o modal
function closeModal() {
    const modal = document.getElementById("video-modal");
    const videoPlayer = document.getElementById("video-player");
    videoPlayer.src = '';
    modal.style.display = 'none';
}

// Função para copiar link para a área de transferência
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert('Link copiado!'))
        .catch(err => alert('Erro ao copiar link: ', err));
}

// Função para copiar link do vídeo
function copyVideoLink() {
    const videoLink = document.getElementById("video-player").src;
    if (videoLink) {
        copyToClipboard(videoLink);
    }
}
