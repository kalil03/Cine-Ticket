import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import Layout from '../components/Layout';
import MovieCard from '../components/movies/MovieCard';
import Button from '../components/ui/Button';
import { Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Filmes() {
  const router = useRouter();
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [showTMDBResults, setShowTMDBResults] = useState(false);
  const [tmdbResults, setTmdbResults] = useState([]);
  const [error, setError] = useState('');
  const searchInputRef = useRef(null);

  const focusSearchInput = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError('');

        let moviesData = [];

        try {
          const localMovies = await api.getMovies();

          if (!localMovies || localMovies.length === 0) {
            throw new Error('Banco local vazio (ou erro). Indo para TMDB...');
          }

          moviesData = localMovies.map(movie => {
            let posterPath = movie.posterPath || movie.imageUrl || null;
            if (posterPath) {
              if (!posterPath.startsWith('http')) {
                posterPath = `https://image.tmdb.org/t/p/w500${posterPath.startsWith('/') ? posterPath : '/' + posterPath}`;
              }
            }

            return {
              id: movie.tmdbId || movie.id,
              title: movie.title,
              overview: movie.synopsis || '',
              poster_path: posterPath,
              release_date: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : null,
              vote_average: movie.voteAverage || 0,
              adult: false,
              genre_ids: []
            };
          });
        } catch (localError) {
          console.warn('Erro ao carregar do banco local, tentando TMDB:', localError);
          try {
            const tmdbData = await api.getTMDBPopular(1);
            moviesData = tmdbData?.results || tmdbData?.data?.results || [];
          } catch (tmdbError) {
            throw new Error('Não foi possível carregar filmes. Verifique sua conexão.');
          }
        }

        if (moviesData.length === 0) {
          setError('Nenhum filme encontrado. Tente novamente mais tarde.');
        }

        setMovies(moviesData);
        setFilteredMovies(moviesData);

        try {
          const genresData = await api.getTMDBGenres();
          setGenres(genresData?.genres || genresData?.data?.genres || []);
        } catch (genresError) {
          console.warn('Erro ao carregar gêneros:', genresError);
        }

      } catch (error) {
        setError(error.message || 'Erro ao carregar filmes.');
        setMovies([]);
        setFilteredMovies([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = movies;

    if (searchQuery) {
      filtered = filtered.filter(movie =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.overview?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedGenre) {
      filtered = filtered.filter(movie => {
        if (movie.genre_ids) {
          return movie.genre_ids.includes(parseInt(selectedGenre));
        }
        return false;
      });
    }

    setFilteredMovies(filtered);
  }, [movies, searchQuery, selectedGenre]);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      const results = await api.searchTMDBMovies(searchQuery);
      setTmdbResults(results.results || []);
      setShowTMDBResults(true);
    } catch (error) {
      console.error('Erro ao buscar filmes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  return (
    <Layout title="Filmes - CineTicket">
      <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto min-h-screen">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Catálogo de Filmes</h1>
            <p className="text-gray-400">Explore os últimos lançamentos e clássicos do cinema</p>
          </div>

          {/* Search & Filter Bar */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-sm">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Buscar filmes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
                className="w-full sm:w-64 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 pl-10 py-2.5"
              />
            </form>

            <div className="h-px sm:h-auto sm:w-px bg-white/10" />

            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="appearance-none bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-primary transition-colors cursor-pointer w-full sm:w-48"
                >
                  <option value="" className="bg-gray-900">Todos os Gêneros</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id} className="bg-gray-900">
                      {genre.name}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {(searchQuery || selectedGenre || showTMDBResults) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('');
                    setShowTMDBResults(false);
                  }}
                  className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  title="Limpar Filtros"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-8 flex items-center justify-between"
            >
              <span>{error}</span>
              <button onClick={() => window.location.reload()} className="text-sm underline hover:text-white">
                Tentar novamente
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TMDB Results Section */}
        <AnimatePresence>
          {showTMDBResults && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-16"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="w-1 h-8 bg-primary rounded-full" />
                  Resultados da busca global
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowTMDBResults(false)}>
                  Fechar Resultados
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {tmdbResults.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>

              <div className="my-12 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {!showTMDBResults && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredMovies.length > 0 ? (
                  filteredMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum filme encontrado</h3>
                    <p className="text-gray-400">Tente ajustar seus filtros ou buscar por outro termo.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
