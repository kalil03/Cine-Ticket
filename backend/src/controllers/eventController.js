const prisma = require('../prismaClient');

exports.getEvents = async (req, res) => {
    try {
        const events = await prisma.event.findMany();
        res.json(events);
    } catch (error) {
        console.error('getEvents error:', error.message);
        res.json([]); // DB não disponível
    }
};

exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await prisma.event.findUnique({ where: { id: parseInt(id) } });
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    } catch (error) {
        console.error('getEventById error:', error.message);
        res.status(404).json({ error: 'Event not found' });
    }
};

exports.syncTicketmaster = async (req, res) => {
    res.json({ message: 'Sync not implemented' });
};
