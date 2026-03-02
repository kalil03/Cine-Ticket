const prisma = require('../prismaClient');

exports.getSessions = async (req, res) => {
    try {
        const sessions = await prisma.session.findMany({
            include: { movie: true, hall: true }
        });
        res.json(sessions);
    } catch (error) {
        console.error('getSessions error:', error.message);
        res.json([]); // DB não disponível
    }
};

exports.createAutoSessions = async (req, res) => {
    const { movieId } = req.body;
    if (!movieId) {
        return res.status(400).json({ error: 'movieId is required' });
    }

    try {
        const movie = await prisma.movie.findUnique({ where: { id: parseInt(movieId) } });
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        const halls = await prisma.hall.findMany();
        if (halls.length === 0) {
            return res.status(500).json({ error: 'No halls available to create sessions' });
        }

        const baseDate = new Date();
        baseDate.setHours(0, 0, 0, 0);

        const sessionsToCreate = [];
        const sessionConfigs = [
            { hour: 15, minute: 30, language: 'Dublado', price: 32.5 },
            { hour: 19, minute: 45, language: 'Legendado', price: 34.9 },
            { hour: 13, minute: 0, language: 'Dublado', price: 30.0 },
            { hour: 21, minute: 0, language: 'Legendado', price: 38.0 }
        ];

        // Check existing sessions
        const existingSessions = await prisma.session.findMany({
            where: { movieId: parseInt(movieId) }
        });

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const targetDate = new Date(baseDate);
            targetDate.setDate(baseDate.getDate() + dayOffset);

            const hasSessionForDay = existingSessions.some((session) => {
                const sessionDate = new Date(session.startsAt);
                sessionDate.setHours(0, 0, 0, 0);
                return sessionDate.getTime() === targetDate.getTime();
            });

            if (!hasSessionForDay) {
                // Create 2 sessions per day for this movie
                for (let i = 0; i < 2; i++) {
                    const config = sessionConfigs[(dayOffset + i) % sessionConfigs.length];
                    const hall = halls[(dayOffset + i) % halls.length]; // Rotate halls

                    const startsAt = new Date(targetDate);
                    startsAt.setHours(config.hour, config.minute, 0, 0);

                    sessionsToCreate.push({
                        movieId: parseInt(movieId),
                        hallId: hall.id,
                        startsAt,
                        price: config.price,
                        language: config.language
                    });
                }
            }
        }

        if (sessionsToCreate.length > 0) {
            await prisma.session.createMany({ data: sessionsToCreate });
        }

        const allSessions = await prisma.session.findMany({
            where: { movieId: parseInt(movieId) },
            include: { movie: true, hall: true }
        });

        res.json(allSessions);

    } catch (error) {
        console.error('Error creating auto sessions:', error);
        res.status(500).json({ error: 'Error creating sessions' });
    }
};
