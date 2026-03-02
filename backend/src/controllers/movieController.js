const prisma = require('../prismaClient');
const tmdbService = require('../tmdbService');

exports.getMovies = async (req, res) => {
    try {
        const movies = await prisma.movie.findMany();
        res.json(movies);
    } catch (error) {
        console.error('getMovies error:', error.message);
        res.json([]); // DB não disponível, retorna vazio
    }
};

exports.getMovieById = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id);
        const movie = await prisma.movie.findFirst({
            where: {
                OR: [
                    { id: parsedId },
                    { tmdbId: parsedId }
                ]
            }
        });
        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        res.json(movie);
    } catch (error) {
        console.error('getMovieById error:', error.message);
        res.status(404).json({ error: 'Movie not found' }); // Tratar como não encontrado
    }
};

exports.syncTmdb = async (req, res) => {
    try {
        const { tmdbId } = req.body;
        const movie = await tmdbService.getMovieDetails(tmdbId);
        // Save to DB logic here if needed, or just return
        res.json(movie);
    } catch (error) {
        res.status(500).json({ error: 'Error syncing TMDB' });
    }
};
