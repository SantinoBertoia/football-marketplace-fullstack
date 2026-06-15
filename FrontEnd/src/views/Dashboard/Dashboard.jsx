import FifaPlayerCard from '../../components/PlayerCard/PlayerCard';
import './Dashboard.css';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPlayerImageUrl } from '../../utils/imageUtils';
import { apiUrl } from '../../config/api';

const Dashboard = () => {
  const [playersDashboard, setPlayersDashboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Función para decodificar el JWT y obtener información del usuario
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

  // Función para obtener información del usuario por username
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
        throw new Error('User not found (username: ' + username + ')');
      }
      return user;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  };

  // Función para obtener los jugadores del usuario
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
      if (!players || !Array.isArray(players)) {
        return [];
      }
      return players;
    } catch (error) {
      console.error('Error fetching user players:', error);
      if (error.message && error.message.includes('no tiene jugadores')) {
        return [];
      }
      throw error;
    }
  };

  useEffect(() => {
    const loadUserPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found.');
          return;
        }
        const decodedToken = decodeToken(token);
        if (!decodedToken) {
          setError('Invalid authentication token.');
          return;
        }
        if (!decodedToken.sub) {
          setError('Invalid authentication token: no username.');
          return;
        }
        const userInfo = await getUserByUsername(decodedToken.sub, token);
        setUserInfo(userInfo);
        const players = await fetchUserPlayers(userInfo.id, token);
        const transformedPlayers = players.map(player => ({
          id: player.id,
          name: player.name,
          price: player.price,
          image: getPlayerImageUrl(player),
          position: player.position,
          rating: player.rating,
          // Corrige characteristics para que siempre sea array
          characteristics: Array.isArray(player.characteristics)
            ? player.characteristics
            : (typeof player.characteristics === 'string' && player.characteristics.length > 0
                ? player.characteristics.split(',').map(c => c.trim())
                : []),
          isForSale: player.isForSale === true, // fuerza booleano
          ownerId: player.ownerId || (player.owner && player.owner.id) || null
        }));
        setPlayersDashboard(transformedPlayers);
      } catch (error) {
        console.error('Error loading user players:', error);
        setError(error.message || 'Error loading your players. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadUserPlayers();
  }, [navigate]);

  // Manejar mensajes de éxito del checkout
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      // Limpiar el state para evitar que persista en navegación
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const totalValue = playersDashboard.reduce((sum, p) => sum + (p.price || 0), 0);
  const playersForSale = playersDashboard.filter(p => p.isForSale).length;
  const playersNotForSale = playersDashboard.length - playersForSale;

  if (loading) {
    return (
      <div className="containerDashboard">
        <div className="dashboard-loading">
          <h2>Loading your team...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="containerDashboard">
        <div className="dashboard-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="containerDashboard">
      {userInfo && (
        <>
          <h1 className="club-title">{userInfo.teamName}</h1>
          
          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="success-message">
              <div className="success-content">
                <span className="success-icon">🎉</span>
                <p>{successMessage}</p>
                <button 
                  onClick={() => setSuccessMessage(null)} 
                  className="close-success"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          <div className="team-info" style={{ marginBottom: '2.5rem' }}>
            <p><strong>Stadium:</strong> {userInfo.stadium}</p>
            <p><strong>City:</strong> {userInfo.city}</p>
            <p><strong>Founded:</strong> {userInfo.yearFounded}</p>
            <p><strong>Total Players:</strong> {playersDashboard.length}</p>
            <p><strong>Players For Sale:</strong> {playersForSale}</p>
            <p><strong>Players Not For Sale:</strong> {playersNotForSale}</p>
            <p><strong>Total Squad Value:</strong> ${totalValue.toLocaleString()}</p>
            <div className="dashboard-actions">
              <button onClick={() => navigate('/manage-my-players')} className="manage-players-btn">
                ⚙️ Manage My Players
              </button>
            </div>
          </div>
        </>
      )}
      {playersDashboard.length === 0 ? (
        <div className="no-players">
          <div className="no-players-icon">⚽</div>
          <h2>No Players Yet!</h2>
          <p>Your squad is empty. Time to build your dream team!</p>
          <p>Visit the marketplace to discover and purchase talented players.</p>
          <div className="no-players-actions">
            <button onClick={() => navigate('/players')} className="marketplace-button">🏪 Browse Marketplace</button>
            <button onClick={() => navigate('/manage-my-players')} className="manage-button">⚙️ Manage Players</button>
            <button onClick={() => window.location.reload()} className="refresh-button">🔄 Refresh</button>
          </div>
        </div>
      ) : (
        <div className="dashboard-items">
          {playersDashboard.map((player) => (
            <FifaPlayerCard
              key={player.id}
              player={player}
              compact={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
