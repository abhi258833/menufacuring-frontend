import React, { useEffect, useRef, useState } from 'react';
import { Box, TextField, InputAdornment, IconButton, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import './SearchBar.css';

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<{
    isFinal?: boolean;
    0: {
      transcript: string;
    };
  }>;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstanceLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionInstanceLike;

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query?: string) => void;
  placeholder?: string;
  variant?: 'header' | 'page';
  showCloseButton?: boolean;
  onClear?: () => void;
  fullWidth?: boolean;
  minWidth?: string | number;
  enableVoiceSearch?: boolean;
  voiceLanguage?: string;
  onVoiceError?: (message: string) => void;
  autoSubmitOnVoiceEnd?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'What are you looking for?',
  variant = 'header',
  showCloseButton = false,
  onClear,
  fullWidth = true,
  minWidth = 320,
  enableVoiceSearch = false,
  voiceLanguage = 'en-US',
  onVoiceError,
  autoSubmitOnVoiceEnd = true
}) => {
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const isListeningRef = useRef(false);
  const voiceTranscriptRef = useRef('');
  const voiceAutoSubmittedRef = useRef(false);
  const voiceSubmitTimeoutRef = useRef<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit(value);
    }
  };

  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
  };

  const handleVoiceError = (message: string) => {
    setVoiceError(message);
    onVoiceError?.(message);
  };

  const clearVoiceSubmitTimeout = () => {
    if (voiceSubmitTimeoutRef.current !== null) {
      window.clearTimeout(voiceSubmitTimeoutRef.current);
      voiceSubmitTimeoutRef.current = null;
    }
  };

  const submitVoiceTranscript = (transcript: string) => {
    const trimmedTranscript = transcript.trim();

    if (!autoSubmitOnVoiceEnd || !trimmedTranscript || voiceAutoSubmittedRef.current) {
      return;
    }

    voiceAutoSubmittedRef.current = true;
    onSubmit(trimmedTranscript);
  };

  const stopRecognition = (shouldAbort = false) => {
    const recognition = recognitionRef.current;

    if (recognition) {
      if (shouldAbort) {
        recognition.abort();
      } else {
        recognition.stop();
      }
    }

    isListeningRef.current = false;
    voiceAutoSubmittedRef.current = false;
    clearVoiceSubmitTimeout();
    setIsListening(false);
  };

  const startRecognition = () => {
    if (typeof window === 'undefined') {
      handleVoiceError('Voice search is only available in the browser.');
      return;
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructorLike;
      webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
    };

    const SpeechRecognitionAPI = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      handleVoiceError('Voice search is not supported in this browser.');
      return;
    }

    setVoiceError('');
    voiceTranscriptRef.current = '';
    voiceAutoSubmittedRef.current = false;
    clearVoiceSubmitTimeout();

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = voiceLanguage;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const typedResults = Array.from(event.results as ArrayLike<{ isFinal?: boolean; 0: { transcript: string } }>);
        const transcript = typedResults
          .map((result) => result[0]?.transcript || '')
          .join('')
          .trim();

        voiceTranscriptRef.current = transcript;

        // Keep the controlled input aligned with the spoken transcript so search behaves like typed text.
        onChange(transcript);

        clearVoiceSubmitTimeout();
        voiceSubmitTimeoutRef.current = window.setTimeout(() => {
          submitVoiceTranscript(transcript);
        }, 700);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        const messageByError: Record<string, string> = {
          aborted: 'Voice capture was stopped.',
          'audio-capture': 'No microphone was detected.',
          network: 'Voice search is unavailable right now.',
          'not-allowed': 'Microphone access was denied. Please allow permission and try again.',
          'service-not-allowed': 'Voice search is not available for this browser or origin.',
          'no-speech': 'No speech was detected. Please try again.',
        };

        voiceTranscriptRef.current = '';
        handleVoiceError(messageByError[event.error] || 'Voice search failed. Please try again.');
        stopRecognition(true);
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    recognitionRef.current.lang = voiceLanguage;

    try {
      isListeningRef.current = true;
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error) {
      voiceTranscriptRef.current = '';
      handleVoiceError('Unable to start voice search. Please try again.');
      stopRecognition(false);
    }
  };

  const toggleVoiceSearch = () => {
    if (!enableVoiceSearch) {
      return;
    }

    if (isListeningRef.current) {
      stopRecognition();
      return;
    }

    startRecognition();
  };

  useEffect(() => {
    return () => {
      clearVoiceSubmitTimeout();
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const voiceHelperText = voiceError ? (
    <Typography className="voice-search-helper" variant="caption">
      {voiceError}
    </Typography>
  ) : null;

  const voiceButton = enableVoiceSearch ? (
    <IconButton
      className={`voice-search-btn ${isListening ? 'listening' : ''}`}
      onClick={toggleVoiceSearch}
      edge="end"
      aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
      aria-pressed={isListening}
      title={isListening ? 'Stop listening' : 'Voice search'}
      sx={{
        width: 34,
        height: 34,
        mr: 0.5,
      }}
    >
      {isListening ? <FaMicrophoneSlash size={15} /> : <FaMicrophone size={15} />}
    </IconButton>
  ) : null;

  if (variant === 'page') {
    return (
      <div className="search-bar-container page-search">
        <TextField
          className="search-bar search-bar-page"
          variant="outlined"
          fullWidth={fullWidth}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          helperText={voiceError || ' '}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {voiceButton}
                <IconButton
                  className="search-submit-btn"
                  onClick={() => onSubmit(value)}
                  edge="end"
                  sx={{
                    width: 34,
                    height: 34,
                    color: '#FFFFFF',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    },
                  }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: minWidth,
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '32px',
            height: '44px',
            '& .MuiInputBase-input': {
              fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
              padding: '10px 12px',
            },
            '& .MuiInputBase-root': {
              height: '44px',
              fontSize: 14,
              paddingLeft: '8px',
              paddingRight: '8px',
              borderRadius: '32px',
              backgroundColor: '#FFFFFF',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#D8CCFB',
              borderWidth: '2px',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#BCA5FA',
            },
            '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#8b5cf6',
            },
          }}
        />
      </div>
    );
  }

  return (
    <Box className="search-bar-container header-search" display="flex" alignItems="center" height={44}>
      <TextField
        className="search-bar search-bar-header"
        variant="outlined"
        size="small"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        helperText={voiceError || ' '}
        sx={{
          minWidth: minWidth,
          width: fullWidth ? '100%' : 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '32px',
          height: '100%',
          '& .MuiInputBase-input': {
            fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
            padding: '10px 0',
          },
          '& .MuiInputBase-root': {
            height: '100%',
            fontSize: 14,
            paddingLeft: '8px',
            paddingRight: '8px',
            borderRadius: '32px',
            backgroundColor: '#FFFFFF',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D8CCFB',
            borderWidth: '2px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#BCA5FA',
          },
          '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#8b5cf6',
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {voiceButton}
              {showCloseButton && value ? (
                <IconButton
                  className="search-close-btn"
                  onClick={handleClear}
                  edge="end"
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              ) : null}
              <IconButton
                className="search-submit-btn"
                onClick={() => onSubmit(value)}
                edge="end"
                sx={{
                  width: 34,
                  height: 34,
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  },
                }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar;
