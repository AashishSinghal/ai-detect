"use client";

import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  base64ToBlob,
  beep,
  createBlobAndDownloadFile,
  drawOnCanvas,
  resizeCanvas,
} from "@/lib/utils";
import {
  Camera,
  FlipHorizontal,
  MoonIcon,
  PersonStanding,
  SunIcon,
  Video,
  Volume2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Rings } from "react-loader-spinner";
import Webcam from "react-webcam";
import { toast } from "sonner";
import * as cocossd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";
import SocialLinks from "@/components/social-links";

type Props = {};

let interval: any = null;
let stopTimeout: any = null;
let isMobile: boolean = false;

const HomePage = (props: Props) => {
  if (typeof window !== "undefined") {
    isMobile = /Mobile|Tablet|iPad/.test(window.navigator.userAgent);
  }
  // Refs
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // States
  const [mirrored, setMirrored] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [modal, setModal] = useState<ObjectDetection>();
  const [loading, setLoading] = useState<boolean>(true);

  // Used to Manade Media recorder
  useEffect(() => {
    if (webcamRef && webcamRef.current) {
      const stream = (webcamRef.current.video as any).captureStream();
      if (stream) {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            const recordedBlob = new Blob([e.data], { type: "video" });
            createBlobAndDownloadFile(recordedBlob, "webm");
          }
        };
        mediaRecorderRef.current.onstart = (e) => {
          setIsRecording(true);
        };

        mediaRecorderRef.current.onstop = (e) => {
          setIsRecording(false);
        };
      }
    }
  }, [webcamRef]);

  // Used to initialise the COCOSSD modals
  useEffect(() => {
    setLoading(true);
    initModal();
    console.log(isMobile);
  }, []);

  // Load model
  async function initModal() {
    const loadedModal: ObjectDetection = await cocossd.load({
      base: "mobilenet_v2",
    });
    setModal(loadedModal);
  }

  // Used to manage the Loading State
  useEffect(() => {
    if (modal) {
      setLoading(false);
    }
  }, [modal]);

  async function runPrediction() {
    if (
      modal &&
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const predictions: DetectedObject[] = await modal.detect(
        webcamRef.current.video
      );
      resizeCanvas(canvasRef, webcamRef);
      drawOnCanvas(mirrored, predictions, canvasRef.current?.getContext("2d"));
      let isPerson: boolean = false;
      if (predictions.length > 0) {
        predictions.forEach((pred) => {
          isPerson = pred.class === "person";
        });
        if (isPerson && autoRecordEnabled) {
          startRecording(false);
        }
      }
    }
  }

  // Used to manage the intervals
  useEffect(() => {
    interval = setInterval(() => runPrediction(), 100);

    return () => {
      clearInterval(interval);
    };
  }, [webcamRef.current, modal, mirrored, autoRecordEnabled]);

  return (
    <div className="flex flex-col w-screen lg:flex-row h-screen ">
      {/* Main Screen */}
      <div className="relative">
        <div className="relative lg:h-screen w-full">
          <Webcam
            ref={webcamRef}
            mirrored={mirrored}
            className="h-full w-full object-contain p-2"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 h-full w-full object-contain"
          ></canvas>
        </div>
      </div>
      {/* SidePanel */}
      <div className="flex flex-col lg:flex-row flex-1 ">
        {isMobile ? (
          <div className="border-primary/5 border-2  flex gap-2 justify-between p-2">
            <ModeToggle />
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={() => setMirrored((prev) => !prev)}
            >
              <FlipHorizontal />
            </Button>
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={userPromptScreenShot}
            >
              <Camera />
            </Button>
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size={"icon"}
              onClick={userPromptRecord}
            >
              <Video />
            </Button>
            <Button
              variant={autoRecordEnabled ? "destructive" : "outline"}
              size={"icon"}
              onClick={toggleAutoRecord}
            >
              {autoRecordEnabled ? (
                <Rings color="white" height={45} />
              ) : (
                <PersonStanding />
              )}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} size={"icon"}>
                  <Volume2 />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Slider
                  max={1}
                  min={0}
                  step={0.2}
                  defaultValue={[volume]}
                  onValueCommit={(value) => {
                    setVolume(value[0]);
                    beep(value[0]);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="border-primary/5 border-2 max-w-xs flex flex-col gap-2 justify-between p-2">
            {/* Top */}
            <div className="flex flex-col gap-2">
              <ModeToggle />
              <Button
                variant={"outline"}
                size={"icon"}
                onClick={() => setMirrored((prev) => !prev)}
              >
                <FlipHorizontal />
              </Button>
              <Separator className="my-2" />
            </div>
            {/* Middle */}
            <div className="flex flex-col gap-2">
              <Separator className="my-2" />
              <Button
                variant={"outline"}
                size={"icon"}
                onClick={userPromptScreenShot}
              >
                <Camera />
              </Button>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size={"icon"}
                onClick={userPromptRecord}
              >
                <Video />
              </Button>
              <Separator className="my-2" />
              <Button
                variant={autoRecordEnabled ? "destructive" : "outline"}
                size={"icon"}
                onClick={toggleAutoRecord}
              >
                {autoRecordEnabled ? (
                  <Rings color="white" height={45} />
                ) : (
                  <PersonStanding />
                )}
              </Button>
            </div>
            {/* Bottom */}
            <div className="flex flex-col gap-2">
              <Separator className="my-2" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} size={"icon"}>
                    <Volume2 />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Slider
                    max={1}
                    min={0}
                    step={0.2}
                    defaultValue={[volume]}
                    onValueCommit={(value) => {
                      setVolume(value[0]);
                      beep(value[0]);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <div className="h-full flex-1 py-4 px-2 overflow-y-scroll">
          <RenderFeatureHighlightsSection />
        </div>
      </div>
      {loading && (
        <div className="z-50 absolute h-full w-full flex items-center justify-center bg-primary-foreground">
          Getting things ready...
          <Rings height={50} color="red" />
        </div>
      )}
    </div>
  );

  function userPromptScreenShot() {
    // Login to take Screenshot on user propmt/click
    if (!webcamRef.current) {
      toast(`Camera is not founr. Please refresh.`);
    } else {
      const imgSrc = webcamRef.current.getScreenshot();
      const imgBlob = base64ToBlob(imgSrc);
      createBlobAndDownloadFile(imgBlob, "png");
    }
  }

  function userPromptRecord() {
    if (!webcamRef.current) {
      toast(`Camera is not founr. Please refresh.`);
    }
    if (mediaRecorderRef.current?.state == "recording") {
      // Check if recording
      // then stop recording
      // save the recording
      mediaRecorderRef.current?.requestData();
      clearTimeout(stopTimeout);
      mediaRecorderRef.current?.stop();
      toast("Recording saved to downloads");
    } else {
      // If not recording
      // start recording
      startRecording(true);
    }
  }

  function startRecording(isManual: boolean) {
    if (webcamRef.current && mediaRecorderRef.current?.state !== "recording") {
      mediaRecorderRef.current?.start();
      if (!isManual) {
        beep(volume);
      }
      stopTimeout = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.requestData();
          mediaRecorderRef.current.stop();
        }
      }, 30000);
    }
  }

  function toggleAutoRecord() {
    if (autoRecordEnabled) {
      setAutoRecordEnabled(false);
      // show toast to notify user
      toast("Auto Record Disabled");
    } else {
      setAutoRecordEnabled(true);
      // show toast to notify user
      toast("Auto Record Enabled");
    }
  }

  // Inner Components
  function RenderFeatureHighlightsSection() {
    return (
      <div className="text-xs text-muted-foreground">
        <ul className="space-y-4">
          <li>
            <strong>Dark Mode/Sys Theme 🌗</strong>
            <p>Toggle between dark mode and system theme.</p>
            <Button className="my-2 h-6 w-6" variant={"outline"} size={"icon"}>
              <SunIcon size={14} />
            </Button>{" "}
            /{" "}
            <Button className="my-2 h-6 w-6" variant={"outline"} size={"icon"}>
              <MoonIcon size={14} />
            </Button>
          </li>
          <li>
            <strong>Horizontal Flip ↔️</strong>
            <p>Adjust horizontal orientation.</p>
            <Button
              className="h-6 w-6 my-2"
              variant={"outline"}
              size={"icon"}
              onClick={() => {
                setMirrored((prev) => !prev);
              }}
            >
              <FlipHorizontal size={14} />
            </Button>
          </li>
          <Separator />
          <li>
            <strong>Take Pictures 📸</strong>
            <p>Capture snapshots at any moment from the video feed.</p>
            <Button
              className="h-6 w-6 my-2"
              variant={"outline"}
              size={"icon"}
              onClick={userPromptScreenShot}
            >
              <Camera size={14} />
            </Button>
          </li>
          <li>
            <strong>Manual Video Recording 📽️</strong>
            <p>Manually record video clips as needed.</p>
            <Button
              className="h-6 w-6 my-2"
              variant={isRecording ? "destructive" : "outline"}
              size={"icon"}
              onClick={userPromptRecord}
            >
              <Video size={14} />
            </Button>
          </li>
          <Separator />
          <li>
            <strong>Enable/Disable Auto Record 🚫</strong>
            <p>
              Option to enable/disable automatic video recording whenever
              required.
            </p>
            <Button
              className="h-6 w-6 my-2"
              variant={autoRecordEnabled ? "destructive" : "outline"}
              size={"icon"}
              onClick={toggleAutoRecord}
            >
              {autoRecordEnabled ? (
                <Rings color="white" height={30} />
              ) : (
                <PersonStanding size={14} />
              )}
            </Button>
          </li>

          <li>
            <strong>Volume Slider 🔊</strong>
            <p>Adjust the volume level of the notifications.</p>
          </li>
          <li>
            <strong>Camera Feed Highlighting 🎨</strong>
            <p>
              Highlights persons in{" "}
              <span style={{ color: "#FF0F0F" }}>red</span> and other objects in{" "}
              <span style={{ color: "#00B612" }}>green</span>.
            </p>
          </li>
          <Separator />
          <li className="space-y-4">
            <strong>Share your thoughts 💬 </strong>
            <SocialLinks />
            <br />
            <br />
            <br />
          </li>
        </ul>
      </div>
    );
  }
};

export default HomePage;
