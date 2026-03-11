import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

const CarteiraSucesso = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      navigate("/carteira");
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const { error } = await supabase.functions.invoke("wallet-api", {
          body: { action: "webhook", sessionId },
          headers,
        });

        if (!error) {
          setSuccess(true);
          queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
          queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="p-8 max-w-md w-full text-center space-y-6">
        {verifying ? (
          <>
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
            <h2 className="text-xl font-semibold">{t("wallet.verifyingPayment")}</h2>
          </>
        ) : success ? (
          <>
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold">{t("wallet.paymentSuccess")}</h2>
            <p className="text-muted-foreground">{t("wallet.paymentSuccessDescription")}</p>
            <Button onClick={() => navigate("/carteira")} className="w-full">
              {t("wallet.backToWallet")}
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-destructive">{t("wallet.paymentError")}</h2>
            <Button onClick={() => navigate("/carteira")} variant="outline" className="w-full">
              {t("wallet.backToWallet")}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default CarteiraSucesso;
