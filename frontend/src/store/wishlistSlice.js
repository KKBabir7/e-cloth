import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getBackendUrl } from '@/utils/api';

const getApiUrl = () => `${getBackendUrl()}/api/wishlist`;

// Attach cookies defaults to handle sessions
if (typeof window !== 'undefined') {
  axios.defaults.withCredentials = true;
}

// Helper to load wishlist from localStorage in offline fallback
const loadLocalWishlist = () => {
  try {
    if (typeof window === 'undefined') return [];
    const serialized = localStorage.getItem('cwbd_wishlist');
    return serialized ? JSON.parse(serialized) : [];
  } catch (err) {
    return [];
  }
};

// Helper to save wishlist to localStorage in offline fallback
const saveLocalWishlist = (products) => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cwbd_wishlist', JSON.stringify(products));
  } catch (err) {
    console.error('Error saving local wishlist:', err);
  }
};

// Adapter helper to map database items to expected frontend format
const mapWishlistItems = (products) => {
  if (!products) return [];
  return products.map(p => ({
    id: p._id || p.id,
    _id: p._id || p.id,
    name: p.name,
    price: p.price,
    image: p.images?.[0] || p.image || '/images/placeholder-shirt.png'
  }));
};

// Async Thunks
export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(getApiUrl());
    return res.data.wishlist;
  } catch (err) {
    console.warn('Backend server offline, falling back to local storage wishlist.');
    const local = loadLocalWishlist();
    return { products: local };
  }
});

export const toggleWishlist = createAsyncThunk('wishlist/toggleWishlist', async (product, { getState, rejectWithValue }) => {
  const prodId = product._id || product.id;
  try {
    const { wishlist } = getState();
    const exists = wishlist.items.some(item => item.id === prodId || item._id === prodId);
    
    let res;
    if (exists) {
      res = await axios.delete(`${getApiUrl()}/${prodId}`);
    } else {
      res = await axios.post(getApiUrl(), { productId: prodId });
    }
    return res.data.wishlist;
  } catch (err) {
    console.warn('Backend server offline, toggling wishlist in local storage fallback.');
    const local = loadLocalWishlist();
    const existsIndex = local.findIndex(p => (p._id || p.id) === prodId);
    
    let updated;
    if (existsIndex > -1) {
      updated = local.filter(p => (p._id || p.id) !== prodId);
    } else {
      // Create a database-compatible product document format
      updated = [...local, {
        _id: prodId,
        id: prodId,
        name: product.name,
        price: product.price,
        images: [product.image || product.images?.[0] || '/images/placeholder-shirt.png']
      }];
    }
    saveLocalWishlist(updated);
    return { products: updated };
  }
});

export const removeFromWishlist = createAsyncThunk('wishlist/removeFromWishlist', async (productId, { rejectWithValue }) => {
  try {
    const res = await axios.delete(`${getApiUrl()}/${productId}`);
    return res.data.wishlist;
  } catch (err) {
    console.warn('Backend server offline, removing item from local storage fallback.');
    const local = loadLocalWishlist();
    const updated = local.filter(p => (p._id || p.id) !== productId);
    saveLocalWishlist(updated);
    return { products: updated };
  }
});

const initialState = {
  items: [],
  loading: false,
  error: null
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchWishlist
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = mapWishlistItems(action.payload.products);
        state.error = null;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // toggleWishlist
    builder
      .addCase(toggleWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = mapWishlistItems(action.payload.products);
        state.error = null;
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // removeFromWishlist
    builder
      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = mapWishlistItems(action.payload.products);
        state.error = null;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default wishlistSlice.reducer;
