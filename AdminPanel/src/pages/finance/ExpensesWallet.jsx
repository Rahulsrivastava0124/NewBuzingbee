import { useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { BookOpen, Wallet } from "lucide-react";
import WalletLedger from "./WalletLedger";
import Expenses from "./Expenses";

const TABS = [
  { key: "wallet", label: "Wallet & Ledger", icon: <BookOpen />, Page: WalletLedger },
  { key: "expenses", label: "Expenses", icon: <Wallet />, Page: Expenses },
];

export default function ExpensesWallet() {
  const [params, setParams] = useSearchParams();
  const current = TABS.find((t) => t.key === params.get("tab")) || TABS[0];

  return (
    <Box>
      <Tabs
        className="no-print"
        value={current.key}
        onChange={(_, tab) => setParams({ tab }, { replace: true })}
        aria-label="Expenses and wallet"
        sx={{ mb: 3 }}
      >
        {TABS.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} icon={t.icon} iconPosition="start" />
        ))}
      </Tabs>
      <current.Page />
    </Box>
  );
}
