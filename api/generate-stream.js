import torrentStream from 'torrent-stream';
import { MongoClient } from 'mongodb';

// Conexão com MongoDB (via variável de ambiente para segurança)
const mongoURI = process.env.MONGO_URI; // Defina sua URL MongoDB via variável de ambiente
const client = new MongoClient(mongoURI);
let db;

async function connectToDB() {
    if (!db) {
        await client.connect();
        db = client.db('torrentStreamDB');
        console.log('Conectado ao banco de dados MongoDB');
    }
    return db;
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { magnet } = req.query;
        if (!magnet) {
            return res.status(400).json({ status: 'error', message: 'Magnet link é obrigatório' });
        }

        const episodes = [];
        const movies = [];

        const db = await connectToDB();

        const episodesCollection = db.collection('episodes');
        const moviesCollection = db.collection('movies');

        const existingEpisodes = await episodesCollection.find({ magnetLink: magnet }).toArray();
        if (existingEpisodes.length > 0) {
            return res.json({ status: 'success', episodes: existingEpisodes });
        }

        const engine = torrentStream(magnet);
        engine.on('ready', async () => {
            const files = engine.files.filter(file => /S\d{2}E\d{2}/.test(file.name) && (file.name.endsWith('.mp4') || file.name.endsWith('.mkv')));
            const movieFiles = engine.files.filter(file => !/S\d{2}E\d{2}/.test(file.name) && (file.name.endsWith('.mp4') || file.name.endsWith('.mkv')));

            // Processando episódios
            for (const file of files) {
                const season = parseInt(file.name.match(/S(\d{2})/)[1]);
                const episodeIndex = parseInt(file.name.match(/E(\d{2})/)[1]);
                const streamUrl = `https://<your-vercel-app-url>/api/stream/${encodeURIComponent(file.name)}?magnet=${encodeURIComponent(magnet)}`;
                episodes.push({
                    episode: file.name,
                    streamUrl,
                    season,
                    episodeIndex
                });

                await episodesCollection.insertOne({
                    magnetLink: magnet,
                    episodeName: file.name,
                    streamUrl,
                    season,
                    episodeIndex
                });
            }

            // Processando filmes
            for (const file of movieFiles) {
                const streamUrl = `https://<your-vercel-app-url>/api/stream/${encodeURIComponent(file.name)}?magnet=${encodeURIComponent(magnet)}`;
                const embedUrl = `https://<your-vercel-app-url>/api/embed/${encodeURIComponent(file.name)}?magnet=${encodeURIComponent(magnet)}`;
                const iframeUrl = `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

                movies.push({
                    movieName: file.name,
                    streamUrl,
                    embedUrl,
                    iframeUrl
                });

                await moviesCollection.insertOne({
                    magnetLink: magnet,
                    movieName: file.name,
                    streamUrl,
                    embedUrl,
                    iframeUrl
                });
            }

            res.json({
                status: 'success',
                episodes,
                movies
            });
        });

        engine.on('error', (err) => {
            console.error('Erro no torrent:', err);
            res.status(500).json({ status: 'error', message: 'Erro ao processar o magnet link.' });
        });
    } else {
        res.status(405).json({ status: 'error', message: 'Método não permitido' });
    }
}
