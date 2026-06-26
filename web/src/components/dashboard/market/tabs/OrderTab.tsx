import React from 'react';
import { OrderHistory } from '@/components/simulation/OrderHistory';

interface OrderTabProps {
  activeSymbol: string;
}

export function OrderTab({ activeSymbol }: OrderTabProps) {
  return (
    <div className="w-full pb-20">
      <OrderHistory symbolFilter={activeSymbol} />
    </div>
  );
}
