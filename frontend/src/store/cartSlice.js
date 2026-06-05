import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getBackendUrl } from '@/utils/api';

const getApiUrl = () => `${getBackendUrl()}/api/cart`;
axios.defaults.withCredentials = true; // Attach cookie sessions

// Async Thunks
export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(getApiUrl());
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async (payload, { rejectWithValue }) => {
  try {
    const res = await axios.post(getApiUrl(), payload);
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add item to cart');
  }
});

export const updateCartQty = createAsyncThunk('cart/updateCartQty', async (payload, { rejectWithValue }) => {
  try {
    const res = await axios.put(getApiUrl(), payload);
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update quantity');
  }
});

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (payload, { rejectWithValue }) => {
  try {
    const res = await axios.delete(getApiUrl(), { data: payload });
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove item');
  }
});

export const applyCouponCode = createAsyncThunk('cart/applyCouponCode', async (payload, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${getApiUrl()}/coupon`, payload);
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to apply coupon');
  }
});

export const removeCouponCode = createAsyncThunk('cart/removeCouponCode', async (_, { rejectWithValue }) => {
  try {
    const res = await axios.delete(`${getApiUrl()}/coupon`);
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove coupon');
  }
});

export const updateDeliveryCharge = createAsyncThunk('cart/updateDeliveryCharge', async (charge, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${getApiUrl()}/delivery`, { deliveryCharge: charge });
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update delivery charge');
  }
});

export const clearCart = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${getApiUrl()}/clear`);
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to clear cart');
  }
});

const initialState = {
  items: [],
  coupon: null,
  deliveryCharge: 80,
  subtotal: 0,
  discount: 0,
  total: 0,
  loading: false,
  error: null
};

const handleCartPending = (state) => {
  state.loading = true;
};

const handleCartFulfilled = (state, action) => {
  state.loading = false;
  state.items = action.payload.items || [];
  state.coupon = action.payload.coupon || null;
  state.deliveryCharge = action.payload.deliveryCharge ?? 80;
  state.subtotal = action.payload.subtotal ?? 0;
  state.discount = action.payload.discount ?? 0;
  state.total = action.payload.total ?? 0;
  state.error = null;
};

const handleCartRejected = (state, action) => {
  state.loading = false;
  state.error = action.payload;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchCart
    builder.addCase(fetchCart.pending, handleCartPending);
    builder.addCase(fetchCart.fulfilled, handleCartFulfilled);
    builder.addCase(fetchCart.rejected, handleCartRejected);

    // addToCart
    builder.addCase(addToCart.pending, handleCartPending);
    builder.addCase(addToCart.fulfilled, handleCartFulfilled);
    builder.addCase(addToCart.rejected, handleCartRejected);

    // updateCartQty
    builder.addCase(updateCartQty.pending, handleCartPending);
    builder.addCase(updateCartQty.fulfilled, handleCartFulfilled);
    builder.addCase(updateCartQty.rejected, handleCartRejected);

    // removeFromCart
    builder.addCase(removeFromCart.pending, handleCartPending);
    builder.addCase(removeFromCart.fulfilled, handleCartFulfilled);
    builder.addCase(removeFromCart.rejected, handleCartRejected);

    // applyCouponCode
    builder.addCase(applyCouponCode.pending, handleCartPending);
    builder.addCase(applyCouponCode.fulfilled, handleCartFulfilled);
    builder.addCase(applyCouponCode.rejected, handleCartRejected);

    // removeCouponCode
    builder.addCase(removeCouponCode.pending, handleCartPending);
    builder.addCase(removeCouponCode.fulfilled, handleCartFulfilled);
    builder.addCase(removeCouponCode.rejected, handleCartRejected);

    // updateDeliveryCharge
    builder.addCase(updateDeliveryCharge.pending, handleCartPending);
    builder.addCase(updateDeliveryCharge.fulfilled, handleCartFulfilled);
    builder.addCase(updateDeliveryCharge.rejected, handleCartRejected);

    // clearCart
    builder.addCase(clearCart.pending, handleCartPending);
    builder.addCase(clearCart.fulfilled, handleCartFulfilled);
    builder.addCase(clearCart.rejected, handleCartRejected);
  }
});

export default cartSlice.reducer;
