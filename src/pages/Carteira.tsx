import { ChevronRight, Plus, ChevronLeft, X, Loader2, ArrowDownCircle, ArrowUpCircle, History, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { WalletCardIcon } from "@/components/icons/WalletCardIcon";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useState } from "react";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useWalletTransactions } from "@/hooks/useWalletTransactions";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Carteira = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { balance, isLoading } = useWalletBalance();
  const { transactions, isLoading: txLoading } = useWalletTransactions();

  const quickAmounts = [10, 25, 50, 100];

  const handleAddBalance = async (value: number) => {
    if (value < 5 || value > 1000) {
      toast({ title: t("wallet.invalidAmount"), variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke("wallet-api", {
        body: { action: "create-checkout", amount: value },
        headers,
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("Error creating checkout:", err);
      toast({ title: t("wallet.balanceError"), variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawal = async () => {
    const value = parseFloat(withdrawAmount);
    if (!value || value < 5) {
      toast({ title: t("wallet.invalidAmount"), variant: "destructive" });
      return;
    }
    if (value > balance) {
      toast({ title: t("wallet.insufficientBalance"), variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke("wallet-api", {
        body: { action: "request-withdrawal", amount: value },
        headers,
      });

      if (error) throw error;

      toast({
        title: t("wallet.withdrawalRequested"),
        description: t("wallet.withdrawalRequestedDescription"),
      });
      setWithdrawOpen(false);
      setWithdrawAmount("");
    } catch (err: any) {
      console.error("Error requesting withdrawal:", err);
      toast({ title: err.message || t("wallet.balanceError"), variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="w-5 h-5 text-primary" />;
      case "withdrawal":
        return <ArrowUpCircle className="w-5 h-5 text-red-500" />;
      case "charge":
        return <Zap className="w-5 h-5 text-primary" />;
      default:
        return <History className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-primary text-white text-xs">{t("wallet.statusCompleted")}</Badge>;
      case "pending":
        return <Badge variant="secondary" className="text-xs">{t("wallet.statusPending")}</Badge>;
      case "failed":
        return <Badge variant="destructive" className="text-xs">{t("wallet.statusFailed")}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <ResponsiveLayout
      mobileHeader={
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold font-montserrat">{t("wallet.title")}</h1>
        </div>
      }
      showBottomNav
      noBorder
    >
      <div className="space-y-8 p-4 -mt-4 md:p-6 md:mt-0">
        <div className="hidden md:block space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t("wallet.title")}</h1>
          <p className="text-muted-foreground">{t("wallet.subtitle")}</p>
        </div>

        {/* Balance Card */}
        <Card className="p-6 -mt-12">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{t("wallet.balanceTitle")}</p>
              <h2 className="text-4xl font-bold mt-2 mb-4">
                {isLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  formatCurrency(balance)
                )}
              </h2>
              <div className="flex gap-2">
                {/* Add Balance Drawer */}
                <Drawer open={addOpen} onOpenChange={setAddOpen}>
                  <DrawerTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="w-4 h-4" />
                      {t("wallet.addBalance")}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="z-50">
                    <DrawerHeader className="relative border-b pb-4">
                      <DrawerTitle className="text-center font-montserrat">
                        {t("wallet.addBalance")}
                      </DrawerTitle>
                      <DrawerClose className="absolute right-4 top-4">
                        <X className="h-5 w-5" />
                      </DrawerClose>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-4 gap-2">
                        {quickAmounts.map((v) => (
                          <Button
                            key={v}
                            variant="outline"
                            onClick={() => setAmount(v.toString())}
                            className={amount === v.toString() ? "border-primary bg-primary/10 hover:bg-primary/10" : "hover:bg-muted"}
                          >
                            R$ {v}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder={t("wallet.customAmount")}
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          min={5}
                          max={1000}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{t("wallet.amountRange")}</p>
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={!amount || isProcessing}
                        onClick={() => handleAddBalance(parseFloat(amount))}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {t("wallet.proceedToPayment")}
                      </Button>
                    </div>
                  </DrawerContent>
                </Drawer>

                {/* Withdraw Drawer */}
                <Drawer open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline">
                      <ArrowUpCircle className="w-4 h-4" />
                      {t("wallet.withdraw")}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="z-50">
                    <DrawerHeader className="relative border-b pb-4">
                      <DrawerTitle className="text-center font-montserrat">
                        {t("wallet.withdraw")}
                      </DrawerTitle>
                      <DrawerClose className="absolute right-4 top-4">
                        <X className="h-5 w-5" />
                      </DrawerClose>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {t("wallet.availableBalance")}: {formatCurrency(balance)}
                      </p>
                      <Input
                        type="number"
                        placeholder={t("wallet.withdrawalAmount")}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min={5}
                        max={balance}
                      />
                      <p className="text-xs text-muted-foreground">{t("wallet.withdrawalNote")}</p>
                      <Button
                        className="w-full"
                        variant="destructive"
                        disabled={!withdrawAmount || isProcessing}
                        onClick={handleWithdrawal}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {t("wallet.requestWithdrawal")}
                      </Button>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-montserrat">{t("wallet.paymentMethods")}</h3>
          <div className="flex items-center gap-3 py-4 border-b">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <WalletCardIcon className="w-7 h-7" fill="white" />
            </div>
            <span className="text-sm font-medium">{t("wallet.walletBalance")}</span>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-montserrat">{t("wallet.transactionHistory")}</h3>
          {txLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("wallet.noTransactions")}
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <p className="text-sm font-medium">
                        {tx.type === "deposit" ? t("wallet.deposit") : tx.type === "withdrawal" ? t("wallet.withdrawalLabel") : t("wallet.chargeLabel")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${tx.type === "deposit" ? "text-primary" : "text-destructive"}`}>
                      {tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                    {getStatusBadge(tx.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Carteira;
