import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getBackendUrl } from '@/utils/api';

const getApiUrl = () => `${getBackendUrl()}/api/wishlist`;

// Attach cookies defaults to handle sessions
if (typeof window !== 'undefined') {
  axios.defaults.withCredentials = true;
}

// Adapter helper to map database items to expected frontend format
const mapWishlistItems = (products) => {
  if (!products) return [];
  return products.map(p => ({
    id: p._id || p.id,
    _id: p._id || p.id,
    name: p.name,
    price: p.price,
    discountPrice: p.discountPrice || 0,
    images: p.images || [],
    image: p.images?.[0] || p.image || '/images/placeholder-shirt.png',
    stock: p.stock !== undefined ? p.stock : 1
  }));
};

// Async Thunks
export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(getApiUrl());
    return res.data.wishlist;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch wishlist');
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
    return rejectWithValue(err.response?.data?.message || 'Failed to update wishlist');
  }
});

export const removeFromWishlist = createAsyncThunk('wishlist/removeFromWishlist', async (productId, { rejectWithValue }) => {
  try {
    const res = await axios.delete(`${getApiUrl()}/${productId}`);
    return res.data.wishlist;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove wishlist item');
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
