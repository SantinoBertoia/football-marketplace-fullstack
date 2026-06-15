import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayerImageUrl, handleImageError } from '../../utils/imageUtils';
import './ManageMyPlayers.css';
import { apiUrl } from '../../config/api';

const ManageMyPlayers = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // Separar estados para diferentes tipos de edición
    const [editingPlayerData, setEditingPlayerData] = useState(null); // Para editar datos completos
    const [editingPlayerPrice, setEditingPlayerPrice] = useState(null); // Para editar solo precio
    const [newPrice, setNewPrice] = useState('');
    const [playerToSell, setPlayerToSell] = useState(null);
    const navigate = useNavigate();

    // Funciones de utilidad
    const decodeToken = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    };

    const getUserByUsername = async (username, token) => {
        try {
            const response = await fetch(apiUrl('/users'), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`Error fetching users: ${response.status}`);
            }
            const users = await response.json();
            const user = users.find(u => u.username && u.username.trim().toLowerCase() === username.trim().toLowerCase());
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            console.error('Error fetching user info:', error);
            throw error;
        }
    };

    const fetchUserPlayers = async (ownerId, token) => {
        try {
            const response = await fetch(apiUrl(`/players/owner/${ownerId}`), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                if (response.status === 404) {
                    return [];
                }
                throw new Error(`Error fetching players: ${response.status}`);
            }
            const players = await response.json();
            return players || [];
        } catch (error) {
            console.error('Error fetching user players:', error);
            throw error;
        }
    };

    // Cargar datos iniciales
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('No authentication token found.');
                    return;
                }

                const decodedToken = decodeToken(token);
                if (!decodedToken || !decodedToken.sub) {
                    setError('Invalid authentication token.');
                    return;
                }

                const userInfo = await getUserByUsername(decodedToken.sub, token);
                setUserInfo(userInfo);

                const allPlayers = await fetchUserPlayers(userInfo.id, token);
                // Filtrar para mostrar solo jugadores que NO están en venta (están en el club)
                const playersInClub = allPlayers.filter(player => !player.isForSale);
                setPlayers(playersInClub);
            } catch (error) {
                console.error('Error loading data:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Cambiar estado de venta
    const togglePlayerSale = async (playerId, currentSaleStatus) => {
        try {
            const token = localStorage.getItem('token');
            const newSaleStatus = !currentSaleStatus;

            const response = await fetch(apiUrl(`/players/${playerId}/forsale/${newSaleStatus}`), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error updating sale status');
            }

            const updatedPlayer = await response.json();

            if (newSaleStatus) {
                // Si se pone en venta, remover del club (lista local)
                setPlayers(prev => prev.filter(p => p.id !== playerId));
                alert('Player is now for sale and has been moved to the marketplace!');
            } else {
                // Si se quita de venta, agregar al club (lista local)
                setPlayers(prev => [...prev, updatedPlayer]);
                alert('Player has been removed from sale and is back in your club!');
            }

            setPlayerToSell(null);
        } catch (error) {
            console.error('Error updating sale status:', error);
            alert('Error updating sale status. Please try again.');
        }
    };

    // Actualizar precio
    const updatePrice = async (playerId) => {
        try {
            const price = parseFloat(newPrice);
            if (isNaN(price) || price <= 0) {
                alert('Please enter a valid price greater than 0');
                return;
            }

            const token = localStorage.getItem('token');
            const response = await fetch(apiUrl(`/players/${playerId}/price/${price}`), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error updating price');
            }

            const updatedPlayer = await response.json();
            setPlayers(prev => prev.map(p => p.id === playerId ? updatedPlayer : p));
            setEditingPlayerPrice(null);
            setNewPrice('');
            alert('Price updated successfully!');
        } catch (error) {
            console.error('Error updating price:', error);
            alert('Error updating price. Please try again.');
        }
    };

    // Actualizar jugador completo
    const updatePlayer = async (playerId, playerData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(apiUrl(`/players/${playerId}`), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(playerData),
            });

            if (!response.ok) {
                throw new Error('Error updating player');
            }

            const updatedPlayer = await response.json();
            setPlayers(prev => prev.map(p => p.id === playerId ? updatedPlayer : p));
            setEditingPlayerData(null);
            alert('Player updated successfully!');
        } catch (error) {
            console.error('Error updating player:', error);
            alert('Error updating player. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="manage-players-container">
                <div className="loading">Loading your players...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="manage-players-container">
                <div className="error">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="back-button">
                        Back to My Team
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="manage-players-container">
            <header className="manage-header">
                <h1>Manage My Players</h1>
                <div className="header-actions">
                    <button
                        className="add-player-btn"
                        onClick={() => setShowAddForm(true)}
                    >
                        + Add New Player
                    </button>
                    <button
                        className="back-btn"
                        onClick={() => navigate('/dashboard')}
                    >
                        Back to My Team
                    </button>
                </div>
            </header>

            {players.length === 0 ? (
                <div className="no-players">
                    <h2>No Players in Club</h2>
                    <p>All your players might be for sale, or you haven't added any players yet.</p>
                    <p>Start building your team by adding your first player!</p>
                    <button
                        className="add-first-player-btn"
                        onClick={() => setShowAddForm(true)}
                    >
                        Add Your First Player
                    </button>
                </div>
            ) : (
                <div className="players-grid">
                    {players.map(player => (
                        <div key={player.id} className="player-card-manage">
                            <div className="player-image-container">
                                <img
                                    src={getPlayerImageUrl(player)}
                                    alt={player.name}
                                    className="player-image"
                                    onError={(e) => handleImageError(e, player.id)}
                                />
                                <div className="sale-status not-for-sale">
                                    IN SQUAD
                                </div>
                            </div>

                            <div className="player-info">
                                <h3 className="player-name">{player.name}</h3>
                                <p className="player-position">{player.position}</p>
                                <p className="player-rating">Rating: {player.rating}</p>

                                <div className="price-section">
                                    {editingPlayerPrice === player.id ? (
                                        <div className="price-edit">
                                            <input
                                                type="number"
                                                value={newPrice}
                                                onChange={(e) => setNewPrice(e.target.value)}
                                                placeholder="New price"
                                                className="price-input"
                                                min="0"
                                                step="0.01"
                                            />
                                            <div className="price-actions">
                                                <button
                                                    onClick={() => updatePrice(player.id)}
                                                    className="save-btn"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingPlayerPrice(null);
                                                        setNewPrice('');
                                                    }}
                                                    className="cancel-btn"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="price-display">
                                            <span className="price">${player.price?.toLocaleString() || '0'}</span>
                                            <button
                                                onClick={() => {
                                                    setEditingPlayerPrice(player.id);
                                                    setNewPrice(player.price?.toString() || '');
                                                }}
                                                className="edit-price-btn"
                                            >
                                                Edit Price
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="player-actions">
                                <button
                                    onClick={() => setEditingPlayerData(player)}
                                    className="action-btn edit-player-btn"
                                    title="Edit player details"
                                >
                                    <span className="btn-icon">✏️</span>
                                    <span className="btn-text">Edit</span>
                                </button>

                                <button
                                    onClick={() => setPlayerToSell(player)}
                                    className="action-btn toggle-sale-btn put-for-sale"
                                    title="Put on marketplace"
                                >
                                    <span className="btn-icon">💰</span>
                                    <span className="btn-text">Put for Sale</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de confirmación para poner en venta */}
            {playerToSell && (
                <div className="modal-overlay" onClick={() => setPlayerToSell(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="sale-warning">
                            <div className="sale-warning-icon">💰</div>
                            <h2>Put Player for Sale</h2>
                            <p>
                                Are you sure you want to put <strong>{playerToSell.name}</strong> for sale?
                            </p>
                            <p>
                                The player will be moved to the marketplace and will no longer appear in your club until removed from sale.
                            </p>
                            <p>Current price: <strong>${playerToSell.price?.toLocaleString() || '0'}</strong></p>
                        </div>
                        <div className="form-actions">
                            <button
                                onClick={() => togglePlayerSale(playerToSell.id, playerToSell.isForSale)}
                                className="confirm-sale-btn"
                            >
                                Yes, Put for Sale
                            </button>
                            <button
                                onClick={() => setPlayerToSell(null)}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para agregar jugador */}
            {showAddForm && (
                <AddPlayerModal
                    userInfo={userInfo}
                    onClose={() => setShowAddForm(false)}
                    onPlayerAdded={(newPlayer) => {
                        // Solo agregar a la lista si NO está marcado para venta
                        if (!newPlayer.isForSale) {
                            setPlayers(prev => [...prev, newPlayer]);
                        }
                        setShowAddForm(false);

                        const message = newPlayer.isForSale
                            ? 'Player created and put for sale in the marketplace!'
                            : 'Player created and added to your club!';
                        alert(message);
                    }}
                />
            )}

            {/* Modal para editar jugador */}
            {editingPlayerData && (
                <EditPlayerModal
                    player={editingPlayerData}
                    onClose={() => setEditingPlayerData(null)}
                    onPlayerUpdated={updatePlayer}
                />
            )}
        </div>
    );
};

// Componente modal para agregar jugador
const AddPlayerModal = ({ userInfo, onClose, onPlayerAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        position: '',
        rating: '',
        characteristics: '',
        price: '',
        isForSale: false,
        image: null
    });
    const [loading, setLoading] = useState(false);

    const positions = [
        'Goalkeeper',
        'Center-Back',
        'Left-Back',
        'Right-Back',
        'Defensive Midfielder',
        'Central Midfielder',
        'Attacking Midfielder',
        'Left Midfielder',
        'Right Midfielder',
        'Left Winger',
        'Right Winger',
        'Striker',
        'Center Forward'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();

            // Crear el objeto player
            const playerData = {
                name: formData.name,
                lastName: formData.lastName,
                position: formData.position,
                rating: parseInt(formData.rating),
                characteristics: formData.characteristics,
                price: parseFloat(formData.price),
                isForSale: formData.isForSale,
                ownerId: userInfo.id
            };

            formDataToSend.append('player', new Blob([JSON.stringify(playerData)], {
                type: 'application/json'
            }));

            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            const response = await fetch(apiUrl('/players'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formDataToSend,
            });

            if (!response.ok) {
                throw new Error('Error creating player');
            }

            const newPlayer = await response.json();
            onPlayerAdded(newPlayer);
        } catch (error) {
            console.error('Error creating player:', error);
            alert('Error creating player. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Add New Player</h2>
                <form onSubmit={handleSubmit} className="add-player-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name:</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                minLength={2}
                                maxLength={50}
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name:</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                maxLength={50}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Position:</label>
                            <select
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                required
                            >
                                <option value="">Select Position</option>
                                {positions.map(pos => (
                                    <option key={pos} value={pos}>{pos}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Overall Rating (1-100):</label>
                            <input
                                type="number"
                                value={formData.rating}
                                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                required
                                min={1}
                                max={100}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Characteristics:</label>
                        <textarea
                            value={formData.characteristics}
                            onChange={(e) => setFormData({ ...formData, characteristics: e.target.value })}
                            placeholder="Enter characteristics separated by commas"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Price ($):</label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                            min={0}
                            step={0.01}
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.isForSale}
                                onChange={(e) => setFormData({ ...formData, isForSale: e.target.checked })}
                            />
                            Put for sale immediately (player will be moved to marketplace)
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Player Image:</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? 'Creating...' : 'Create Player'}
                        </button>
                        <button type="button" onClick={onClose} className="cancel-btn">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente modal para editar jugador
const EditPlayerModal = ({ player, onClose, onPlayerUpdated }) => {
    const [formData, setFormData] = useState({
        name: player.name || '',
        lastName: player.lastName || '',
        position: player.position || '',
        rating: player.rating || '',
        pace: player.pace || '',
        shooting: player.shooting || '',
        passing: player.passing || '',
        dribbling: player.dribbling || '',
        defending: player.defending || '',
        physical: player.physical || '',
        characteristics: player.characteristics || '',
        price: player.price || ''
    });
    const [loading, setLoading] = useState(false);

    const positions = [
        'Goalkeeper',
        'Center-Back',
        'Left-Back',
        'Right-Back',
        'Defensive Midfielder',
        'Central Midfielder',
        'Attacking Midfielder',
        'Left Midfielder',
        'Right Midfielder',
        'Left Winger',
        'Right Winger',
        'Striker',
        'Center Forward'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validaciones básicas
            if (formData.rating < 1 || formData.rating > 100) {
                alert('Rating must be between 1 and 100');
                setLoading(false);
                return;
            }

            if (formData.price <= 0) {
                alert('Price must be greater than 0');
                setLoading(false);
                return;
            }

            const updatedData = {
                name: formData.name,
                lastName: formData.lastName,
                position: formData.position,
                rating: parseInt(formData.rating),
                pace: formData.pace ? parseInt(formData.pace) : null,
                shooting: formData.shooting ? parseInt(formData.shooting) : null,
                passing: formData.passing ? parseInt(formData.passing) : null,
                dribbling: formData.dribbling ? parseInt(formData.dribbling) : null,
                defending: formData.defending ? parseInt(formData.defending) : null,
                physical: formData.physical ? parseInt(formData.physical) : null,
                characteristics: formData.characteristics,
                price: parseFloat(formData.price)
            };

            await onPlayerUpdated(player.id, updatedData);
        } catch (error) {
            console.error('Error updating player:', error);
            alert('Error updating player. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Player: {player.name}</h2>
                <form onSubmit={handleSubmit} className="edit-player-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name:</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                minLength={2}
                                maxLength={50}
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name:</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                maxLength={50}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Position:</label>
                            <select
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                required
                            >
                                <option value="">Select Position</option>
                                {positions.map(pos => (
                                    <option key={pos} value={pos}>{pos}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Overall Rating (1-100):</label>
                            <input
                                type="number"
                                value={formData.rating}
                                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                required
                                min={1}
                                max={100}
                            />
                        </div>
                    </div>

                    <div className="stats-section">
                        <h3>Player Stats (Optional)</h3>
                        <div className="stats-grid">
                            <div className="form-group">
                                <label>Pace:</label>
                                <input
                                    type="number"
                                    value={formData.pace}
                                    onChange={(e) => setFormData({ ...formData, pace: e.target.value })}
                                    min={1}
                                    max={100}
                                />
                            </div>
                            <div className="form-group">
                                <label>Shooting:</label>
                                <input
                                    type="number"
                                    value={formData.shooting}
                                    onChange={(e) => setFormData({ ...formData, shooting: e.target.value })}
                                    min={1}
                                    max={100}
                                />
                            </div>
                            <div className="form-group">
                                <label>Passing:</label>
                                <input
                                    type="number"
                                    value={formData.passing}
                                    onChange={(e) => setFormData({ ...formData, passing: e.target.value })}
                                    min={1}
                                    max={100}
                                />
                            </div>
                            <div className="form-group">
                                <label>Dribbling:</label>
                                <input
                                    type="number"
                                    value={formData.dribbling}
                                    onChange={(e) => setFormData({ ...formData, dribbling: e.target.value })}
                                    min={1}
                                    max={100}
                                />
                            </div>
                            <div className="form-group">
                                <label>Defending:</label>
                                <input
                                    type="number"
                                    value={formData.defending}
                                    onChange={(e) => setFormData({ ...formData, defending: e.target.value })}
                                    min={1}
                                    max={100}
                                />
                            </div>
                            <div className="form-group">
                                <label>Physical:</label>
                                <input
                                    type="number"
                                    value={formData.physical}
                                    onChange={(e) => setFormData({ ...formData, physical: e.target.value })}
                                    min={1}
                                    max={100}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Characteristics:</label>
                        <textarea
                            value={formData.characteristics}
                            onChange={(e) => setFormData({ ...formData, characteristics: e.target.value })}
                            placeholder="Enter characteristics separated by commas"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Price ($):</label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                            min={0}
                            step={0.01}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? 'Updating...' : 'Update Player'}
                        </button>
                        <button type="button" onClick={onClose} className="cancel-btn">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManageMyPlayers;
