import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { Product } from '../services/catalogoService';

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity?: number }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'INCREASE_QTY'; productId: string }
  | { type: 'DECREASE_QTY'; productId: string }
  | { type: 'CLEAR' };

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  increaseQty: (productId: string) => void;
  decreaseQty: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const quantityToAdd = action.quantity ?? 1;
      const existing = state.items.find((ci) => ci.product.id === action.product.id);
      if (existing) {
        return {
          items: state.items.map((ci) =>
            ci.product.id === action.product.id
              ? { ...ci, quantity: ci.quantity + quantityToAdd }
              : ci
          ),
        };
      }
      return { items: [{ product: action.product, quantity: quantityToAdd }, ...state.items] };
    }
    case 'REMOVE_ITEM': {
      return { items: state.items.filter((ci) => ci.product.id !== action.productId) };
    }
    case 'INCREASE_QTY': {
      return {
        items: state.items.map((ci) =>
          ci.product.id === action.productId ? { ...ci, quantity: ci.quantity + 1 } : ci
        ),
      };
    }
    case 'DECREASE_QTY': {
      return {
        items: state.items
          .map((ci) =>
            ci.product.id === action.productId ? { ...ci, quantity: ci.quantity - 1 } : ci
          )
          .filter((ci) => ci.quantity > 0),
      };
    }
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

export const CartProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const value = useMemo<CartContextValue>(() => {
    const totalItems = state.items.reduce((sum, it) => sum + it.quantity, 0);
    const totalPrice = state.items.reduce((sum, it) => sum + it.quantity * (it.product.price ?? 0), 0);
    return {
      items: state.items,
      totalItems,
      totalPrice,
      addItem: (product, quantity) => dispatch({ type: 'ADD_ITEM', product, quantity }),
      removeItem: (productId) => dispatch({ type: 'REMOVE_ITEM', productId }),
      increaseQty: (productId) => dispatch({ type: 'INCREASE_QTY', productId }),
      decreaseQty: (productId) => dispatch({ type: 'DECREASE_QTY', productId }),
      clear: () => dispatch({ type: 'CLEAR' }),
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}


