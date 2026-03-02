const prisma = require('../prismaClient');

exports.getCinemas = async (req, res) => {
    try {
        const cinemas = await prisma.cinema.findMany();
        res.json(cinemas);
    } catch (error) {
        console.error('getCinemas error:', error.message);
        res.json([]); // DB não disponível
    }
};

exports.createCinema = async (req, res) => {
    try {
        const cinema = await prisma.cinema.create({ data: req.body });
        res.json(cinema);
    } catch (error) {
        res.status(500).json({ error: 'Error creating cinema' });
    }
};
