import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Box, LinearProgress, Fade } from "@mui/material";

export function GlobalLoader() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const isLoading = isFetching > 0 || isMutating > 0;

  return (
    <Fade in={isLoading} timeout={{ enter: 150, exit: 300 }} unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1400,
        }}
      >
        <LinearProgress
          color="primary"
          sx={{
            height: 3,
            "& .MuiLinearProgress-bar": {
              transition: "transform 0.2s linear",
            },
          }}
        />
      </Box>
    </Fade>
  );
}
