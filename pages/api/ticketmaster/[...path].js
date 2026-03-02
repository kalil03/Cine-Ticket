const TM_BASE = 'https://app.ticketmaster.com/discovery/v2';
const API_KEY =
    process.env.TICKETMASTER_API_KEY || 'aWFDU04ikYPBa1G5RSNIwvA3JtPBUZI8';

export default async function handler(req, res) {
    const { path: segments = [], ...query } = req.query;
    const route = Array.isArray(segments) ? segments.join('/') : segments;

    const params = new URLSearchParams({ apikey: API_KEY, countryCode: 'BR' });

    // Repassar query params relevantes
    ['page', 'size', 'keyword', 'city', 'stateCode', 'segmentName', 'classificationName', 'sort'].forEach((k) => {
        if (query[k]) params.set(k, query[k]);
    });

    let tmPath;
    if (route === 'events' || route === '') {
        tmPath = '/events.json';
        if (!params.has('sort')) params.set('sort', 'date,asc');
        if (!params.has('size')) params.set('size', '100');
    } else if (route.startsWith('event/')) {
        const eventId = segments[1];
        tmPath = `/events/${eventId}.json`;
        params.set('locale', 'pt-br');
    } else {
        return res.status(404).json({ error: `Rota Ticketmaster não encontrada: ${route}` });
    }

    try {
        const r = await fetch(`${TM_BASE}${tmPath}?${params}`);
        const data = await r.json();
        res.status(r.ok ? 200 : r.status).json(data);
    } catch (err) {
        console.error('[Ticketmaster API]', err.message);
        res.status(500).json({ error: err.message });
    }
}
