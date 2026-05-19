import * as React from "react";
import { Box, Button, TextField } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

interface DateRangePickerProps {
  onApply: (startDate: string, endDate: string) => void;
}

export default function DateRangePickerCustom({ onApply }: DateRangePickerProps) {
  const [startDate, setStartDate] = React.useState<Dayjs | null>(dayjs("2024-01-05"));
  const [endDate, setEndDate] = React.useState<Dayjs | null>(dayjs("2024-01-10"));

  // Full year range support
  const minPossibleDate = dayjs("1900-01-01");
  const maxPossibleDate = dayjs("2100-12-31");

  const handleStartDateChange = (newValue: Dayjs | null) => {
    setStartDate(newValue);
    if (newValue && endDate && newValue.isAfter(endDate, "day")) {
      setEndDate(null);
    }
  };

  const handleEndDateChange = (newValue: Dayjs | null) => {
    setEndDate(newValue);
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onApply(startDate.format("YYYY-MM-DD"), endDate.format("YYYY-MM-DD"));
    }
  };

  const isApplyDisabled = !startDate || !endDate;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ padding: 2, backgroundColor: "#e9eff2", borderRadius: "4px", marginBottom: 2 }}>

        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, marginBottom: 2 }}>
          
          {/* START DATE */}
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            minDate={minPossibleDate}
            maxDate={maxPossibleDate}
            views={["year", "month", "day"]}
            openTo="day"
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true
              } as Partial<React.ComponentProps<typeof TextField>>
            }}
          />

          {/* END DATE */}
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            minDate={minPossibleDate}
            maxDate={maxPossibleDate}
            views={["year", "month", "day"]}
            openTo="day"
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true
              } as Partial<React.ComponentProps<typeof TextField>>
            }}
          />

        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
            }}
          >
            Clear
          </Button>

          <Button
            variant="contained"
            onClick={handleApply}
            disabled={isApplyDisabled}
          >
            APPLY
          </Button>
        </Box>

      </Box>
    </LocalizationProvider>
  );
}
