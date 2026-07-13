import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { SummaryPanelProps } from './types';
import useTypewriter from './hooks/useTypewriter';
import './SummaryPanel.css';

interface SummaryCardProps {
  page: number;
  title: string;
  summary: string;
  selected: boolean;
  active: boolean;
  completed: boolean;
  instantRender: boolean;
  onNavigate: (page: number) => void;
  onTypingComplete: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  page,
  title,
  summary,
  selected,
  active,
  completed,
  instantRender,
  onNavigate,
  onTypingComplete,
}) => {
  const shouldShowFullText = instantRender || completed;
  const [titleTypingComplete, setTitleTypingComplete] = useState(shouldShowFullText);

  useEffect(() => {
    setTitleTypingComplete(shouldShowFullText);
  }, [shouldShowFullText, page]);

  const { displayedText, showCursor } = useTypewriter({
    text: summary,
    speed: 16,
    enabled: shouldShowFullText || (active && titleTypingComplete),
    immediate: shouldShowFullText,
    preserveOnDisable: true,
    onComplete: active && titleTypingComplete ? onTypingComplete : undefined,
  });

  const { displayedText: displayedTitle, showCursor: showTitleCursor } = useTypewriter({
    text: title || `Page ${page}`,
    speed: 14,
    enabled: active || shouldShowFullText,
    immediate: shouldShowFullText,
    preserveOnDisable: true,
    onComplete: active ? () => setTitleTypingComplete(true) : undefined,
  });

  const { displayedText: displayedPage } = useTypewriter({
    text: `Page ${page}`,
    speed: 14,
    enabled: active || shouldShowFullText,
    immediate: shouldShowFullText,
    preserveOnDisable: true,
  });

  return (
    <Card
      elevation={selected ? 4 : 1}
      className={`summary-panel-card${selected ? ' summary-panel-card-selected' : ''}`}
    >
      <CardActionArea
        className="summary-panel-action"
        onClick={() => onNavigate(page)}
        aria-label={`Go to page ${page}`}
      >
        <CardContent className="summary-panel-content">
          <Box className="summary-panel-heading">
            <DescriptionOutlinedIcon fontSize="small" color="action" />
            <Typography variant="subtitle1" fontWeight={700}>
              {displayedTitle}
              {showTitleCursor ? <Box component="span" className="summary-panel-cursor">▌</Box> : null}
            </Typography>
          </Box>

          <Typography className="summary-panel-page">{displayedPage}</Typography>

          <Typography variant="body2" color="text.secondary" className="summary-panel-summary">
            {displayedText}
            {showCursor ? <Box component="span" className="summary-panel-cursor">▌</Box> : null}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const SummaryPanel: React.FC<SummaryPanelProps> = ({
  sections,
  onNavigate,
  selectedPage,
  loading,
  error,
  onRetry,
  instantRender = false,
  onAllRendered,
}) => {
  const [visibleSections, setVisibleSections] = useState<typeof sections>([]);
  const [typingIndex, setTypingIndex] = useState(-1);
  const renderedIndexesRef = useRef<Set<number>>(new Set());
  const nextSectionTimerRef = useRef<number | null>(null);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const visibleCount = visibleSections.length;

  const allPagesKey = useMemo(
    () => sections.map((section) => `${section.page}:${section.title}:${section.summary}`).join('|'),
    [sections]
  );

  useEffect(() => {
    if (nextSectionTimerRef.current) {
      window.clearTimeout(nextSectionTimerRef.current);
      nextSectionTimerRef.current = null;
    }

    renderedIndexesRef.current = new Set();

    if (sections.length === 0) {
      setVisibleSections([]);
      setTypingIndex(-1);
      return;
    }

    if (instantRender) {
      setVisibleSections(sections);
      setTypingIndex(-1);
      onAllRendered?.();
      return;
    }

    setVisibleSections([sections[0]]);
    setTypingIndex(0);
  }, [allPagesKey, instantRender, onAllRendered, sections]);

  useEffect(() => {
    if (visibleCount === 0) {
      return;
    }

    const newestSection = visibleSections[visibleCount - 1];
    cardRefs.current[newestSection.page]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [visibleCount, visibleSections]);

  useEffect(() => {
    return () => {
      if (nextSectionTimerRef.current) {
        window.clearTimeout(nextSectionTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <Stack spacing={1.5} className="summary-panel-root">
        {Array.from({ length: 3 }, (_, index) => (
          <Box key={index} className="summary-panel-skeleton-row">
            <Skeleton variant="text" width="55%" />
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="rounded" height={52} />
          </Box>
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={1.5} className="summary-panel-state">
        <Alert severity="error">Unable to generate summary.</Alert>
        <Box>
          <Button variant="outlined" onClick={onRetry}>
            Retry
          </Button>
        </Box>
      </Stack>
    );
  }

  if (sections.length === 0) {
    return (
      <Box className="summary-panel-state">
        <Typography variant="body2" color="text.secondary">
          No AI Summary Available
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="summary-panel-root">
      <Box className="summary-panel-grid">
        {visibleSections.map((section, index) => {
          const isSelected = selectedPage === section.page;
          const isActive = instantRender ? false : index === typingIndex;
          const isCompleted = instantRender || renderedIndexesRef.current.has(index) || index < typingIndex;

          return (
            <Box
              key={`${section.page}-${section.title}`}
              ref={(node: HTMLDivElement | null) => {
                cardRefs.current[section.page] = node;
              }}
            >
              <SummaryCard
                page={section.page}
                title={section.title}
                summary={section.summary}
                selected={isSelected}
                active={isActive}
                completed={isCompleted}
                instantRender={instantRender}
                onNavigate={onNavigate}
                onTypingComplete={() => {
                  if (instantRender || renderedIndexesRef.current.has(index)) {
                    return;
                  }

                  renderedIndexesRef.current.add(index);

                  if (index >= sections.length - 1) {
                    setTypingIndex(-1);
                    onAllRendered?.();
                    return;
                  }

                  nextSectionTimerRef.current = window.setTimeout(() => {
                    setVisibleSections((previous) => {
                      if (previous.length > index + 1) {
                        return previous;
                      }

                      return [...previous, sections[index + 1]];
                    });
                    setTypingIndex(index + 1);
                    nextSectionTimerRef.current = null;
                  }, 500);
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default SummaryPanel;
