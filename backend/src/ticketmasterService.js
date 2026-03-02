const axios = require('axios');

class TicketmasterService {
  constructor() {
    if (!process.env.TICKETMASTER_API_KEY) {
      console.warn('⚠️  TICKETMASTER_API_KEY não configurada. Rotas Ticketmaster do backend retornarão erro.');
    }

    this.apiKey = process.env.TICKETMASTER_API_KEY || '';
    this.baseURL = 'https://app.ticketmaster.com/discovery/v2';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000
    });
  }


  buildParams(params = {}) {
    const query = {
      apikey: this.apiKey,
      sort: params.sort || 'date,asc',
      countryCode: 'BR'
    };

    if (params.keyword) query.keyword = params.keyword;
    if (params.city) query.city = params.city;
    if (params.stateCode) query.stateCode = params.stateCode;
    if (params.segmentName) query.segmentName = params.segmentName;
    if (params.classificationName) query.classificationName = params.classificationName;

    const page = Number.isFinite(parseInt(params.page)) ? parseInt(params.page) : 0;
    const size = Number.isFinite(parseInt(params.size)) ? parseInt(params.size) : 20;

    query.page = Math.max(0, page);
    query.size = Math.min(Math.max(size, 1), 100);

    return query;
  }

  async searchEvents(params = {}, verbose = false) {
    const query = this.buildParams(params);

    try {
      if (verbose) {
        console.log('🔍 TicketmasterService: Buscando eventos com parâmetros:', query);
      }

      const response = await this.client.get('/events.json', { params: query });

      if (verbose) {
        console.log('🔍 TicketmasterService: Resposta recebida:', {
          status: response.status,
          hasEmbedded: !!response.data?._embedded,
          keys: response.data ? Object.keys(response.data) : []
        });
      }

      return response.data;
    } catch (error) {
      this.logError('buscar eventos', error, verbose);
      throw error;
    }
  }

  async getEventDetails(eventId, verbose = false) {
    if (!eventId) {
      throw new Error('ticketmasterId é obrigatório');
    }

    try {
      if (verbose) {
        console.log(`🔍 TicketmasterService: Buscando detalhes do evento ${eventId}`);
      }

      const response = await this.client.get(`/events/${eventId}.json`, {
        params: {
          apikey: this.apiKey,
          locale: 'pt-br'
        }
      });

      return response.data;
    } catch (error) {
      this.logError(`buscar detalhes do evento ${eventId}`, error, verbose);
      throw error;
    }
  }

  logError(action, error, verbose = false) {
    console.error(`❌ TicketmasterService: Erro ao ${action}`);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', JSON.stringify(error.response.data, null, 2));
      if (verbose) {
        console.error('   Headers:', error.response.headers);
      }
    } else if (error.request) {
      console.error('   Request feito, mas sem resposta');
    } else {
      console.error('   Erro:', error.message);
    }
  }

  convertTicketmasterEventToLocal(ticketmasterEvent = {}) {
    const venue = ticketmasterEvent._embedded?.venues?.[0] || {};
    const addressParts = [
      venue.address?.line1,
      venue.address?.line2,
      venue.city?.name,
      venue.state?.stateCode || venue.state?.name,
      venue.postalCode
    ].filter(Boolean);

    const dateStart = ticketmasterEvent.dates?.start?.dateTime || ticketmasterEvent.dates?.start?.localDate;
    const dateEnd = ticketmasterEvent.dates?.end?.dateTime;

    const parseDate = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    };

    const pickImage = () => {
      const images = ticketmasterEvent.images || [];
      if (!images.length) return null;
      const preferred = images.find(img => img.ratio === '16_9' && img.width >= 1024);
      return (preferred || images[0]).url;
    };

    const priceRange = ticketmasterEvent.priceRanges?.[0];
    const price = typeof priceRange?.min === 'number'
      ? priceRange.min
      : (typeof priceRange?.max === 'number' ? priceRange.max : 0);

    const classification = ticketmasterEvent.classifications?.[0] || {};
    const category = classification.genre?.name || classification.segment?.name || 'Evento';

    const features = [
      classification.segment?.name,
      classification.genre?.name,
      classification.subGenre?.name,
      classification.type?.name
    ].filter(Boolean).join(', ');

    return {
      ticketmasterId: ticketmasterEvent.id || null,
      title: ticketmasterEvent.name || 'Evento sem título',
      description: this.cleanText(ticketmasterEvent.info || ticketmasterEvent.description || ''),
      date: parseDate(dateStart) || new Date(),
      endDate: parseDate(dateEnd),
      imageUrl: pickImage(),
      bannerUrl: pickImage(),
      price,
      location: venue.name || 'Local não informado',
      address: addressParts.join(', ') || venue.name || 'Endereço não informado',
      city: venue.city?.name || 'Cidade não informada',
      state: venue.state?.stateCode || venue.state?.name || 'Estado não informado',
      capacity: venue.capacity || 0,
      category,
      features,
      latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
      longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null
    };
  }

  cleanText(value) {
    if (!value) return '';
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = new TicketmasterService();
