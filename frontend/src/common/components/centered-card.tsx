import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { ReactNode } from 'react';

type CenteredCardProps = {
  title: string;
  children: ReactNode;
};

const CenteredCard = ({ title, children }: CenteredCardProps) => (
  <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
    <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 400 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {title}
      </Typography>
      {children}
    </Paper>
  </Box>
);

export default CenteredCard;
