const express = require('express');
const cors = require('cors');
const app = express();

require('dotenv').config();

app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth.routes');
const ticketmasterRoutes = require('./routes/ticketmaster.routes');
const movieRoutes = require('./routes/movies.routes');
const eventRoutes = require('./routes/events.routes');
const sessionRoutes = require('./routes/sessions.routes');
const ticketRoutes = require('./routes/tickets.routes'); // Handled specially
const paymentRoutes = require('./routes/payment.routes');
const tmdbRoutes = require('./routes/tmdb.routes');
const cinemaRoutes = require('./routes/cinemas.routes');
const ticketController = require('./controllers/ticketController'); // Direct import for root paths

// Use Routes
app.use('/auth', authRoutes);
app.use('/ticketmaster', ticketmasterRoutes);
app.use('/movies', movieRoutes);
app.use('/events', eventRoutes);
app.use('/sessions', sessionRoutes);
app.use('/payment', paymentRoutes);
app.use('/tmdb', tmdbRoutes);
app.use('/cinemas', cinemaRoutes);

// Special handling for /purchase and /purchase-event and /user routes
// Frontend calls /purchase, /purchase-event directly
app.post('/purchase', ticketController.purchaseTicket);
app.post('/purchase-event', ticketController.purchaseEventTicket);
app.get('/user/:userId/tickets', ticketController.getUserTickets);
app.get('/user/:userId/event-tickets', ticketController.getUserEventTickets);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Força a porta 3001 independente da variável PORT global (para usar com Next.js no mesmo container)
const PORT = 3001;

app.listen(PORT, () => {
    console.log(`✅ Backend Express rodando internamente na porta ${PORT}`);
});
