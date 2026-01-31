/**
 * NavLink Component
 * 
 * FUTURE USE COMPONENT
 * 
 * This component is a wrapper around react-router-dom's NavLink with
 * additional styling support. Currently, navigation in the app uses
 * standard button elements with onClick handlers.
 * 
 * Usage: This component can be integrated into navigation menus when
 * styled link-based navigation is needed.
 * 
 * To use: Import this component and use it instead of standard <Link>
 * when you need active/pending state styling
 */

import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
