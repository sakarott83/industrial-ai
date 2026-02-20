
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';
import { Mic, MicOff, Radio } from 'lucide-react';

// Manual base64 decoding implementation
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Manual base64 encoding implementation
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Manual audio decoding for raw PCM stream
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Live session opened');
            setIsActive(true);
            setIsConnecting(false);
            
            // Microphone streaming logic using ScriptProcessor for simple integration
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              // Only send if the session is ready
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                ctx,
                24000,
                1,
              );
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current) {
                source.stop();
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live API Error', e);
            setIsConnecting(false);
          },
          onclose: () => {
            console.log('Live session closed');
            setIsActive(false);
            setIsConnecting(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are an energy consultant for Lombardy, Italy. You help users find industrial companies and discuss their electricity consumption. Be concise and professional.',
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error('Failed to start Live session', error);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    for (const source of sourcesRef.current) {
      source.stop();
    }
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsActive(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 overflow-hidden relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-100 flex items-center gap-2">
          <Radio size={18} className="text-red-500 animate-pulse" />
          Live Voice Assistant
        </h3>
        {isActive && (
          <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-ping"></span>
            Online
          </span>
        )}
      </div>
      
      <p className="text-xs text-slate-400 mb-6">
        Talk to our energy consultant in real-time. Ask about industrial sectors or specific regions.
      </p>

      <button
        onClick={isActive ? stopSession : startSession}
        disabled={isConnecting}
        className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-semibold transition-all ${
          isActive 
            ? 'bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500/20' 
            : 'bg-blue-600 border border-blue-500 text-white hover:bg-blue-700'
        }`}
      >
        {isConnecting ? (
          <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
        ) : isActive ? (
          <>
            <MicOff size={20} />
            Stop Listening
          </>
        ) : (
          <>
            <Mic size={20} />
            Start Voice Conversation
          </>
        )}
      </button>

      {isActive && (
        <div className="mt-4 flex justify-center gap-1">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="w-1.5 bg-blue-500 rounded-full animate-bounce"
              style={{ height: `${Math.random() * 20 + 10}px`, animationDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveAssistant;
