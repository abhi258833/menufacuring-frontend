import React from "react";
import { Pagination, Stack } from "@mui/material";

interface PaginationProps {
  totalData: number;
  perPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const PaginationComponent: React.FC<PaginationProps> = ({
  totalData,
  perPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalData / perPage);

  const handleChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    onPageChange(page);
  };

  return (
    <Stack spacing={2} alignItems="center" marginTop={2}>
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handleChange}
        color="primary"
      />
    </Stack>
  );
};

export default PaginationComponent;
