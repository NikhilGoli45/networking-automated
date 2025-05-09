import { Box } from '@mui/material';
import type { ReactNode } from 'react';

/**
 * A full‑viewport flex box that centers its children
 * both horizontally and vertically.
 */
interface CenterWrapperProps {
  children: ReactNode;
}

const CenterWrapper = ({ children }: CenterWrapperProps) => (
  <Box
    sx={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      p: 2, // a little breathing room on small screens
    }}
  >
    {children}
  </Box>
);

export default CenterWrapper;
