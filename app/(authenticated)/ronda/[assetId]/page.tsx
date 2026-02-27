"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera, Check, X, Loader2, ArrowLeft } from "lucide-react";

interface AssetQuestion {
  id: string;
  question: string;
  order: number;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  scripts: AssetQuestion[];
}

type Answer = "SIM" | "NAO";

interface QuestionAnswer {
  scriptId: string;
  question: string;
  answer: Answer;
}

export default function RondaExecutionPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fluxo da ronda
  const [step, setStep] = useState<"photo" | "questions" | "completed">("photo");
  const [photo, setPhoto] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);

  // Camera
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchAsset();
    return () => {
      // Cleanup camera on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  async function fetchAsset() {
    try {
      const res = await fetch(`/api/ronda/assets/${assetId}`);
      if (!res.ok) throw new Error("Ativo não encontrado");
      const data = await res.json();
      setAsset(data);
    } catch (error) {
      console.error("Erro ao buscar ativo:", error);
      router.push("/ronda");
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Câmera traseira
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      alert("Erro ao acessar a câmera. Verifique as permissões.");
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to data URL
    const photoData = canvas.toDataURL("image/jpeg", 0.8);
    setPhoto(photoData);

    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  }

  function retakePhoto() {
    setPhoto(null);
    startCamera();
  }

  function continueToQuestions() {
    if (!photo) return;
    setStep("questions");
  }

  function answerQuestion(answer: Answer) {
    if (!asset) return;

    const currentQuestion = asset.scripts[currentQuestionIndex];

    const newAnswer: QuestionAnswer = {
      scriptId: currentQuestion.id,
      question: currentQuestion.question,
      answer: answer
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    // Check if there are more questions
    if (currentQuestionIndex < asset.scripts.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, save and show completion
      saveRonda(newAnswers);
    }
  }

  async function saveRonda(finalAnswers: QuestionAnswer[]) {
    if (!asset) return;

    setSaving(true);

    try {
      const res = await fetch("/api/ronda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: asset.id,
          photo: photo,
          answers: finalAnswers
        })
      });

      if (!res.ok) throw new Error("Erro ao salvar ronda");

      setStep("completed");
    } catch (error) {
      console.error("Erro ao salvar ronda:", error);
      alert("Erro ao salvar a ronda. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-bold text-muted-foreground uppercase tracking-widest">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  if (!asset) return null;

  // STEP 1: PHOTO CAPTURE
  if (step === "photo") {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header */}
        <div className="bg-primary text-white p-4 flex items-center gap-3 shadow-2xl z-10">
          <button
            onClick={() => router.push("/ronda")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black uppercase tracking-tight">{asset.name}</h1>
            <p className="text-xs opacity-90 font-bold uppercase tracking-wide">
              Passo 1: Foto do Equipamento
            </p>
          </div>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative flex items-center justify-center bg-black">
          {!isCameraActive && !photo && (
            <div className="text-center p-6">
              <Camera className="h-24 w-24 text-white/40 mx-auto mb-6" />
              <p className="text-white text-2xl font-black uppercase mb-2">Foto Obrigatória</p>
              <p className="text-white/60 text-sm font-bold uppercase tracking-wide mb-8">
                Tire uma foto do equipamento antes de continuar
              </p>
              <Button
                onClick={startCamera}
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-lg px-12 py-8 rounded-2xl shadow-2xl h-auto"
              >
                <Camera className="h-6 w-6 mr-3" />
                Abrir Câmera
              </Button>
            </div>
          )}

          {isCameraActive && !photo && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="h-20 w-20 bg-white rounded-full border-4 border-white/30 shadow-2xl active:scale-95 transition-transform flex items-center justify-center"
                >
                  <div className="h-16 w-16 bg-white rounded-full" />
                </button>
              </div>
            </>
          )}

          {photo && !isCameraActive && (
            <>
              <img src={photo} alt="Captured" className="w-full h-full object-contain" />
              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-4">
                <Button
                  onClick={retakePhoto}
                  size="lg"
                  variant="outline"
                  className="bg-black/50 text-white border-white/30 hover:bg-black/70 font-black uppercase tracking-widest text-base px-8 py-6 rounded-2xl h-auto backdrop-blur-sm"
                >
                  <X className="h-5 w-5 mr-2" />
                  Tirar Novamente
                </Button>
                <Button
                  onClick={continueToQuestions}
                  size="lg"
                  className="bg-green-500 hover:bg-green-600 font-black uppercase tracking-widest text-base px-12 py-6 rounded-2xl shadow-2xl h-auto"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Continuar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // STEP 2: QUESTIONS
  if (step === "questions") {
    const currentQuestion = asset.scripts[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / asset.scripts.length) * 100;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header with photo preview */}
        <div className="bg-primary text-white p-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-lg overflow-hidden border-2 border-white/30 flex-shrink-0">
              {photo && <img src={photo} alt="Asset" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-black uppercase tracking-tight truncate">{asset.name}</h1>
              <p className="text-xs opacity-90 font-bold uppercase tracking-wide">
                Pergunta {currentQuestionIndex + 1} de {asset.scripts.length}
              </p>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-4xl font-black uppercase leading-tight text-foreground max-w-2xl">
            {currentQuestion.question}
          </p>
        </div>

        {/* Answer Buttons */}
        <div className="p-6 space-y-4 pb-8">
          <Button
            onClick={() => answerQuestion("SIM")}
            disabled={saving}
            className="w-full h-24 bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest text-3xl rounded-2xl shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-8 w-8 animate-spin" /> : "SIM"}
          </Button>
          <Button
            onClick={() => answerQuestion("NAO")}
            disabled={saving}
            className="w-full h-24 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-3xl rounded-2xl shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-8 w-8 animate-spin" /> : "NÃO"}
          </Button>
        </div>
      </div>
    );
  }

  // STEP 3: COMPLETED
  if (step === "completed") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8">
          <div className="h-32 w-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/30">
            <Check className="h-20 w-20 text-white" />
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tight text-foreground mb-4">
            Checklist Finalizado
          </h1>
          <p className="text-xl text-muted-foreground font-bold uppercase tracking-wide">
            {asset.name}
          </p>
          <p className="text-sm text-muted-foreground/60 font-bold uppercase tracking-widest mt-2">
            {asset.scripts.length} perguntas respondidas
          </p>
        </div>

        <div className="space-y-3 w-full max-w-md">
          <Button
            onClick={() => router.push("/ronda")}
            size="lg"
            className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-lg rounded-2xl shadow-2xl"
          >
            Nova Ronda
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            size="lg"
            variant="outline"
            className="w-full h-16 font-black uppercase tracking-widest text-lg rounded-2xl"
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
