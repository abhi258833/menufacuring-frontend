import React from 'react';
import { Box, TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  variant?: 'header' | 'page';
  showCloseButton?: boolean;
  onClear?: () => void;
  fullWidth?: boolean;
  minWidth?: string | number;
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
  minWidth = 320
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
  };

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
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  className="search-submit-btn"
                  onClick={onSubmit}
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
                onClick={onSubmit}
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
