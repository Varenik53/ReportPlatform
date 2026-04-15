import { Typography } from "@mui/material";

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      {message}
    </Typography>
  );
}
