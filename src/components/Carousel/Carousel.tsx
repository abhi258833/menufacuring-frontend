import React, { useEffect, useState, useRef } from "react";
import { Box, IconButton } from "@mui/material";
import {
  ArrowBackIos,
  ArrowForwardIos,
  Pause,
  PlayArrow,
} from "@mui/icons-material";
import { ImageSlider } from "../../utils/images";

const INTERVAL_DURATION = 5000; // 5 seconds
const MAX_PILL_WIDTH = 40; // max pill width in px
const MIN_PILL_WIDTH = 10;
const RING_SIZE = 26;
const RING_STROKE = 3.2;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const PROGRESS_TICK_MS = 50;

type CarouselProps = {
  height?: string | number;
};

const Carousel: React.FC<CarouselProps> = ({ height = "400px" }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const progressRef = useRef<number>(0);
  const slideStartRef = useRef<number>(0);
  const progressIntervalRef = useRef<number | null>(null);
  const slideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (slideTimeoutRef.current !== null) {
      window.clearTimeout(slideTimeoutRef.current);
      slideTimeoutRef.current = null;
    }

    if (isPaused) {
      return;
    }

    slideStartRef.current = Date.now() - progressRef.current;

    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Math.min(Date.now() - slideStartRef.current, INTERVAL_DURATION);
      progressRef.current = elapsed;
      setProgress(elapsed);
    }, PROGRESS_TICK_MS);

    slideTimeoutRef.current = window.setTimeout(() => {
      progressRef.current = 0;
      setProgress(0);
      setCurrentSlide((prev) => (prev + 1) % ImageSlider.length);
    }, INTERVAL_DURATION - progressRef.current);

    return () => {
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (slideTimeoutRef.current !== null) {
        window.clearTimeout(slideTimeoutRef.current);
        slideTimeoutRef.current = null;
      }
    };
  }, [currentSlide, isPaused]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
    progressRef.current = 0;
    slideStartRef.current = performance.now();
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + ImageSlider.length) % ImageSlider.length);
    setProgress(0);
    progressRef.current = 0;
    slideStartRef.current = performance.now();
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % ImageSlider.length);
    setProgress(0);
    progressRef.current = 0;
    slideStartRef.current = performance.now();
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "inherit",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          position: "absolute",
        }}
      >
        <img
          src={ImageSlider[currentSlide]}
          alt={`Slide ${currentSlide + 1}`}
          loading={currentSlide === 0 ? "eager" : "lazy"}
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            animation: "slideImageFade 0.8s ease-in-out",
          }}
        />
      </Box>

      <Box
        sx={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: 54,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.9,
          px: 1,
          py: 0.45,
          borderRadius: "999px",
          bgcolor: "rgba(6, 14, 24, 0.25)",
          backdropFilter: "blur(6px)",
        }}
      >
        {ImageSlider.map((_, index) => {
          const isActive = index === currentSlide;

          return (
            <Box
              key={`center-dot-${index}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              role="button"
              sx={{
                width: isActive ? "18px" : "8px",
                height: "8px",
                borderRadius: "999px",
                bgcolor: isActive ? "#ffffff" : "rgba(255,255,255,0.58)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                border: "1px solid rgba(255,255,255,0.35)",
                '&:hover': {
                  width: isActive ? "20px" : "12px",
                  bgcolor: "#ffffff",
                  transform: "scale(1.2)",
                  boxShadow: "0 0 8px rgba(255, 255, 255, 0.4)",
                },
              }}
            />
          );
        })}
      </Box>

      {/* Controls */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 18,
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          padding: "0 24px",
          flexWrap: "nowrap",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            minWidth: 0,
          }}
        >
          {ImageSlider.map((_, index) => {
            const isActive = index === currentSlide;
            const width =
              isActive && progress <= INTERVAL_DURATION
                ? MIN_PILL_WIDTH + (MAX_PILL_WIDTH - MIN_PILL_WIDTH) * (progress / INTERVAL_DURATION)
                : MIN_PILL_WIDTH;

            return (
              <Box
                key={index}
                onClick={() => goToSlide(index)}
                sx={{
                  width: `${width}px`,
                  height: "8px",
                  borderRadius: "20px",
                  backgroundColor: isActive ? "#ffffff" : "rgba(255,255,255,0.42)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  cursor: "pointer",
                  transition: "width 0.05s linear, background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease",
                  boxShadow: isActive ? "0 0 0 4px rgba(255, 255, 255, 0.1)" : "none",
                  '&:hover': {
                    backgroundColor: "#ffffff",
                    boxShadow: "0 0 8px rgba(255, 255, 255, 0.3)",
                  },
                }}
              />
            );
          })}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
          }}
        >
          <IconButton
            onClick={goToPrevSlide}
            aria-label="Previous slide"
            sx={{
              width: 26,
              height: 26,
              color: "#111827",
              bgcolor: "#ffffff",
              boxShadow: "0 3px 10px rgba(0, 0, 0, 0.16)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              '&:hover': {
                bgcolor: "#f8fafc",
                transform: "translateX(-2px) scale(1.1)",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.24)",
              },
            }}
          >
            <ArrowBackIos sx={{ fontSize: 12, ml: 0.2 }} />
          </IconButton>

          <Box sx={{ position: "relative", width: RING_SIZE, height: RING_SIZE }}>
            <Box
              component="svg"
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: RING_SIZE,
                height: RING_SIZE,
                transform: "rotate(-90deg)",
                overflow: "visible",
              }}
            >
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={RING_STROKE}
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={RING_STROKE}
                strokeLinecap="butt"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - Math.min(progress / INTERVAL_DURATION, 1))}
                style={{
                  opacity: isPaused ? 0.35 : 1,
                  transition: isPaused ? "opacity 0.2s ease" : "none",
                }}
              />
            </Box>
            <IconButton
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
              sx={{
                position: "absolute",
                top: 2,
                left: 2,
                width: 22,
                height: 22,
                color: "#ffffff",
                bgcolor: "#1f2937",
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.22)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                '&:hover': {
                  bgcolor: "#111827",
                  transform: "scale(1.08)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.32)",
                },
              }}
            >
              {isPaused ? <PlayArrow sx={{ fontSize: 12, ml: 0.1 }} /> : <Pause sx={{ fontSize: 12 }} />}
            </IconButton>
          </Box>

          <IconButton
            onClick={goToNextSlide}
            aria-label="Next slide"
            sx={{
              width: 26,
              height: 26,
              color: "#111827",
              bgcolor: "#ffffff",
              boxShadow: "0 3px 10px rgba(0, 0, 0, 0.16)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              '&:hover': {
                bgcolor: "#f8fafc",
                transform: "translateX(2px) scale(1.1)",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.24)",
              },
            }}
          >
            <ArrowForwardIos sx={{ fontSize: 12, ml: 0.1 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Carousel;
