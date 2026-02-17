"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { ChevronRight, Camera, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";

type StepStatus = "OK" | "WARNING" | "CRITICAL" | "SKIPPED";

interface InspectionStep {
  id: string;
  question: string;
  requirePhoto: boolean;
  status: StepStatus;
  photoUrl?: string;
  notes?: string;
}

export default function NewInspectionPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState("");
  const [selectedAsset, setSelectedAsset] = useState("");
  const [inspectionSteps, setInspectionSteps] = useState<InspectionStep[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState(false);

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initialAssetId = params.get("assetId");
  const initialContractId = params.get("contractId");

  useEffect(() => {
    async function init() {
      await loadContracts();
      if (initialAssetId && initialContractId) {
        setSelectedContract(initialContractId);
        setSelectedAsset(initialAssetId);
        // We'll call startInspection manually after state updates
      }
    }
    init();
  }, []);

  // Effect to auto-start if params are present
  useEffect(() => {
    if (initialAssetId && initialContractId && selectedAsset === initialAssetId && contracts.length > 0) {
      startInspection();
    }
  }, [selectedAsset, contracts]);

  async function loadContracts() {
    try {
      const res = await fetch("/api/contracts");
      const data = await res.json();
      setContracts(data);
    } catch (error) {
      console.error("Error loading contracts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAssets(contractId: string) {
    if (!contractId) return;
    try {
      const res = await fetch(`/api/contracts/${contractId}/assets`);
      const data = await res.json();
      setAssets(data);
    } catch (error) {
      console.error("Error loading assets:", error);
    }
  }

  async function startInspection() {
    if (!selectedContract || !selectedAsset) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um contrato e um ativo",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: selectedContract,
          assetId: selectedAsset,
        }),
      });

      if (!res.ok) throw new Error("Erro ao iniciar inspeção");

      const data = await res.json();
      setInspectionSteps(data.steps || []);
      setStep(1);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível acessar a câmera",
      });
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const currentStep = inspectionSteps[step - 1];
    const photoDataUrl = canvas.toDataURL("image/webp", 0.8);

    const updatedSteps = [...inspectionSteps];
    updatedSteps[step - 1] = {
      ...currentStep,
      photoUrl: photoDataUrl,
    };
    setInspectionSteps(updatedSteps);
    stopCamera();

    toast({
      title: "Foto capturada",
      description: "Foto adicionada com sucesso",
    });
  }

  function updateStepStatus(status: StepStatus) {
    const updatedSteps = [...inspectionSteps];
    updatedSteps[step - 1] = {
      ...updatedSteps[step - 1],
      status,
    };
    setInspectionSteps(updatedSteps);
  }

  async function completeInspection() {
    setSaving(true);
    try {
      const res = await fetch("/api/inspections/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steps: inspectionSteps,
        }),
      });

      if (!res.ok) throw new Error("Erro ao finalizar inspeção");

      toast({
        title: "Sucesso",
        description: "Inspeção finalizada com sucesso",
      });

      router.push("/inspections");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  }

  const currentStepData = inspectionSteps[step - 1];
  const canProceed = step > 0 && currentStepData &&
    (currentStepData.status !== "SKIPPED" || currentStepData.requirePhoto === false || currentStepData.photoUrl);

  if (loading && step === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {step === 0 && (
        <>
          <div>
            <h1 className="text-3xl font-bold">Nova Ronda</h1>
            <p className="text-muted-foreground">
              Selecione o contrato e o ativo para iniciar
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuração da Ronda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Contrato</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={selectedContract}
                  onChange={(e) => {
                    setSelectedContract(e.target.value);
                    loadAssets(e.target.value);
                    setSelectedAsset("");
                  }}
                >
                  <option value="">Selecione um contrato</option>
                  {contracts.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Ativo</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  disabled={!selectedContract}
                >
                  <option value="">Selecione um ativo</option>
                  {assets.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <Button
                className="w-full"
                onClick={startInspection}
                disabled={!selectedContract || !selectedAsset || loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                Iniciar Ronda
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {step > 0 && step <= inspectionSteps.length && currentStepData && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Passo {step} de {inspectionSteps.length}</h1>
              <p className="text-muted-foreground">
                {currentStepData.question}
              </p>
            </div>
            {currentStepData.requirePhoto && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                Foto obrigatória
              </span>
            )}
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={currentStepData.status === "OK" ? "default" : "outline"}
                  className={`h-16 flex-col gap-1 ${currentStepData.status === "OK" ? "bg-green-600 hover:bg-green-700" : ""}`}
                  onClick={() => updateStepStatus("OK")}
                >
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-xs">OK</span>
                </Button>
                <Button
                  variant={currentStepData.status === "WARNING" ? "default" : "outline"}
                  className={`h-16 flex-col gap-1 ${currentStepData.status === "WARNING" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
                  onClick={() => updateStepStatus("WARNING")}
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-xs">Atenção</span>
                </Button>
                <Button
                  variant={currentStepData.status === "CRITICAL" ? "default" : "outline"}
                  className={`h-16 flex-col gap-1 ${currentStepData.status === "CRITICAL" ? "bg-red-600 hover:bg-red-700" : ""}`}
                  onClick={() => updateStepStatus("CRITICAL")}
                >
                  <XCircle className="h-5 w-5" />
                  <span className="text-xs">Crítico</span>
                </Button>
              </div>

              {currentStepData.requirePhoto && (
                <div className="space-y-2">
                  <Label>Foto Obrigatória</Label>
                  {currentStepData.photoUrl ? (
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={currentStepData.photoUrl}
                        alt="Foto capturada"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          const updated = [...inspectionSteps];
                          updated[step - 1].photoUrl = undefined;
                          setInspectionSteps(updated);
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  ) : cameraActive ? (
                    <div className="space-y-2">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full aspect-video rounded-lg bg-black"
                      />
                      <div className="flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1">
                          <Camera className="h-4 w-4 mr-2" />
                          Capturar
                        </Button>
                        <Button variant="outline" onClick={stopCamera}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={startCamera} variant="outline" className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Abrir Câmera
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Anterior
              </Button>
            )}
            {step < inspectionSteps.length ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="flex-1"
                disabled={!canProceed}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={completeInspection}
                className="flex-1"
                disabled={saving || !canProceed}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Finalizar Ronda
              </Button>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </div>
  );
}
