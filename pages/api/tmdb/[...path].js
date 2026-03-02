const TMDB_BASE = 'https://api.themoviedb.org/3';
const TOKEN =
    process.env.TMDB_ACCESS_TOKEN ||
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5NzlmNmU4YzBkMWYzMTg1Yjc5N2MyNTFhZTI2ZWMzYyIsIm5iZiI6MTc2MTE2NzM1NC4yOTc5OTk5LCJzdWIiOiI2OGY5NDdmYTlhNjU5MDM3ZjA2YjFhOGEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.6gD85Ct6U2E7lxnqvLy14MI83hsbU8bcS_c07qdbPuM';

const ROUTE_MAP = {
    popular: () => '/movie/popular',
    'now-playing': () => '/movie/now_playing',
    upcoming: () => '/movie/upcoming',
    'top-rated': () => '/movie/top_rated',
    featured: () => '/movie/popular',
    genres: () => '/genre/movie/list',
    search: () => '/search/movie',
    trending: (q) => `/trending/movie/${q.time_window || 'week'}`,
};

async function tmdbFetch(path, query = {}) {
    const params = new URLSearchParams({ language: 'pt-BR' });
    if (query.page) params.set('page', query.page);
    if (query.query) params.set('query', query.query);

    const res = await fetch(`${TMDB_BASE}${path}?${params}`, {
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error(`TMDB ${res.status}: ${res.statusText}`);
    return res.json();
}

export default async function handler(req, res) {
    const { path: segments, ...query } = req.query;
    const route = Array.isArray(segments) ? segments.join('/') : segments;

    try {
        // movie/:id
        if (segments[0] === 'movie' && segments[1]) {
            const params = new URLSearchParams({
                language: 'pt-BR',
                append_to_response: 'credits,videos,images',
            });
            const r = await fetch(`${TMDB_BASE}/movie/${segments[1]}?${params}`, {
                headers: { Authorization: `Bearer ${TOKEN}` },
            });
            const data = await r.json();
            return res.status(r.ok ? 200 : r.status).json(data);
        }

        const getPath = ROUTE_MAP[route];
        if (!getPath) return res.status(404).json({ error: `Rota TMDB não encontrada: ${route}` });

        const data = await tmdbFetch(getPath(query), query);
        res.json(data);
    } catch (err) {
        console.error('[TMDB API]', err.message);
        res.status(500).json({ error: err.message });
    }
}
