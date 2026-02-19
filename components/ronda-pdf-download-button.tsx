"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false }
);

const RondaPdf = dynamic(
    () => import("./ronda-pdf").then((mod) => mod.RondaPdf),
    { ssr: false }
);

interface RondaPdfDownloadButtonProps {
    ronda: any;
}

export function RondaPdfDownloadButton({ ronda }: RondaPdfDownloadButtonProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <Button
                variant="outline"
                className="h-12 px-6 rounded-xl border-primary/20 text-primary bg-primary/5 font-black text-[10px] uppercase tracking-widest opacity-50 cursor-wait"
                disabled
            >
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando...
            </Button>
        );
    }

    return (
        <PDFDownloadLink
            document={<RondaPdf ronda={ronda} />}
            fileName={`ronda-${ronda.id.slice(-6)}.pdf`}
        >
            {({ loading: pdfLoading }) => (
                <Button
                    variant="outline"
                    disabled={pdfLoading}
                    className="h-12 px-6 rounded-xl border-primary/20 text-primary bg-primary/5 font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                >
                    {pdfLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    PDF do Relatório
                </Button>
            )}
        </PDFDownloadLink>
    );
}
