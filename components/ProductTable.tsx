'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { AgGridReact } from 'ag-grid-react';
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  ecoScore: number;
  shippingDays: number;
  rating: number;
  tags: string[];
  image: string;
};

export default function ProductTable({
  products,
  recommendedId,
  onBuy,
  buyingId,
}: {
  products: Product[];
  recommendedId?: string;
  onBuy: (p: Product) => void;
  buyingId: string | null;
}) {
  const columnDefs = useMemo<ColDef<Product>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Product',
        width: 340,
        minWidth: 280,
        cellRenderer: (p: ICellRendererParams<Product>) => {
          const product = p.data;
          if (!product) return null;
          return (
            <div className="flex items-center gap-3 py-1">
              <Image
                src={product.image}
                alt={product.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded object-cover shrink-0"
              />
              <span className="text-sm">{product.name}</span>
            </div>
          );
        },
      },
      {
        field: 'price',
        headerName: 'Price',
        width: 110,
        type: 'numericColumn',
        valueFormatter: (p) => `$${Number(p.value).toFixed(2)}`,
      },
      {
        field: 'ecoScore',
        headerName: 'Eco /10',
        width: 110,
        type: 'numericColumn',
      },
      {
        field: 'rating',
        headerName: 'Rating',
        width: 100,
        type: 'numericColumn',
      },
      {
        field: 'shippingDays',
        headerName: 'Ships',
        width: 110,
        type: 'numericColumn',
        valueFormatter: (p) => `${p.value} days`,
      },
      {
        headerName: 'Action',
        width: 180,
        sortable: false,
        filter: false,
        cellRenderer: (p: ICellRendererParams<Product>) => {
          const product = p.data;
          if (!product) return null;
          const isBuying = buyingId === product.id;
          return (
            <button
              onClick={() => onBuy(product)}
              disabled={isBuying}
              className="bg-[#0070ba] hover:bg-[#005ea6] text-white text-xs font-medium px-3 py-1.5 rounded-full disabled:opacity-50"
            >
              {isBuying ? 'Redirecting...' : 'Buy with PayPal'}
            </button>
          );
        },
      },
    ],
    [onBuy, buyingId]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  return (
    <div style={{ height: 460, width: '100%' }}>
      <AgGridReact<Product>
        theme={themeQuartz}
        rowData={products}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={(p) => p.data.id}
        getRowHeight={() => 60}
        getRowStyle={(params) =>
          params.data?.id === recommendedId
            ? { backgroundColor: '#ecfdf5', fontWeight: '500' }
            : undefined
        }
        suppressCellFocus
      />
    </div>
  );
}