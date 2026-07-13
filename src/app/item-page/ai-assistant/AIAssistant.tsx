import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import { useParams } from 'react-router-dom';
import useDocumentSummary from './hooks/useDocumentSummary';
import SummaryPanel from './SummaryPanel';
import { extractHandleFromPath, parseHandleFromUri } from '../../../utils/handle';

interface AIAssistantProps {
  handle?: string | null;
  mode: 'summary' | 'chat';
  open: boolean;
  onClose: () => void;
  onNavigate?: (page: number) => void;
  selectedPage?: number | null;
}

const AI_SERVICE_BASE_URL = 'http://localhost:8000';

const AIAssistant: React.FC<AIAssistantProps> = ({
  handle: handleProp,
  mode,
  open,
  onClose,
  onNavigate,
  selectedPage,
}) => {
  const routeParams = useParams<{ handle?: string; prefix?: string; suffix?: string }>();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [chatError, setChatError] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  const handle = useMemo(() => {
    if (handleProp?.trim()) {
      return handleProp.trim();
    }

    if (routeParams.handle?.trim()) {
      return routeParams.handle.trim();
    }

    if (routeParams.prefix?.trim() && routeParams.suffix?.trim()) {
      return `${routeParams.prefix.trim()}/${routeParams.suffix.trim()}`;
    }

    return extractHandleFromPath(window.location.pathname);
  }, [handleProp, routeParams.handle, routeParams.prefix, routeParams.suffix]);

  const {
    sections,
    loading: loadingSummary,
    error: summaryError,
    refetch,
    persistCache,
  } = useDocumentSummary(handle, open && mode === 'summary');

  const askQuestion = useCallback(async () => {
    if (!question.trim()) {
      return;
    }

    if (!handle) {
      setChatError('Handle not available for this item.');
      return;
    }

    setLoadingChat(true);
    setChatError('');

    try {
      const response = await fetch(`${AI_SERVICE_BASE_URL}/document/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          handle,
          question: question.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      setAnswer(data.answer ?? '');
    } catch (error) {
      console.error('Unable to process question:', error);
      setChatError('Unable to process your question right now.');
    } finally {
      setLoadingChat(false);
    }
  }, [handle, question]);

  useEffect(() => {
    setQuestion('');
    setAnswer('');
    setChatError('');
  }, [handle]);

  const dialogTitle = mode === 'summary' ? 'Document Summary' : 'Ask AI About This Document';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2.5,
          color: '#fff',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.16)',
            }}
          >
            {mode === 'summary' ? <SummarizeOutlinedIcon /> : <QuestionAnswerOutlinedIcon />}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {dialogTitle}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {mode === 'summary'
                ? 'A concise AI-generated overview of this document.'
                : 'Ask focused questions and review the response in one place.'}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: '#f8fafc' }}>
        {!handle && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Handle not available for this item.
          </Alert>
        )}

        {mode === 'summary' ? (
          <Box
            sx={{
              minHeight: 280,
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              bgcolor: '#fff',
              border: '1px solid #e2e8f0',
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoAwesomeOutlinedIcon sx={{ color: '#4f46e5' }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Summary
                </Typography>
              </Stack>

              <SummaryPanel
                sections={sections}
                loading={loadingSummary}
                error={summaryError}
                selectedPage={selectedPage}
                onRetry={() => void refetch()}
                onAllRendered={persistCache}
                onNavigate={(page) => {
                  if (onNavigate) {
                    onNavigate(page);
                  }
                }}
              />
            </Stack>
          </Box>
        ) : (
          <Stack spacing={2.5}>
            <Box
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                bgcolor: '#fff',
                border: '1px solid #e2e8f0',
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Ask a question
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Try asking about values, people, dates, terms, or important clauses from the document.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  fullWidth
                  label="Question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="What are the payment terms in this document?"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void askQuestion();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => void askQuestion()}
                  disabled={loadingChat || !question.trim() || !handle}
                  sx={{
                    minWidth: { xs: '100%', sm: 140 },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    boxShadow: 'none',
                  }}
                >
                  {loadingChat ? <CircularProgress size={22} color="inherit" /> : 'Ask AI'}
                </Button>
              </Stack>
            </Box>

            <Box
              sx={{
                minHeight: 240,
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                bgcolor: '#fff',
                border: '1px solid #e2e8f0',
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Response
              </Typography>
              {chatError ? (
                <Alert severity="error">{chatError}</Alert>
              ) : loadingChat ? (
                <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 160 }}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary">
                    Reviewing the document and preparing an answer...
                  </Typography>
                </Stack>
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.8,
                    color: answer ? 'text.primary' : 'text.secondary',
                  }}
                >
                  {answer || 'Your answer will appear here after you ask a question.'}
                </Typography>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { parseHandleFromUri };
export default AIAssistant;
