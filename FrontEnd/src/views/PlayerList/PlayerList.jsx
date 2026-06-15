import './PlayerList.css';
import FifaPlayerCard from '../../components/PlayerCard/PlayerCard.jsx';
import PositionFilter from '../../components/PositionFilter/PositionFilter.jsx';
import { useState, useEffect } from 'react';
import { getPlayerImageUrl } from '../../utils/imageUtils';
import { fetchPublicPlayers } from '../../services/playerService';

const PlayerList = () => {
    const [players, setPlayers] = useState([]);
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState('');
    const [selectedSaleStatus, setSelectedSaleStatus] = useState('');
    const [availablePositions, setAvailablePositions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                setLoading(true);
                const data = await fetchPublicPlayers();

                const mappedPlayers = data.map(player => ({
                    id: player.id ?? '',
                    name: player.name ?? '',
                    lastName: player.lastName ?? '',
                    position: player.position ?? '',
                    rating: player.rating ?? 0,
                    characteristics: player.characteristics
                        ? Array.isArray(player.characteristics)
                            ? player.characteristics
                            : player.characteristics.split(',').map(c => c.trim())
                        : [],
                    price: player.price ?? 0,
                    isForSale: player.isForSale ?? false,
                    image: getPlayerImageUrl(player),
                    owner: {
                        id: player.ownerId,
                        clubName: player.clubName,
                        username: player.ownerName
                    }
                }));

                setPlayers(mappedPlayers);
                setFilteredPlayers(mappedPlayers);

                const uniquePositions = [...new Set(mappedPlayers.map(p => p.position))];
                setAvailablePositions(uniquePositions);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPlayers();
    }, []);

    // Efecto para aplicar filtros y búsqueda
    useEffect(() => {
        let filtered = players;

        // Filtro por nombre
        if (searchTerm.trim() !== '') {
            const term = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(p =>
                (p.name + ' ' + (p.lastName || '')).toLowerCase().includes(term)
            );
        }

        // Filtrar por posición
        if (selectedPosition !== '') {
            filtered = filtered.filter(p => p.position === selectedPosition);
        }

        // Filtrar por estado de venta
        if (selectedSaleStatus !== '') {
            if (selectedSaleStatus === 'for-sale') {
                filtered = filtered.filter(p => p.isForSale === true);
            } else if (selectedSaleStatus === 'not-for-sale') {
                filtered = filtered.filter(p => p.isForSale === false);
            }
        }

        setFilteredPlayers(filtered);
    }, [searchTerm, selectedPosition, selectedSaleStatus, players]);

    if (loading) return <p>Loading players...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="player-list-container">
            <h2>Available Players</h2>

            <div className="search-bar-container" style={{ marginBottom: 16 }}>
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="player-search-input"
                    style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #ccc', width: 240, fontSize: 16 }}
                />
            </div>

            <div className="filters-container">
                <PositionFilter
                    positions={availablePositions}
                    selectedPosition={selectedPosition}
                    onChange={setSelectedPosition}
                />

                <div className="sale-filter-container">
                    <label htmlFor="sale-filter" className="sale-filter-label">
                        Filter by State:
                    </label>
                    <select
                        id="sale-filter"
                        value={selectedSaleStatus}
                        onChange={(e) => setSelectedSaleStatus(e.target.value)}
                        className="sale-filter-select"
                    >
                        <option value="">All players</option>
                        <option value="for-sale">For sale</option>
                        <option value="not-for-sale">Not for sale</option>
                    </select>
                </div>
            </div>

            <div className="player-list">
                {filteredPlayers.map(player => (
                    <FifaPlayerCard key={player.id} player={player} />
                ))}
            </div>
        </div>
    );
};

export default PlayerList;
