import torrentStream from 'torrent-stream';

export default async function handler(req, res) {
    const { fileName } = req.query;
    const { magnet } = req.query;

    const engine = torrentStream(magnet);
    engine.on('ready', () => {
        const file = engine.files.find(f => f.name === fileName);
        if (file) {
            res.writeHead(200, {
                'Content-Type': 'video/mp4',
                'Content-Disposition': `inline; filename="${file.name}"`,
                'Cache-Control': 'no-store',
            });
            file.createReadStream().pipe(res);
        } else {
            res.status(404).json({ error: 'Arquivo não encontrado.' });
        }
    });
}
