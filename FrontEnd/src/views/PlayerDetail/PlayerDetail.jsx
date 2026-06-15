import './PlayerDetail.css';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiUrl } from '../../config/api';

const PlayerDetail = () => {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInCart, setIsInCart] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Función para obtener el userId real consultando la API por username
  const getUserIdFromToken = async (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decoded = JSON.parse(jsonPayload);
      const username = decoded.sub || decoded.username || decoded.name;
      if (!username) return null;

      // Llama a la API de users para obtener el id real
      const usersResp = await fetch(apiUrl('/users'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!usersResp.ok) return null;
      const users = await usersResp.json();
      const user = users.find(u => u.username === username);
      return user ? user.id : null;
    } catch {
      return null;
    }
  };

  // Función para obtener o crear carrito activo
  const getOrCreateActiveCart = async (userId, token) => {
    try {
      // Primero intentar obtener el carrito activo
      const activeCartResponse = await fetch(apiUrl(`/shopping-carts/user/${userId}/active`), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (activeCartResponse.ok) {
        return await activeCartResponse.json();
      }

      // Si no hay carrito activo (404), crear uno nuevo
      if (activeCartResponse.status === 404) {
        const createCartResponse = await fetch(apiUrl('/shopping-carts'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            status: 'ACTIVE'
          }),
        });

        if (createCartResponse.ok) {
          return await createCartResponse.json();
        }
      }

      throw new Error('Could not get or create cart');
    } catch (error) {
      console.error('Error getting/creating cart:', error);
      throw error;
    }
  };

  // Función para verificar si el jugador está en el carrito
  const checkPlayerInCart = async (playerId, token) => {
    try {
      const userId = await getUserIdFromToken(token);
      if (!userId) return false;

      const cart = await getOrCreateActiveCart(userId, token);
      if (!cart) return false;

      const cartItemsResponse = await fetch(apiUrl(`/cart-items/cart/${cart.id}`), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!cartItemsResponse.ok) return false;

      const cartItems = await cartItemsResponse.json();
      return cartItems.some(item => item.playerId === parseInt(playerId));
    } catch (error) {
      console.error('Error checking cart:', error);
      return false;
    }
  };

  // Función para agregar al carrito
  const handleAddToCart = async () => {
    if (isInCart) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to add items to cart');
        return;
      }

      const userId = await getUserIdFromToken(token);
      if (!userId) {
        alert('Error getting user information');
        return;
      }

      // Obtener o crear carrito activo
      const cart = await getOrCreateActiveCart(userId, token);
      if (!cart) {
        alert('Error accessing cart');
        return;
      }

      // Agregar item al carrito usando el ID real del carrito
      const response = await fetch(apiUrl('/cart-items/add-to-cart'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          cartId: cart.id.toString(), // Usar el ID real del carrito
          playerId: player.id.toString(),
          quantity: '1',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      setIsInCart(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);

    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding player to cart: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const response = await fetch(apiUrl(`/players/${id}`), {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error('Error fetching player');

        const data = await response.json();

        // Procesar características
        data.characteristics = data.characteristics
          ? Array.isArray(data.characteristics)
            ? data.characteristics
            : data.characteristics.split(',').map(c => c.trim())
          : [];

        setPlayer(data);

        // Verificar si está en el carrito solo si el usuario está logueado
        if (token) {
          const inCart = await checkPlayerInCart(id, token);
          setIsInCart(inCart);
        }

      } catch (err) {
        console.error('Error fetching player:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [id]);

  if (loading) return <div className="player-detail"><h2>Loading...</h2></div>;
  if (error) return <div className="player-detail"><h2>Error: {error}</h2></div>;
  if (!player) return <div className="player-detail"><h2>Player not found</h2></div>;

  return (
    <>
      {showToast && (
        <div className="toast">
          {isInCart ? 'Player already in cart!' : 'Player added to cart!'}
        </div>
      )}
      <div className="player-detail">
        <div className="player-header">
          <img
            src={player.image || 'https://via.placeholder.com/120'}
            alt={player.name || 'Player'}
            className="player-image"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/120')}
          />
          <h1 className="player-name">
            {player.name && player.lastName ? `${player.name} ${player.lastName}` : player.name || 'Unknown Player'}
          </h1>
        </div>
        <div className="player-bio">
          <p><strong>Position:</strong> {player.position || 'N/A'}</p>
          <p><strong>Rating:</strong> {player.rating || 'N/A'}</p>
          <p><strong>Price:</strong> ${player.price?.toLocaleString() || 'N/A'}</p>
          <p><strong>Club:</strong> {player.clubName || 'Unknown Club'}</p>
          <p><strong>Owner:</strong> {player.ownerName || '-'}</p>
          <p>
            <strong>Status:</strong> {player.isForSale ? (
              <span className="for-sale-label">FOR SALE</span>
            ) : (
              <span className="not-for-sale-label">NOT FOR SALE</span>
            )}
          </p>
        </div>
        <div className="player-info">
          <p><strong>Characteristics:</strong></p>
          <ul>
            {player.characteristics && player.characteristics.length > 0
              ? player.characteristics.map((charac, idx) => <li key={idx}>{charac}</li>)
              : <li>No characteristics available</li>
            }
          </ul>
        </div>
        <div className="player-actions-detail">
          {player.isForSale ? (
            <button
              className="buy-button"
              onClick={handleAddToCart}
              disabled={isInCart}
            >
              {isInCart ? 'In Cart ✓' : 'Add to Cart'}
            </button>
          ) : (
            <div className="not-for-sale-banner">This player is not for sale</div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlayerDetail;
