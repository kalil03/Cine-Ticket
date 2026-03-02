const getBaseURL = () => {
  if (typeof window === 'undefined') {
    // Server-side (SSR): chama o backend diretamente
    return process.env.INTERNAL_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
  }

  // Client-side: usa proxy do Next.js para evitar CORS e não expor URL do backend
  return '/api-backend';
};

const API_BASE_URL = getBaseURL();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        // Não logar 404 como erro crítico (pode ser esperado)
        if (response.status === 404) {
          // Silenciar 404s - são esperados em alguns casos
        } else {
          console.error('API Error:', error);
        }
        throw error;
      }

      return await response.json();
    } catch (error) {
      // Só logar se não for um 404 (que pode ser esperado)
      const isNotFound = error.message?.includes('404') ||
        error.message?.includes('Not Found') ||
        error.message?.includes('not found');

      if (!isNotFound) {
        console.error('API Error:', error);
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  // Movies endpoints
  async getMovies() {
    return this.request('/movies');
  }

  async getMovie(id) {
    return this.request(`/movies/${id}`);
  }

  async createMovie(movieData) {
    return this.request('/movies', {
      method: 'POST',
      body: JSON.stringify(movieData),
    });
  }

  // Cinemas endpoints
  async getCinemas() {
    return this.request('/cinemas');
  }

  async createCinema(cinemaData) {
    return this.request('/cinemas', {
      method: 'POST',
      body: JSON.stringify(cinemaData),
    });
  }

  // Events endpoints
  async getEvents() {
    return this.request('/events');
  }

  async getEvent(id) {
    return this.request(`/events/${id}`);
  }

  async createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  // Sessions endpoints
  async getSessions() {
    return this.request('/sessions');
  }

  async createSession(sessionData) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Tickets endpoints
  async purchaseTicket(userId, sessionId, seatId) {
    return this.request('/purchase', {
      method: 'POST',
      body: JSON.stringify({ userId, sessionId, seatId }),
    });
  }

  // Payment endpoints
  async processPayment(userId, method, totalAmount, paymentData, ticketDetails) {
    return this.request('/payment/process', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        method,
        totalAmount,
        paymentData,
        ticketDetails
      }),
    });
  }

  async getUserTickets(userId) {
    return this.request(`/user/${userId}/tickets`);
  }

  async getUserEventTickets(userId) {
    return this.request(`/user/${userId}/event-tickets`);
  }

  async purchaseEventTicket(userId, eventId, price, ticketType, seatNumber = null) {
    return this.request('/purchase-event', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        eventId,
        price,
        ticketType,
        seatNumber
      }),
    });
  }

  // TMDB endpoints
  async getTMDBPopular(page = 1) {
    return this.request(`/tmdb/popular?page=${page}`);
  }

  async getTMDBNowPlaying(page = 1) {
    return this.request(`/tmdb/now-playing?page=${page}`);
  }

  async getTMDBUpcoming(page = 1) {
    return this.request(`/tmdb/upcoming?page=${page}`);
  }

  async getTMDBTopRated(page = 1) {
    return this.request(`/tmdb/top-rated?page=${page}`);
  }

  async getTMDBTrending(page = 1, timeWindow = 'week') {
    return this.request(`/tmdb/trending?page=${page}&time_window=${timeWindow}`);
  }

  async getTMDBFeatured() {
    return this.request('/tmdb/featured');
  }

  async searchTMDBMovies(query, page = 1) {
    return this.request(`/tmdb/search?query=${encodeURIComponent(query)}&page=${page}`);
  }

  async getTMDBGenres() {
    return this.request('/tmdb/genres');
  }

  async getTMDBMovieDetails(id) {
    return this.request(`/tmdb/movie/${id}`);
  }

  async syncTMDBMovie(tmdbId) {
    return this.request('/movies/sync-tmdb', {
      method: 'POST',
      body: JSON.stringify({ tmdbId }),
    });
  }

  async syncPopularMovies(limit = 20) {
    return this.request('/movies/sync-popular', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
  }

  async syncNowPlayingMovies(limit = 15) {
    return this.request('/movies/sync-now-playing', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
  }

  async createAutoSessions(movieId) {
    return this.request('/sessions/auto-create', {
      method: 'POST',
      body: JSON.stringify({ movieId }),
    });
  }

  // Ticketmaster endpoints
  async getTicketmasterEvents(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page);
    if (params.size !== undefined) queryParams.append('size', params.size);
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.city) queryParams.append('city', params.city);
    if (params.stateCode) queryParams.append('stateCode', params.stateCode);
    if (params.segmentName) queryParams.append('segmentName', params.segmentName);
    if (params.classificationName) queryParams.append('classificationName', params.classificationName);
    if (params.sort) queryParams.append('sort', params.sort);

    const queryString = queryParams.toString();
    return this.request(`/ticketmaster/events${queryString ? `?${queryString}` : ''}`);
  }

  async getTicketmasterEventDetails(id) {
    return this.request(`/ticketmaster/event/${id}`);
  }

  async syncTicketmasterEvent(ticketmasterId) {
    return this.request('/events/sync-ticketmaster', {
      method: 'POST',
      body: JSON.stringify({ ticketmasterId }),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();
