import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { IconTile } from "./common";

const compare = (a, b) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
};

/**
 * One table for every list page.
 * columns: { key, label, value?(row), render?(row), align?, width?, sortable?, mobile?: "title" | "subtitle" | "hide" }
 * Sorting and paging happen in the browser; searching/filtering stays with each page's API call.
 */
export default function DataTable({
  columns,
  rows,
  getRowId = (row) => row._id,
  actions,
  toolbar,
  loading = false,
  empty,
  initialSort,
  pageSize = 25,
  minWidth = 720,
  onRowClick,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [sort, setSort] = useState(initialSort || null);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(pageSize);

  // New search/filter results start from the first page
  useEffect(() => setPage(0), [rows]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const get = col.value || ((r) => r[col.key]);
    const out = [...rows].sort((a, b) => compare(get(a), get(b)));
    return sort.dir === "desc" ? out.reverse() : out;
  }, [rows, sort, columns]);

  // Printing shows every row, not just the current page
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const before = () => setPrinting(true);
    const after = () => setPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
  const visible = printing ? sorted : sorted.slice(page * perPage, page * perPage + perPage);
  const cell = (col, row) => (col.render ? col.render(row) : (col.value ? col.value(row) : row[col.key]) ?? "—");
  const sortable = (col) => col.sortable ?? Boolean(col.value || !col.render);

  const toggleSort = (key) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const emptyBlock = (
    <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center", py: 8, px: 3 }}>
      {empty?.icon && <IconTile size={52}>{empty.icon}</IconTile>}
      {empty?.title && <Typography variant="h6">{empty.title}</Typography>}
      <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
        {empty?.text || "Nothing here yet."}
      </Typography>
    </Stack>
  );

  const titleCol = columns.find((c) => c.mobile === "title") || columns[0];
  const subtitleCol = columns.find((c) => c.mobile === "subtitle");
  const detailCols = columns.filter((c) => c !== titleCol && c !== subtitleCol && c.mobile !== "hide");

  return (
    <Paper sx={{ overflow: "hidden" }}>
      {toolbar && (
        <>
          <Box className="no-print" sx={{ py: { xs: 1.5, sm: 2 }, px: "10px" }}>
            {toolbar}
          </Box>
          <Divider className="no-print" />
        </>
      )}
      <Box sx={{ height: 3 }}>{loading && <LinearProgress sx={{ height: 3 }} />}</Box>

      {rows.length === 0 ? (
        emptyBlock
      ) : isMobile ? (
        <Stack divider={<Divider />}>
          {visible.map((row) => (
            <Box
              key={getRowId(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              sx={{ p: 2, cursor: onRowClick ? "pointer" : "default" }}
            >
              <Box sx={{ fontWeight: 600 }}>{cell(titleCol, row)}</Box>
              {subtitleCol && (
                <Typography variant="body2" color="text.secondary" component="div">
                  {cell(subtitleCol, row)}
                </Typography>
              )}
              <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2, rowGap: 0.75, mt: 1.5 }}>
                {detailCols.map((col) => (
                  <Box key={col.key} sx={{ display: "contents" }}>
                    <Typography variant="body2" color="text.secondary">
                      {col.label}
                    </Typography>
                    <Box sx={{ textAlign: "right", fontSize: 14, minWidth: 0 }}>{cell(col, row)}</Box>
                  </Box>
                ))}
              </Box>
              {actions && (
                <Stack
                  direction="row"
                  spacing={1}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ mt: 1.5, justifyContent: "flex-end", flexWrap: "wrap", rowGap: 1 }}
                >
                  {actions(row)}
                </Stack>
              )}
            </Box>
          ))}
        </Stack>
      ) : (
        <TableContainer
          sx={{ borderRadius: 0, maxHeight: "70vh", "@media print": { maxHeight: "none", overflow: "visible" } }}
        >
          <Table stickyHeader sx={{ minWidth }}>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    align={col.align}
                    sx={{ width: col.width }}
                    sortDirection={sort?.key === col.key ? sort.dir : false}
                  >
                    {sortable(col) ? (
                      <TableSortLabel
                        active={sort?.key === col.key}
                        direction={sort?.key === col.key ? sort.dir : "asc"}
                        onClick={() => toggleSort(col.key)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell align="right" className="no-print">
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{ cursor: onRowClick ? "pointer" : "default" }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      align={col.align}
                      sx={col.align === "right" ? { fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" } : undefined}
                    >
                      {cell(col, row)}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell
                      align="right"
                      className="no-print"
                      sx={{ whiteSpace: "nowrap" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
                        {actions(row)}
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {rows.length > 10 && (
        <TablePagination
          className="no-print"
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={perPage}
          onRowsPerPageChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}
    </Paper>
  );
}
