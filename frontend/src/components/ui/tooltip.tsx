/**
 * Tooltip Provider Component
 * Minimal placeholder for shadcn/ui tooltip
 * This component provides tooltip context for child components
 * In a full implementation, this would be provided by shadcn/ui
 */
import { ReactNode, createContext, useContext } from "react";

// Minimal tooltip context for compatibility
const TooltipContext = createContext<unknown>(null);

// Minimal tooltip provider component
// In production, replace with actual shadcn/ui TooltipProvider
export const TooltipProvider = ({ children }: { children: ReactNode }) => {
  return (
    <TooltipContext.Provider value={null}>
      {children}
    </TooltipContext.Provider>
  );
};

